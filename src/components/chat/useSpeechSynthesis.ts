import { useState, useCallback, useRef } from "react";

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " [Code snippet] ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useSpeechSynthesis() {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSupported] = useState<boolean>(() => {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  });
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    activeUtteranceRef.current = null;
  }, []);

  const speakMessage = useCallback(
    (id: string, text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      // If clicking speaker on current active message, stop speaking
      if (speakingMessageId === id) {
        stopSpeaking();
        return;
      }

      // Stop any current playback
      window.speechSynthesis.cancel();

      const plainText = stripMarkdown(text);
      if (!plainText) return;

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Daniel"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setSpeakingMessageId(id);
      };

      utterance.onend = () => {
        setSpeakingMessageId(null);
        activeUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn("[SpeechSynthesis error]:", e);
        setSpeakingMessageId(null);
        activeUtteranceRef.current = null;
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [speakingMessageId, stopSpeaking]
  );

  return {
    isSupported,
    speakingMessageId,
    speakMessage,
    stopSpeaking,
  };
}
