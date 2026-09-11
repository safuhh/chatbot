/**
 * ttsApi.ts — OpenRouter Text-to-Speech API helper using Deepgram Flux TTS.
 * Endpoint: POST https://openrouter.ai/api/v1/audio/speech
 * Model:    deepgram/flux-tts:free
 * Voice:    flux-alexis-en
 */

const getApiKey = (): string => {
  return (
    (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) ||
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    ""
  );
};

export function cleanTextForSpeech(md: string): string {
  if (!md) return "";
  return md
    // Replace code blocks with concise summary
    .replace(/```[\s\S]*?```/g, " Here is a code snippet. ")
    // Inline code
    .replace(/`([^`]+)`/g, "$1")
    // Markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Bold, italic, strikethrough, headings, blockquotes, bullets
    .replace(/[*_~#>]/g, "")
    .replace(/^[-+*]\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calls OpenRouter TTS endpoint with model 'deepgram/flux-tts:free'.
 * Returns an HTMLAudioElement loaded with the generated audio buffer Blob URL,
 * or null if the API request fails.
 */
export async function fetchOpenRouterTTS(text: string): Promise<HTMLAudioElement | null> {
  const apiKey = getApiKey();
  const cleanInput = cleanTextForSpeech(text);

  if (!cleanInput) return null;
  if (!apiKey) {
    console.warn("[TTS] OpenRouter API key missing.");
    return null;
  }

  // Trim long text to reasonable length for TTS (first ~1000 characters) to prevent audio timeouts
  const inputToSpeak = cleanInput.length > 1000 ? `${cleanInput.slice(0, 1000)}...` : cleanInput;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://safvan.ai",
        "X-OpenRouter-Title": "Safvan AI",
      },
      body: JSON.stringify({
        model: "deepgram/flux-tts:free",
        input: inputToSpeak,
        voice: "flux-alexis-en",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[TTS API Error] HTTP ${response.status}:`, errText);
      return null;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    return audio;
  } catch (err) {
    console.warn("[TTS API Exception]:", err);
    return null;
  }
}
