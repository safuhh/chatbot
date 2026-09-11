import React from "react";
import { Mic, X, Volume2, Sparkles, Send, Square, AlertCircle } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-slate-950/90 dark:bg-black/95 backdrop-blur-2xl text-white animate-fade-in transition-all duration-300">
      {/* Top Header Row */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#C4552F] to-[#E07A5F] flex items-center justify-center shadow-lg shadow-[#C4552F]/30">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">Safvan AI Voice</h2>
            <p className="text-xs text-slate-400 font-mono">Deepgram Flux TTS • Voice-to-Voice</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors backdrop-blur-md"
          title="Exit Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Center Animation & Status Area */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-xl text-center space-y-8 z-10">
        {/* Animated Glowing Orb / Visualizer */}
        <div className="relative flex items-center justify-center">
          {status === "listening" && (
            <div className="relative flex items-center justify-center">
              <span className="absolute w-44 h-44 rounded-full bg-red-500/20 animate-ping opacity-75" />
              <span className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-red-500/30 to-orange-500/30 animate-pulse blur-md" />
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/50 scale-105 transition-all">
                <Mic className="w-12 h-12 text-white animate-bounce" />
              </div>
            </div>
          )}

          {status === "thinking" && (
            <div className="relative flex items-center justify-center">
              <span className="absolute w-44 h-44 rounded-full bg-amber-500/20 animate-spin blur-lg" />
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-pulse">
                <Sparkles className="w-12 h-12 text-white animate-spin" />
              </div>
            </div>
          )}

          {status === "speaking" && (
            <div className="relative flex items-center justify-center">
              <span className="absolute w-48 h-48 rounded-full bg-emerald-500/20 animate-pulse blur-xl" />
              <span className="absolute w-36 h-36 rounded-full bg-emerald-500/30 animate-ping opacity-60" />
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/50 scale-105 transition-all">
                <Volume2 className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-mono text-slate-200 shadow-md">
          {status === "listening" && (
            <>
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>Listening... Speak naturally</span>
            </>
          )}
          {status === "thinking" && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
              <span>Thinking & processing response...</span>
            </>
          )}
          {status === "speaking" && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Safvan AI is speaking...</span>
            </>
          )}
        </div>

        {/* Live Transcript / Response Preview */}
        <div className="w-full min-h-[90px] flex flex-col items-center justify-center px-4">
          {status === "listening" && (
            <p className="text-base sm:text-lg font-medium text-slate-200 max-w-lg leading-relaxed italic animate-fade-in">
              {userTranscript ? `"${userTranscript}"` : "Say something to Safvan AI..."}
            </p>
          )}

          {status === "thinking" && (
            <p className="text-sm text-slate-400 font-mono animate-pulse">Generating answer...</p>
          )}

          {status === "speaking" && (
            <p className="text-base sm:text-lg font-medium text-emerald-200 max-w-lg leading-relaxed line-clamp-4 animate-fade-in">
              {aiResponseText || "Speaking..."}
            </p>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex items-center justify-center gap-4 z-10">
        {status === "speaking" ? (
          <button
            type="button"
            onClick={onInterrupt}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-sm shadow-lg shadow-red-600/40 transition-all hover:scale-105 active:scale-95"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Speaking</span>
          </button>
        ) : status === "listening" && userTranscript ? (
          <button
            type="button"
            onClick={onSendSpeech}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#C4552F] hover:bg-[#A8421F] text-white font-medium text-sm shadow-lg shadow-[#C4552F]/40 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Send Now</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-medium text-xs border border-white/15 transition-all"
          >
            End Voice Mode
          </button>
        )}
      </div>
    </div>
  );
};
