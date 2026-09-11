import { useState, useEffect, useRef, useCallback } from "react";

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
  onStartListening?: () => void;
  onSessionRestart?: () => void;
}

export function useSpeechRecognition({
  onTranscript,
  onStartListening,
  onSessionRestart,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef<boolean>(false);
  const isStartedRef = useRef<boolean>(false);
  const onTranscriptRef = useRef(onTranscript);
  const onStartListeningRef = useRef(onStartListening);
  const onSessionRestartRef = useRef(onSessionRestart);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onStartListeningRef.current = onStartListening;
  }, [onStartListening]);

  useEffect(() => {
    onSessionRestartRef.current = onSessionRestart;
  }, [onSessionRestart]);

  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as unknown as IWindow) : ({} as IWindow);
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Use user's browser locale (e.g. en-US, en-IN, en-GB) for optimal recognition accuracy
      if (typeof navigator !== "undefined" && navigator.language) {
        recognition.lang = navigator.language;
      } else {
        recognition.lang = "en-US";
      }

      recognition.onstart = () => {
        isStartedRef.current = true;
        setIsListening(true);
        setError(null);
        onStartListeningRef.current?.();
      };

      recognition.onresult = (event: any) => {
        const finalParts: string[] = [];
        let interimText = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result || !result[0]) continue;
          const text = result[0].transcript.trim();
          if (!text) continue;

          if (result.isFinal) {
            finalParts.push(text);
          } else {
            interimText = text;
          }
        }

        const finalStr = finalParts.join(" ");
        const combined = [finalStr, interimText].filter(Boolean).join(" ");

        if (combined) {
          onTranscriptRef.current(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[SpeechRecognition error]:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError("Microphone access denied. Please grant microphone permission in browser settings.");
          shouldBeListeningRef.current = false;
          isStartedRef.current = false;
          setIsListening(false);
        } else if (event.error === "audio-capture") {
          setError("No microphone detected. Please check your audio input device.");
          shouldBeListeningRef.current = false;
          isStartedRef.current = false;
          setIsListening(false);
        } else if (event.error === "no-speech" || event.error === "aborted") {
          // Soft ignore — handled in onend if shouldBeListeningRef is set
        } else if (event.error === "network") {
          setError("Network connection issue with speech service.");
        } else {
          setError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        isStartedRef.current = false;
        if (shouldBeListeningRef.current) {
          try {
            onSessionRestartRef.current?.();
            recognition.start();
            return;
          } catch {
            // Restart failed
          }
        }
        shouldBeListeningRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        shouldBeListeningRef.current = false;
        isStartedRef.current = false;
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isStartedRef.current) return;

    try {
      setError(null);
      shouldBeListeningRef.current = true;
      recognitionRef.current.start();
    } catch (err: any) {
      if (err?.name !== "InvalidStateError") {
        console.warn("[SpeechRecognition] Start error:", err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    isStartedRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening || shouldBeListeningRef.current || isStartedRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}

