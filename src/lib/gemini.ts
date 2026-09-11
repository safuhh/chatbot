import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { ChatMessage, Attachment } from "@/components/chat/types";

const apiKey =
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || "";

// Use gemini-3.6-flash — the model this API key is provisioned for.
// NOTE: gemini-3.6-flash is a "thinking" model whose stream chunks include
// thought-signature-only parts (no text). The SDK's chunk.text() silently
// returns "" for those chunks, causing empty responses. We manually extract
// text from candidates[0].content.parts to work around this.
const MODEL_NAME = "gemini-3.6-flash";

const SYSTEM_INSTRUCTION =
  "You are Safvan AI, a helpful, intelligent, precise, and friendly general-purpose AI assistant. " +
  "Answer user queries directly, accurately, and thoroughly. " +
  "Provide clean, well-formatted responses. " +
  "When asked about programming, provide working code snippets with explanations. " +
  "Analyze attached images or code files when provided. " +
  "Give direct answers for factual queries. " +
  "Never simply repeat or rephrase the user's prompt.";

// Initialize Gemini client
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ── Time / Date shortcut ──────────────────────────────────────────────────────

function detectTimeOrDateQuery(prompt: string): string | null {
  const lower = prompt.toLowerCase().trim();

  const isTimeQuery =
    /\b(what('s|\s+is)\s+(the\s+)?time|what\s+time\s+is\s+it|current\s+time|tell\s+me\s+the\s+time|time\s+now)\b/i.test(
      lower
    );
  const isDateQuery =
    /\b(what('s|\s+is)\s+(today'?s\s+)?date|what\s+date\s+is\s+it|current\s+date|today'?s\s+date|what\s+day\s+is\s+today|what\s+is\s+today)\b/i.test(
      lower
    );

  const now = new Date();

  if (isTimeQuery) {
    const timeStr = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
    return `It's **${timeStr}** right now (${timezone.replace(/_/g, " ")}).`;
  }

  if (isDateQuery) {
    const dateStr = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `Today is **${dateStr}**.`;
  }

  return null;
}

// ── Chunk text extractor ──────────────────────────────────────────────────────
// gemini-3.6-flash is a thinking model. Its stream emits chunks of two kinds:
//   1. Text parts:  { text: "..." }
//   2. Thought parts: { thoughtSignature: "...", text: "" }  ← SDK returns "" for these
// We read parts directly from the raw response object so we never miss actual text.

function extractTextFromChunk(chunk: unknown): string {
  try {
    const c = chunk as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string; thoughtSignature?: string }>;
        };
      }>;
    };
    const parts = c?.candidates?.[0]?.content?.parts ?? [];
    return parts
      .filter((p) => p.text && !p.thoughtSignature) // skip pure thought chunks
      .map((p) => p.text ?? "")
      .join("");
  } catch {
    return "";
  }
}

// ── Main streaming function ───────────────────────────────────────────────────

/**
 * Streams a Gemini chat response chunk-by-chunk.
 * Calls onChunk with the accumulated text so far on each new token.
 * Returns the full final response string.
 */
export async function streamGeminiChat(
  chatHistory: ChatMessage[] = [],
  userPrompt: string,
  onChunk: (accumulatedText: string) => void,
  attachments: Attachment[] = []
): Promise<string> {
  // 1. Local time / date shortcut (no API call needed)
  const timeOrDateAnswer = detectTimeOrDateQuery(userPrompt);
  if (timeOrDateAnswer && attachments.length === 0) {
    return streamTextChunked(timeOrDateAnswer, onChunk);
  }

  // 2. API key guard
  if (!apiKey) {
    return streamTextChunked(
      "⚠️ **No Gemini API key.** Add `VITE_GEMINI_API_KEY` to your `.env` file and restart the dev server. Get a key at [Google AI Studio](https://aistudio.google.com/app/apikey).",
      onChunk
    );
  }

  if (!genAI) {
    return streamTextChunked(
      "⚠️ **Gemini client failed to initialize.** Check your API key and restart the dev server.",
      onChunk
    );
  }

  // 3. Build conversation history (filter out empty assistant placeholders)
  const formattedHistory: Content[] = chatHistory
    .filter((msg) => msg.content.trim() !== "")
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

  // 4. Build multimodal prompt parts
  const promptParts: (string | Part)[] = [];

  for (const att of attachments) {
    if (att.isImage && att.base64) {
      promptParts.push({
        inlineData: {
          mimeType: att.type || "image/jpeg",
          data: att.base64,
        },
      });
    } else if (att.text) {
      promptParts.push(
        `[Attached File: ${att.name}]\n\`\`\`\n${att.text}\n\`\`\``
      );
    } else if (att.base64) {
      promptParts.push({
        inlineData: {
          mimeType: att.type || "application/octet-stream",
          data: att.base64,
        },
      });
    }
  }

  if (userPrompt.trim()) {
    promptParts.push(userPrompt);
  } else if (attachments.length > 0) {
    promptParts.push("Please analyze the attached file(s).");
  }

  const messageInput =
    promptParts.length === 1 && typeof promptParts[0] === "string"
      ? promptParts[0]
      : promptParts;

  // 5. Stream from Gemini
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessageStream(messageInput);

    let accumulatedText = "";

    for await (const chunk of result.stream) {
      // Use our custom extractor instead of chunk.text() to handle thinking chunks
      const chunkText = extractTextFromChunk(chunk);
      if (chunkText) {
        accumulatedText += chunkText;
        onChunk(accumulatedText);
      }
    }

    if (accumulatedText.trim().length > 0) {
      return accumulatedText;
    }

    // Fallback: if stream yielded no text, try aggregateResponse
    try {
      const aggregated = await result.response;
      const fallbackText = aggregated.text();
      if (fallbackText.trim()) {
        return streamTextChunked(fallbackText, onChunk);
      }
    } catch {
      // ignore aggregation errors
    }

    return streamTextChunked(
      "⚠️ Gemini returned an empty response. Please try again.",
      onChunk
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Safvan AI] Gemini error:", message);

    let errorMsg: string;

    if (message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
      errorMsg = `⚠️ **Quota exceeded.** The free tier daily limit has been reached.\n\nPlease wait and try again, or upgrade your API plan at [Google AI Studio](https://aistudio.google.com/app/apikey).`;
    } else if (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("API_KEY") ||
      message.includes("UNAUTHENTICATED")
    ) {
      errorMsg = `⚠️ **Invalid API key.** Update \`VITE_GEMINI_API_KEY\` in your \`.env\` file with a valid key from [Google AI Studio](https://aistudio.google.com/app/apikey), then restart the dev server.`;
    } else if (message.includes("404") || message.includes("not found")) {
      errorMsg = `⚠️ **Model not available.** The model \`${MODEL_NAME}\` is not accessible with your API key. Please check your Google AI Studio account.`;
    } else {
      errorMsg = `⚠️ **Safvan AI error:** ${message}`;
    }

    return streamTextChunked(errorMsg, onChunk);
  }
}

// ── Simulated word-by-word streaming (for local/error messages) ───────────────

async function streamTextChunked(
  text: string,
  onChunk: (accumulatedText: string) => void
): Promise<string> {
  const words = text.split(" ");
  let accumulated = "";
  for (const word of words) {
    accumulated += (accumulated ? " " : "") + word;
    onChunk(accumulated);
    await new Promise<void>((r) => setTimeout(r, 18));
  }
  return accumulated;
}
