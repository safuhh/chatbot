/**
 * ai.ts — Safvan AI integration via OpenRouter.
 *
 * Uses the OpenAI-compatible OpenRouter API with SSE streaming.
 * No third-party SDK required — plain fetch.
 *
 * Model: inclusionai/ling-3.0-flash-vl:free
 * API:   https://openrouter.ai/api/v1/chat/completions
 */

import { ChatMessage, Attachment } from "@/components/chat/types";
import { buildCacheKey, getCached, setCached } from "./responseCache";

const getApiKey = (): string => {
  return (
    (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) ||
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    ""
  );
};


const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are Safvan AI, a helpful, intelligent, precise, and friendly general-purpose AI assistant. " +
  "You were created by Safvan, a Software Developer from Palakkad, Mannarkkad, Kerala. " +
  "When asked who created, built, developed, or made you, always reply: 'Safvan AI was created by Safvan, a Software Developer from Palakkad, Mannarkkad, Kerala.' " +
  "Answer user queries directly, accurately, and thoroughly. " +
  "Provide clean, well-formatted responses. " +
  "When asked about programming, provide working code snippets with explanations. " +
  "Analyze attached images or code files when provided. " +
  "Give direct answers for factual queries. " +
  "Never simply repeat or rephrase the user's prompt.";

// Max history turns to send per request — older messages are trimmed to
// keep token count low and reduce time-to-first-token.
const MAX_HISTORY = 20;

// ── Creator / Time / Date shortcuts ──────────────────────────────────────────

function detectCreatorQuery(prompt: string): string | null {
  const lower = prompt.toLowerCase().trim();
  const isCreator =
    /\b(who\s+(created|built|developed|made|designed|owns)\s+(you|this\s+(bot|chatbot|ai|app))|who('s|\s+is)\s+(your\s+creator|behind\s+safvan\s+ai|the\s+creator)|tell\s+me\s+about\s+(the\s+creator|your\s+creator)|who\s+is\s+safvan)\b/i.test(
      lower
    );

  if (isCreator) {
    return "Safvan AI was created by **Safvan**, a Software Developer from Palakkad, Mannarkkad, Kerala.";
  }
  return null;
}

function detectTimeOrDateQuery(prompt: string): string | null {
  const lower = prompt.toLowerCase().trim();
  const isTime =
    /\b(what('s|\s+is)\s+(the\s+)?time|what\s+time\s+is\s+it|current\s+time|tell\s+me\s+the\s+time|time\s+now)\b/i.test(
      lower
    );
  const isDate =
    /\b(what('s|\s+is)\s+(today'?s\s+)?date|what\s+date\s+is\s+it|current\s+date|today'?s\s+date|what\s+day\s+is\s+today|what\s+is\s+today)\b/i.test(
      lower
    );
  const now = new Date();
  if (isTime) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
    return `It's **${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}** right now (${tz.replace(/_/g, " ")}).`;
  }
  if (isDate) {
    return `Today is **${now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}**.`;
  }
  return null;
}

// ── OpenRouter message types ──────────────────────────────────────────────────

interface ORTextContent {
  type: "text";
  text: string;
}

interface OROImageContent {
  type: "image_url";
  image_url: { url: string };
}

type OROContent = string | (ORTextContent | OROImageContent)[];

interface OROMessage {
  role: "system" | "user" | "assistant";
  content: OROContent;
}

// ── Build OpenRouter message list ─────────────────────────────────────────────

function buildMessages(
  history: ChatMessage[],
  userPrompt: string,
  attachments: Attachment[]
): OROMessage[] {
  const messages: OROMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Trim history and add it
  const trimmed = history.slice(-MAX_HISTORY).filter((m) => m.content.trim());
  for (const msg of trimmed) {
    messages.push({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  // Build the current user turn (may be multimodal)
  if (attachments.length === 0) {
    messages.push({ role: "user", content: userPrompt || "Please help me." });
  } else {
    const parts: (ORTextContent | OROImageContent)[] = [];

    for (const att of attachments) {
      if (att.isImage && att.base64) {
        parts.push({
          type: "image_url",
          image_url: {
            url: `data:${att.type || "image/jpeg"};base64,${att.base64}`,
          },
        });
      } else if (att.text) {
        parts.push({
          type: "text",
          text: `[Attached File: ${att.name}]\n\`\`\`\n${att.text}\n\`\`\``,
        });
      } else if (att.base64) {
        // Binary file — send as base64 data URL
        parts.push({
          type: "image_url",
          image_url: {
            url: `data:${att.type || "application/octet-stream"};base64,${att.base64}`,
          },
        });
      }
    }

    if (userPrompt.trim()) {
      parts.push({ type: "text", text: userPrompt });
    } else {
      parts.push({ type: "text", text: "Please analyze the attached file(s)." });
    }

    messages.push({ role: "user", content: parts });
  }

  return messages;
}

// ── SSE stream parser ─────────────────────────────────────────────────────────

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ": OPENROUTER PROCESSING") continue;
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data) as {
            choices?: Array<{
              delta?: { content?: string | null };
              finish_reason?: string | null;
            }>;
            error?: { message: string };
          };

          if (json.error) {
            throw new Error(json.error.message);
          }

          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch (parseErr) {
          // Silently skip malformed SSE frames
          if (parseErr instanceof SyntaxError) continue;
          throw parseErr;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

const MODEL_BATCHES = [
  ["google/gemma-4-31b-it:free", "inclusionai/ling-3.0-flash-vl:free", "nex-agi/nex-n2.5-pro:free"],
  ["nvidia/nemotron-3.5-lightning:free", "cohere/north-mini-code:free", "liquid/lfm-2.5-2.6b:free"],
];

// ── Main streaming function ───────────────────────────────────────────────────

/**
 * Streams an OpenRouter AI response token-by-token.
 * Calls onChunk(accumulatedText) on each new token.
 * Returns the full response string when done.
 * Uses 3-model fallback arrays supported natively by OpenRouter + client-side batch retries.
 *
 * @param chatHistory  Previous messages in this conversation.
 * @param userPrompt   The user's message.
 * @param onChunk      Called with accumulated text on each token.
 * @param attachments  Optional file/image attachments.
 * @param skipCache    true for Temporary Chat — bypass cache entirely.
 */
export async function streamGeminiChat(
  chatHistory: ChatMessage[] = [],
  userPrompt: string,
  onChunk: (accumulatedText: string) => void,
  attachments: Attachment[] = [],
  skipCache = false
): Promise<string> {
  // 1. Creator info / time / date shortcut — zero latency, no API call
  const creatorInfo = detectCreatorQuery(userPrompt);
  if (creatorInfo && attachments.length === 0) {
    return streamTextChunked(creatorInfo, onChunk);
  }

  const timeOrDate = detectTimeOrDateQuery(userPrompt);
  if (timeOrDate && attachments.length === 0) {
    return streamTextChunked(timeOrDate, onChunk);
  }

  // 2. API key guard
  const activeApiKey = getApiKey();
  if (!activeApiKey) {
    return streamTextChunked(
      "I am currently unable to process requests. Please configure `VITE_OPENROUTER_API_KEY` in `.env`.",
      onChunk
    );
  }

  // 3. Cache check (text-only, context-free prompts only; never for Temporary Chat)
  const cacheKey =
    !skipCache && attachments.length === 0
      ? buildCacheKey(userPrompt, chatHistory.length)
      : null;

  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) {
      // Replay instantly from cache — no API call
      return streamTextChunked(cached, onChunk, 6);
    }
  }

  // 4. Build request payload
  const messages = buildMessages(chatHistory, userPrompt, attachments);

  // 5. Call OpenRouter with model batch fallback logic
  let lastErrorMsg = "";
  let isRateLimited = false;

  for (const batch of MODEL_BATCHES) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activeApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Safvan AI",
        },
        body: JSON.stringify({
          models: batch,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        let errMsg = errBody;
        try {
          const json = JSON.parse(errBody) as { error?: { message?: string } };
          errMsg = json.error?.message ?? errBody;
        } catch {
          // ignore
        }

        if (
          response.status === 429 ||
          response.status === 404 ||
          response.status === 503 ||
          errMsg.includes("429") ||
          errMsg.includes("404") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("No endpoints found")
        ) {
          if (response.status === 429 || errMsg.includes("rate limit")) {
            isRateLimited = true;
          }
          console.warn(
            `[Safvan AI] OpenRouter batch (${batch.join(", ")}) returned ${response.status}. Trying next model batch...`
          );
          lastErrorMsg = errMsg;
          continue; // Try next model batch
        }

        console.error(`[OpenRouter API Error] HTTP ${response.status}:`, errMsg);
        lastErrorMsg = errMsg;
        break;
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      // 6. Stream SSE tokens
      let accumulatedText = "";
      for await (const token of parseSSEStream(response.body)) {
        accumulatedText += token;
        onChunk(accumulatedText);
      }

      if (accumulatedText.trim()) {
        if (cacheKey) setCached(cacheKey, accumulatedText);
        return accumulatedText;
      }
    } catch (error: unknown) {
      lastErrorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Safvan AI] Batch attempt error:`, lastErrorMsg);
    }
  }

  // 7. Error fallback display if all model attempts failed
  let errorMsg: string;
  if (isRateLimited || lastErrorMsg.includes("429") || lastErrorMsg.includes("rate limit")) {
    errorMsg = "⚠️ **Rate limit reached.** All free tier AI models are currently busy. Please wait 10–15 seconds and try sending your message again.";
  } else if (lastErrorMsg.includes("401") || lastErrorMsg.includes("403") || lastErrorMsg.includes("API key")) {
    errorMsg = "⚠️ **Invalid API key.** Please check `VITE_OPENROUTER_API_KEY` in your `.env` file.";
  } else if (lastErrorMsg.includes("fetch") || lastErrorMsg.includes("network")) {
    errorMsg = "⚠️ **Network error.** Check your internet connection and try again.";
  } else {
    errorMsg = `⚠️ **Safvan AI error:** ${lastErrorMsg || "Unable to reach AI service."}`;
  }

  return streamTextChunked(errorMsg, onChunk);
}

// ── Simulated word-by-word streaming ─────────────────────────────────────────

async function streamTextChunked(
  text: string,
  onChunk: (accumulatedText: string) => void,
  delayMs = 18
): Promise<string> {
  const words = text.split(" ");
  let accumulated = "";
  for (const word of words) {
    accumulated += (accumulated ? " " : "") + word;
    onChunk(accumulated);
    await new Promise<void>((r) => setTimeout(r, delayMs));
  }
  return accumulated;
}
