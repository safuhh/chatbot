import React, { useRef, useEffect } from "react";
import { Paperclip, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Attachment } from "./types";
import { useAttachments } from "@/lib/useAttachments";
import { AttachmentPreviewBar } from "./AttachmentPreviewBar";
import ProductFeaturesPage from "@/pages/ProductFeaturesPage";

interface ChatEmptyStateProps {
  inputMessage: string;
  setInputMessage: (val: string) => void;
  handleSend: (attachments?: Attachment[]) => void;
  isGenerating: boolean;
  placeholder: string;
  isTemporaryMode?: boolean;
  showFeaturesPage?: boolean;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  inputMessage,
  setInputMessage,
  handleSend,
  isGenerating,
  placeholder,
  isTemporaryMode = false,
  showFeaturesPage = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { attachments, addFiles, removeAttachment, clearAttachments } = useAttachments();

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
    const currentAttachments = [...attachments];
    clearAttachments();
    handleSend(currentAttachments);
  };

  const shouldShowFeatures =
    showFeaturesPage || (typeof window !== "undefined" && window.location.pathname === "/");

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col items-center px-3 sm:px-4 pb-12 animate-fade-slide-in">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        multiple
        className="hidden"
        accept="image/*,text/*,application/json,application/pdf,.js,.jsx,.ts,.tsx,.py,.md,.csv,.html,.css"
      />

      {/* Centered Chatbot Hero Section (100% viewport height minus topbar) */}
      <div
        className={cn(
          "w-full max-w-[680px] flex flex-col items-center justify-center shrink-0",
          shouldShowFeatures ? "min-h-[calc(100vh-5rem)] min-h-[calc(100dvh-5rem)] py-8" : "my-auto min-h-[80vh]"
        )}
      >
        {/* Heading & Subtitle */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <h2
            className={cn(
              "text-xl sm:text-3xl font-medium tracking-tight",
              "text-[#1A1A1A] dark:text-[#EDE8E1]"
            )}
          >
            {isTemporaryMode ? "Temporary Chat" : "How can I help you today?"}
          </h2>
          {isTemporaryMode && (
            <p className="mt-2 text-xs sm:text-sm text-[#8A7E6C] dark:text-[#9A8E80] max-w-[480px] mx-auto leading-relaxed font-sans">
              This chat will ignore memory, plugins, and custom instructions, and it won’t appear in your history.
            </p>
          )}
        </div>

        {/* Centered Composer Card */}
        <div className="w-full">
          <div
            className={cn(
              "relative rounded-2xl border shadow-sm p-2.5 sm:p-3 backdrop-blur-md",
              "bg-white/90 border-[#E7DCCC] hover:border-[#C4552F]/40",
              "dark:bg-[#1E1A15]/90 dark:border-[#2E2820] dark:hover:border-[#C4552F]/40",
              "transition-colors"
            )}
          >
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
              placeholder={placeholder}
              rows={1}
              className={cn(
                "w-full bg-transparent border-none resize-none text-xs sm:text-sm leading-relaxed px-1 min-h-[40px] sm:min-h-[44px]",
                "focus:outline-none focus:ring-0",
                "text-[#1A1A1A] placeholder-[#8A7E6C]",
                "dark:text-[#EDE8E1] dark:placeholder-[#6B6358]"
              )}
            />
            <div
              className={cn(
                "flex items-center justify-between pt-2 mt-1 border-t",
                "border-[#E7DCCC]/40 dark:border-[#2E2820]/60"
              )}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
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
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] font-mono text-[#8A7E6C] dark:text-[#6B6358]">
                  ⏎ to send
                </span>
                <button
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
          <p className="text-center text-[10px] sm:text-[11px] mt-2 text-[#8A7E6C] dark:text-[#6B6358] px-2">
            Safvan AI can make mistakes. Double-check important info.
          </p>
        </div>
      </div>

      {shouldShowFeatures && (
        <div className="w-full max-w-6xl mt-12 border-t border-[#E7DCCC]/60 dark:border-[#2E2820]/80 pt-8">
          <ProductFeaturesPage isEmbedded={true} />
        </div>
      )}
    </div>
  );
};
