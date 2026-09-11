import React from "react";
import { Mic, X, Square, Send, AlertCircle } from "lucide-react";
import { VoiceStatus } from "@/hooks/useVoiceMode";

interface VoiceModeOverlayProps {
  isOpen: boolean;
  status: VoiceStatus;
  userTranscript: string;
  aiResponseText: string;
  error: string | null;
  onClose: () => void;
  onSendSpeech: () => void;
  onInterrupt: () => void;
}

export const VoiceModeOverlay: React.FC<VoiceModeOverlayProps> = ({
  isOpen,
  status,
  userTranscript,
  aiResponseText,
  error,
  onClose,
  onSendSpeech,
  onInterrupt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 bg-[#FAF6F0] text-[#1A1A1A] dark:bg-[#12100E] dark:text-[#EDE8E1] transition-colors duration-200 font-sans">
      {/* Top Bar */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C4552F]" />
          <span className="text-sm font-semibold tracking-tight text-[#1A1A1A] dark:text-[#EDE8E1]">
            Voice Mode
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#E7DCCC]/50 dark:text-[#9A8E80] dark:hover:text-[#EDE8E1] dark:hover:bg-[#28221B] transition-colors"
          title="Exit Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Focus Area */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center my-auto space-y-10 text-center">
        {/* Minimal Central Voice Orb */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {status === "listening" && (
            <div className="relative flex items-center justify-center">
              <span className="absolute w-32 h-32 rounded-full bg-[#C4552F]/10 dark:bg-[#C4552F]/20 animate-ping opacity-50" />
              <div className="w-24 h-24 rounded-full bg-[#C4552F] text-white flex items-center justify-center shadow-md transition-all">
                <Mic className="w-9 h-9" />
              </div>
            </div>
          )}

          {status === "thinking" && (
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#C4552F] animate-spin flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-[#C4552F]/20 animate-pulse" />
              </div>
            </div>
          )}

          {status === "speaking" && (
            <div className="relative flex items-center justify-center">
              <span className="absolute w-32 h-32 rounded-full bg-[#2A7B58]/15 dark:bg-[#2A7B58]/25 animate-pulse" />
              <div className="w-24 h-24 rounded-full bg-[#2A7B58] text-white flex items-center justify-center shadow-md">
                {/* 4 Minimal Soundbar Waves */}
                <div className="flex items-center gap-1.5 h-8">
                  <span className="w-1 bg-white rounded-full h-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 bg-white rounded-full h-3/4 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 bg-white rounded-full h-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="w-1 bg-white rounded-full h-1/2 animate-bounce" style={{ animationDelay: "450ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Status Label */}
        <p className="text-xs font-mono tracking-wider uppercase text-[#8A7E6C] dark:text-[#9A8E80]">
          {status === "listening" && "Listening"}
          {status === "thinking" && "Thinking"}
          {status === "speaking" && "Safvan AI Speaking"}
        </p>

        {/* Transcript / Subtitle Display */}
        <div className="min-h-[80px] w-full px-4 flex flex-col items-center justify-center">
          {status === "listening" && (
            <p className="text-base sm:text-lg font-normal text-[#1A1A1A] dark:text-[#EDE8E1] leading-relaxed max-w-md">
              {userTranscript || "Speak naturally..."}
            </p>
          )}

          {status === "thinking" && (
            <div className="flex items-center gap-1.5 text-sm text-[#8A7E6C] dark:text-[#9A8E80]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4552F] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4552F] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4552F] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}

          {status === "speaking" && (
            <p className="text-base sm:text-lg font-normal text-[#1A1A1A] dark:text-[#EDE8E1] leading-relaxed line-clamp-3 max-w-md">
              {aiResponseText || "..."}
            </p>
          )}

          {error && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-md mx-auto flex items-center justify-center gap-4">
        {status === "speaking" ? (
          <button
            type="button"
            onClick={onInterrupt}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white dark:bg-[#EDE8E1] dark:text-[#1A1A1A] text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Speaking</span>
          </button>
        ) : status === "listening" && userTranscript ? (
          <button
            type="button"
            onClick={onSendSpeech}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C4552F] text-white text-xs font-semibold hover:bg-[#A8421F] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#E7DCCC] text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#E7DCCC]/30 dark:border-[#2E2820] dark:text-[#9A8E80] dark:hover:text-[#EDE8E1] dark:hover:bg-[#28221B] text-xs font-medium transition-colors"
          >
            Exit Voice
          </button>
        )}
      </div>
    </div>
  );
};

