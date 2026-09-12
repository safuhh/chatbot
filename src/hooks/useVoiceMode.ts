import { useState, useRef, useCallback, useEffect } from "react";
import {
  useSpeechRecognition,
  cleanRecognizedSpeech,
} from "@/components/chat/useSpeechRecognition";
import { fetchOpenRouterTTS, cleanTextForSpeech } from "@/lib/ttsApi";

export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

interface UseVoiceModeProps {
  onSendMessage: (text: string) => Promise<void>;
  isGenerating: boolean;
}

export function useVoiceMode({ onSendMessage, isGenerating }: UseVoiceModeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiResponseText, setAiResponseText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);
  const latestTranscriptRef = useRef("");

  // Handler to stop any active audio playback (OpenRouter TTS audio or Web SpeechUtterance)
  const stopAudio = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Speech Recognition handlers
  const handleTranscript = useCallback(
    (text: string) => {
      if (status !== "listening" && status !== "idle") return;
      const cleaned = cleanRecognizedSpeech(text);
      if (!cleaned) return;

      latestTranscriptRef.current = cleaned;
      setUserTranscript(cleaned);

      // Reset silence timer on every new speech token
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Auto-send user prompt after 1.4 seconds of silence when in voice mode
      if (cleaned.trim() && isOpen) {
        silenceTimerRef.current = setTimeout(() => {
          triggerSendUserSpeech();
        }, 1400);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, status]
  );

  const {
    isSupported: isSpeechSupported,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscriptBuffer,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
  });

  // Function to submit current user speech to AI
  const triggerSendUserSpeech = useCallback(async () => {
    const textToSend = cleanRecognizedSpeech(latestTranscriptRef.current);
    if (!textToSend || isProcessingRef.current) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    isProcessingRef.current = true;
    stopListening();
    stopAudio();
    resetTranscriptBuffer();

    setStatus("thinking");
    setAiResponseText("");

    try {
      await onSendMessage(textToSend);
    } catch (err) {
      console.warn("[VoiceMode] Error sending message:", err);
      setError("Failed to get AI response. Please try speaking again.");
    } finally {
      latestTranscriptRef.current = "";
      setUserTranscript("");
    }
  }, [onSendMessage, stopListening, stopAudio, resetTranscriptBuffer]);

  // When AI generation finishes while in voice mode, trigger OpenRouter TTS
  const playAiVoice = useCallback(
    async (textToSpeak: string) => {
      if (!textToSpeak.trim() || !isOpen) {
        setStatus("listening");
        resetTranscriptBuffer();
        startListening();
        isProcessingRef.current = false;
        return;
      }

      setStatus("speaking");
      stopAudio();

      // Try OpenRouter TTS (Deepgram Flux model)
      const audio = await fetchOpenRouterTTS(textToSpeak);

      if (audio) {
        activeAudioRef.current = audio;
        audio.onended = () => {
          activeAudioRef.current = null;
          if (isOpen) {
            setUserTranscript("");
            setAiResponseText("");
            latestTranscriptRef.current = "";
            resetTranscriptBuffer();
            setStatus("listening");
            startListening();
          } else {
            setStatus("idle");
          }
          isProcessingRef.current = false;
        };

        audio.onerror = (e) => {
          console.warn("[VoiceMode] OpenRouter audio playback error, falling back to synthesis:", e);
          fallbackBrowserSpeech(textToSpeak);
        };

        try {
          await audio.play();
          return;
        } catch (playErr) {
          console.warn("[VoiceMode] Audio play failed:", playErr);
          fallbackBrowserSpeech(textToSpeak);
          return;
        }
      }

      // Fallback to browser SpeechSynthesis if OpenRouter TTS fails or key missing
      fallbackBrowserSpeech(textToSpeak);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, startListening, stopAudio, resetTranscriptBuffer]
  );

  const fallbackBrowserSpeech = useCallback(
    (textToSpeak: string) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const plainText = cleanTextForSpeech(textToSpeak);
        if (!plainText) {
          if (isOpen) {
            setUserTranscript("");
            setAiResponseText("");
            latestTranscriptRef.current = "";
            resetTranscriptBuffer();
            setStatus("listening");
            startListening();
          }
          isProcessingRef.current = false;
          return;
        }

        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.onend = () => {
          if (isOpen) {
            setUserTranscript("");
            setAiResponseText("");
            latestTranscriptRef.current = "";
            resetTranscriptBuffer();
            setStatus("listening");
            startListening();
          } else {
            setStatus("idle");
          }
          isProcessingRef.current = false;
        };
        utterance.onerror = () => {
          if (isOpen) {
            setUserTranscript("");
            setAiResponseText("");
            latestTranscriptRef.current = "";
            resetTranscriptBuffer();
            setStatus("listening");
            startListening();
          }
          isProcessingRef.current = false;
        };

        window.speechSynthesis.speak(utterance);
      } else {
        if (isOpen) {
          setUserTranscript("");
          setAiResponseText("");
          latestTranscriptRef.current = "";
          resetTranscriptBuffer();
          setStatus("listening");
          startListening();
        }
        isProcessingRef.current = false;
      }
    },
    [isOpen, startListening, resetTranscriptBuffer]
  );

  // Watch for transition from isGenerating: true -> false to trigger TTS
  const prevGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    if (prevGeneratingRef.current && !isGenerating && isOpen && isProcessingRef.current) {
      // AI streaming completed — play speech
      playAiVoice(aiResponseText);
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating, isOpen, aiResponseText, playAiVoice]);

  // Start Voice Mode
  const startVoiceMode = useCallback(() => {
    setError(null);
    setIsOpen(true);
    setStatus("listening");
    setUserTranscript("");
    setAiResponseText("");
    latestTranscriptRef.current = "";
    isProcessingRef.current = false;
    stopAudio();
    resetTranscriptBuffer();
    startListening();
  }, [startListening, stopAudio, resetTranscriptBuffer]);

  // Stop / Close Voice Mode
  const closeVoiceMode = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    stopAudio();
    stopListening();
    setIsOpen(false);
    setStatus("idle");
    setUserTranscript("");
    setAiResponseText("");
    latestTranscriptRef.current = "";
    isProcessingRef.current = false;
    resetTranscriptBuffer();
  }, [stopAudio, stopListening, resetTranscriptBuffer]);

  // User manually interrupts speaking AI audio
  const interruptSpeaking = useCallback(() => {
    stopAudio();
    setUserTranscript("");
    setAiResponseText("");
    latestTranscriptRef.current = "";
    resetTranscriptBuffer();
    setStatus("listening");
    startListening();
    isProcessingRef.current = false;
  }, [startListening, stopAudio, resetTranscriptBuffer]);

  return {
    isOpen,
    status,
    userTranscript,
    aiResponseText,
    setAiResponseText,
    error: speechError || error,
    isSpeechSupported,
    isListening,
    startVoiceMode,
    closeVoiceMode,
    triggerSendUserSpeech,
    interruptSpeaking,
  };
}
