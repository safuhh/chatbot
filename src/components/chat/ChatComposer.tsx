import React, { useRef, useEffect, useCallback } from "react";
import { Paperclip, ArrowUp, Mic, MicOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Attachment } from "./types";
import { useAttachments } from "@/lib/useAttachments";
import { AttachmentPreviewBar } from "./AttachmentPreviewBar";
import { useSpeechRecognition } from "./useSpeechRecognition";

interface ChatComposerProps {
  inputMessage: string;
  setInputMessage: (val: string | ((prev: string) => string)) => void;
  handleSend: (attachments?: Attachment[]) => void;
  isGenerating: boolean;
  placeholder: string;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  inputMessage,
  setInputMessage,
  handleSend,
  isGenerating,
  placeholder,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { attachments, addFiles, removeAttachment, clearAttachments } = useAttachments();

  const baseTextRef = useRef<string>("");

  const handleStartListening = useCallback(() => {
    baseTextRef.current = inputMessage.trim();
  }, [inputMessage]);

  const handleSessionRestart = useCallback(() => {
    baseTextRef.current = inputMessage.trim();
  }, [inputMessage]);

  // Handle Speech Recognition voice input callback
  const handleTranscript = useCallback(
    (text: string) => {
      const speech = text.trim();
      if (!speech) return;
      const base = baseTextRef.current;
      setInputMessage(base ? `${base} ${speech}` : speech);
    },
    [setInputMessage]
  );

  const {
    isSupported: isSpeechSupported,
    isListening,
    error: speechError,
    toggleListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onStartListening: handleStartListening,
    onSessionRestart: handleSessionRestart,
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [inputMessage]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const onSubmit = () => {
    if ((!inputMessage.trim() && attachments.length === 0) || isGenerating) return;
    if (isListening) {
      stopListening();
    }
    const currentAttachments = [...attachments];
    clearAttachments();
    handleSend(currentAttachments);
  };

  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-3 sm:px-4",
        "bg-gradient-to-t from-[#FAF6F0] via-[#FAF6F0]/95 to-transparent",
        "dark:from-[#141210] dark:via-[#141210]/95",
        "animate-fade-slide-up"
      )}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        multiple
        className="hidden"
        accept="image/*,text/*,application/json,application/pdf,.js,.jsx,.ts,.tsx,.py,.md,.csv,.html,.css"
      />

      <div className="max-w-[780px] mx-auto space-y-1.5">
        {/* Voice Error Notice (if permission denied or error) */}
        {speechError && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs animate-fade-down">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{speechError}</span>
          </div>
        )}

        {/* Composer Card */}
        <div
          className={cn(
            "relative rounded-2xl border shadow-sm p-2.5 sm:p-3 backdrop-blur-md transition-colors",
            isListening
              ? "bg-red-50/20 border-red-400 ring-2 ring-red-400/20 dark:bg-red-950/10 dark:border-red-500/50"
              : "bg-white/90 border-[#E7DCCC] hover:border-[#C4552F]/40 dark:bg-[#1E1A15]/90 dark:border-[#2E2820] dark:hover:border-[#C4552F]/40"
          )}
        >
          {/* Active Listening Indicator Banner */}
          {isListening && (
            <div className="flex items-center justify-between px-2 py-1 mb-2 rounded-lg bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-semibold">Listening... Speak now</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-[11px] underline hover:text-red-700 dark:hover:text-red-300"
              >
                Stop recording
              </button>
            </div>
          )}

          {/* Attachment Preview Bar */}
          <AttachmentPreviewBar attachments={attachments} onRemove={removeAttachment} />

          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={isListening ? "Listening to your voice..." : placeholder}
            rows={1}
            className={cn(
              "w-full bg-transparent border-none resize-none text-xs sm:text-sm leading-relaxed px-1 min-h-[40px] sm:min-h-[44px]",
              "focus:outline-none focus:ring-0",
              "text-[#1A1A1A] placeholder-[#8A7E6C]",
              "dark:text-[#EDE8E1] dark:placeholder-[#6B6358]"
            )}
          />

          {/* Bottom Control Row */}
          <div
            className={cn(
              "flex items-center justify-between pt-2 mt-1 border-t",
              "border-[#E7DCCC]/40 dark:border-[#2E2820]/60"
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-2 sm:p-1.5 rounded-lg transition-colors relative",
                  attachments.length > 0
                    ? "text-[#C4552F] bg-[#C4552F]/10 dark:text-[#D4663F] dark:bg-[#C4552F]/20"
                    : "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1] dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#262019]"
                )}
                title="Attach image or document"
              >
                <Paperclip className="w-4 h-4" />
                {attachments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C4552F] text-white text-[9px] font-bold flex items-center justify-center">
                    {attachments.length}
                  </span>
                )}
              </button>

              {/* Voice Input Microphone Button (Web Speech API) */}
              {isSpeechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "p-2 sm:p-1.5 rounded-lg transition-all duration-200 relative flex items-center gap-1",
                    isListening
                      ? "bg-red-500 text-white shadow-md animate-pulse ring-2 ring-red-400/50"
                      : "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1] dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#262019]"
                  )}
                  title={
                    isListening
                      ? "Stop recording voice"
                      : "Click to speak (Voice input)"
                  }
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 text-white" />
                      <span className="text-[11px] font-medium hidden sm:inline">Stop</span>
                    </>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[11px] font-mono text-[#8A7E6C] dark:text-[#6B6358]">
                ⏎ to send
              </span>
              <button
                type="button"
                onClick={onSubmit}
                disabled={(!inputMessage.trim() && attachments.length === 0) || isGenerating}
                className={cn(
                  "w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white transition-all shadow-2xs shrink-0",
                  (inputMessage.trim() || attachments.length > 0) && !isGenerating
                    ? "bg-[#C4552F] hover:bg-[#A8421F] scale-100"
                    : "bg-[#E7DCCC] text-[#8A7E6C] cursor-not-allowed scale-95 dark:bg-[#2E2820] dark:text-[#6B6358]"
                )}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] sm:text-[11px] text-[#8A7E6C] dark:text-[#6B6358] px-2">
          Safvan AI can make mistakes. Double-check important info.
        </p>
      </div>
    </div>
  );
};
