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

const MODELS = [
  "inclusionai/ling-3.0-flash-vl:free",
  "google/gemini-2.0-flash-lite-001",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-coder-32b-instruct:free",
];

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are Safvan AI, a helpful, intelligent, precise, and friendly general-purpose AI assistant. " +
  "Answer user queries directly, accurately, and thoroughly. " +
  "Provide clean, well-formatted responses. " +
  "When asked about programming, provide working code snippets with explanations. " +
  "Analyze attached images or code files when provided. " +
  "Give direct answers for factual queries. " +
  "Never simply repeat or rephrase the user's prompt.";

// Max history turns to send per request — older messages are trimmed to
// keep token count low and reduce time-to-first-token.
const MAX_HISTORY = 20;

// ── Time / Date shortcut ──────────────────────────────────────────────────────

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

// ── Main streaming function ───────────────────────────────────────────────────

/**
 * Streams an OpenRouter AI response token-by-token.
 * Calls onChunk(accumulatedText) on each new token.
 * Returns the full response string when done.
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
  // 1. Local time / date — zero latency, no API call
  const timeOrDate = detectTimeOrDateQuery(userPrompt);
  if (timeOrDate && attachments.length === 0) {
    return streamTextChunked(timeOrDate, onChunk);
  }

  // 2. API key guard
  const activeApiKey = getApiKey();
  if (!activeApiKey) {
    return streamTextChunked(
      "I am currently unable to process requests. Please try again in a moment.",
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

  // 4. Build request
  const messages = buildMessages(chatHistory, userPrompt, attachments);

  // 5. Call OpenRouter with SSE streaming
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
        models: MODELS,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      let errMsg: string;
      try {
        const json = JSON.parse(errBody) as { error?: { message?: string } };
        errMsg = json.error?.message ?? errBody;
      } catch {
        errMsg = errBody;
      }

      console.error(`[OpenRouter API Error] HTTP ${response.status}:`, errMsg);
      return streamTextChunked(
        "I ran into a temporary issue processing your message. Please try again in a moment.",
        onChunk
      );
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

    return streamTextChunked(
      "⚠️ The AI returned an empty response. Please try again.",
      onChunk
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Safvan AI] OpenRouter error:", message);

    let errorMsg: string;
    if (message.includes("429") || message.includes("rate limit") || message.includes("quota")) {
      errorMsg = "⚠️ **Rate limit reached.** Please wait a moment and try again.";
    } else if (message.includes("401") || message.includes("403") || message.includes("API key")) {
      errorMsg = "⚠️ **Invalid API key.** Check `VITE_OPENROUTER_API_KEY` in your `.env` file.";
    } else if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
      errorMsg = "⚠️ **Network error.** Check your internet connection and try again.";
    } else {
      errorMsg = `⚠️ **Safvan AI error:** ${message}`;
    }

    return streamTextChunked(errorMsg, onChunk);
  }
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
