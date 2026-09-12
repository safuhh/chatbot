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

/**
 * Normalizes and cleans raw Speech Recognition text to improve accuracy,
 * remove duplicate stuttered words/phrases, and format punctuation/capitalization.
 */
export function cleanRecognizedSpeech(raw: string): string {
  if (!raw) return "";

  let cleaned = raw.trim();

  // Normalize multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  // Remove repeated adjacent phrases (2-4 words) e.g., "tell me about tell me about" -> "tell me about"
  cleaned = cleaned.replace(/\b(\w+(?:\s+\w+){1,3})\s+\1\b/gi, "$1");

  // Remove repeated single words (up to 3 passes) e.g., "what what is" -> "what is"
  for (let pass = 0; pass < 3; pass++) {
    cleaned = cleaned.replace(/\b(\w+)(?:\s+\1)+\b/gi, "$1");
  }

  // Remove common speech hesitation fillers
  cleaned = cleaned.replace(/\b(uh|um|er|ah)\b\s*/gi, "");

  // Clean up space before punctuation
  cleaned = cleaned.replace(/\s+([.,?!])/g, "$1");

  // Capitalize first letter of sentences
  cleaned = cleaned.replace(/(^\s*|[.?!]\s+)([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase());

  // Capitalize standalone 'i'
  cleaned = cleaned.replace(/\bi\b/g, "I");

  return cleaned.trim();
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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const shouldBeListeningRef = useRef<boolean>(false);
  const isStartedRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cumulative transcript storage across session auto-restarts
  const accumulatedFinalsRef = useRef<string[]>([]);

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

  /**
   * Explicitly requests microphone access from the browser and validates
   * that the audio track is active and receiving audio hardware stream.
   */
  const ensureMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not supported by your browser.");
      return false;
    }

    // Reuse existing live stream if active
    if (mediaStreamRef.current) {
      const activeTrack = mediaStreamRef.current
        .getAudioTracks()
        .find((t) => t.readyState === "live" && t.enabled);
      if (activeTrack) return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.readyState !== "live") {
        setError("Microphone connected but audio track is inactive.");
        return false;
      }

      mediaStreamRef.current = stream;
      return true;
    } catch (err: any) {
      console.warn("[SpeechRecognition] getUserMedia error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone permission denied. Please allow microphone access in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No microphone detected. Please check your laptop's audio input device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Microphone is currently in use by another application.");
      } else {
        setError(`Microphone error: ${err.message || err.name || "Access failed"}`);
      }
      return false;
    }
  }, []);

  // Function to safely instantiate or re-instantiate SpeechRecognition
  const createRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Use preferred user browser language with fallback to en-US
    try {
      const userLang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
      recognition.lang = userLang;
    } catch {
      recognition.lang = "en-US";
    }

    recognition.onstart = () => {
      isStartedRef.current = true;
      isStartingRef.current = false;
      setIsListening(true);
      setError(null);
      onStartListeningRef.current?.();
    };

    recognition.onresult = (event: any) => {
      const sessionFinals: string[] = [];
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || !result[0]) continue;
        const text = result[0].transcript.trim();
        if (!text) continue;

        if (result.isFinal) {
          sessionFinals.push(text);
        } else {
          interimText = text;
        }
      }

      // Combine previous accumulated sessions' final text + current session final text + current interim text
      const allFinals = [...accumulatedFinalsRef.current, ...sessionFinals];
      const combinedRaw = [...allFinals, interimText].filter(Boolean).join(" ");
      const cleanedCombined = cleanRecognizedSpeech(combinedRaw);

      if (cleanedCombined) {
        onTranscriptRef.current(cleanedCombined);
      }
    };

    recognition.onerror = (event: any) => {
      const errType = event.error || "unknown";

      if (errType === "not-allowed" || errType === "service-not-allowed") {
        setError("Microphone access denied. Please grant microphone permission in browser settings.");
        shouldBeListeningRef.current = false;
        isStartedRef.current = false;
        isStartingRef.current = false;
        setIsListening(false);
      } else if (errType === "audio-capture") {
        setError("No microphone detected. Please check your audio input device.");
        shouldBeListeningRef.current = false;
        isStartedRef.current = false;
        isStartingRef.current = false;
        setIsListening(false);
      } else if (errType === "no-speech" || errType === "aborted") {
        // Soft transient error — handled smoothly in onend without UI disruption
      } else if (errType === "network") {
        console.warn("[SpeechRecognition] Network glitch, auto-recovering...");
      } else {
        console.warn(`[SpeechRecognition error]: ${errType}`);
      }
    };

    recognition.onend = () => {
      isStartedRef.current = false;
      isStartingRef.current = false;

      if (shouldBeListeningRef.current) {
        // Schedule safe auto-restart after a short delay to prevent InvalidStateError
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

        restartTimerRef.current = setTimeout(() => {
          if (!shouldBeListeningRef.current) return;
          try {
            onSessionRestartRef.current?.();
            recognition.start();
          } catch (err: any) {
            console.warn("[SpeechRecognition] Safe restart retry:", err);
            // Re-attempt once more if browser engine wasn't fully ready
            setTimeout(() => {
              if (shouldBeListeningRef.current && !isStartedRef.current) {
                try {
                  recognition.start();
                } catch {
                  setIsListening(false);
                }
              }
            }, 250);
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, []);

  useEffect(() => {
    recognitionRef.current = createRecognition();

    return () => {
      shouldBeListeningRef.current = false;
      isStartedRef.current = false;
      isStartingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch {
          // ignore
        }
        mediaStreamRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [createRecognition]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isStartedRef.current || isStartingRef.current) return;

    // Ensure laptop microphone permission and active hardware stream
    const hasMic = await ensureMicrophoneAccess();
    if (!hasMic) return;

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition();
    }
    if (!recognitionRef.current) return;

    shouldBeListeningRef.current = true;
    isStartingRef.current = true;
    setError(null);

    // Reset accumulated transcripts on brand new user listening session start
    accumulatedFinalsRef.current = [];

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      isStartingRef.current = false;
      if (err?.name === "InvalidStateError") {
        // Session was closing down — retry after short delay
        setTimeout(() => {
          if (shouldBeListeningRef.current && !isStartedRef.current) {
            try {
              recognitionRef.current?.start();
            } catch {
              // ignore
            }
          }
        }, 200);
      } else {
        console.warn("[SpeechRecognition] Start exception:", err);
      }
    }
  }, [isSupported, ensureMicrophoneAccess, createRecognition]);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    isStartedRef.current = false;
    isStartingRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    }

    // Stop and clean up microphone media stream tracks
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
    }

    setIsListening(false);
  }, []);

  const resetTranscriptBuffer = useCallback(() => {
    accumulatedFinalsRef.current = [];
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
    resetTranscriptBuffer,
    toggleListening,
  };
}
