import React, { useState } from "react";
import {
  Feather,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  FileCode,
  RotateCcw,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onRegenerate?: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = React.memo(
  ({ messages, isGenerating, messagesEndRef, onRegenerate }) => {
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [feedbackState, setFeedbackState] = useState<Record<string, "up" | "down" | null>>({});

    const {
      isSupported: isSpeechSynthesisSupported,
      speakingMessageId,
      speakMessage,
      stopSpeaking,
    } = useSpeechSynthesis();

    const handleCopyMessage = (id: string, text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const handleFeedback = (id: string, type: "up" | "down") => {
      setFeedbackState((prev) => ({
        ...prev,
        [id]: prev[id] === type ? null : type,
      }));
    };

    return (
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 sm:py-6">
        {/* Centered content column — matches composer max-width */}
        <div className="max-w-[780px] mx-auto px-3 sm:px-5 space-y-6">
          {messages.map((msg, index) => {
            const isLastMessage = index === messages.length - 1;
            const isLastAssistantMessage =
              msg.sender === "assistant" &&
              (isLastMessage ||
                messages.slice(index + 1).every((m) => m.sender !== "assistant"));

            const isErrorMsg =
              msg.isError ||
              (msg.sender === "assistant" && msg.content.trim().startsWith("⚠️"));

            const isSpeakingThis = speakingMessageId === msg.id;
            const delay = `${Math.min(index * 40, 240)}ms`;

            // ── User Message Turn ──────────────────────────────────────────
            if (msg.sender === "user") {
              return (
                <div
                  key={msg.id}
                  className="flex flex-col items-end space-y-1.5 group animate-fade-up"
                  style={{ "--delay": delay } as React.CSSProperties}
                >
                  {/* User Bubble */}
                  <div
                    className={cn(
                      "rounded-2xl rounded-tr-xs p-3.5 sm:p-4 shadow-2xs max-w-[88%] sm:max-w-[78%] space-y-2.5",
                      "bg-[#F0E3D5] border border-[#EAD6C4] text-[#1A1A1A]",
                      "dark:bg-[#261E17] dark:border-[#3D2F22] dark:text-[#EDE8E1]"
                    )}
                  >
                    {/* Attachments inside user message */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pb-1">
                        {msg.attachments.map((att) =>
                          att.isImage ? (
                            <div
                              key={att.id}
                              className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-w-[280px]"
                            >
                              <img
                                src={
                                  att.url ||
                                  (att.base64
                                    ? `data:${att.type || "image/jpeg"};base64,${att.base64}`
                                    : "")
                                }
                                alt={att.name}
                                className="w-full h-auto max-h-[240px] object-cover rounded-xl"
                              />
                            </div>
                          ) : (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10"
                            >
                              <FileCode className="w-4 h-4 text-[#C4552F] shrink-0" />
                              <span className="truncate max-w-[160px] font-medium">
                                {att.name}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {msg.content && (
                      <p className="text-xs sm:text-[14px] leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.content}
                      </p>
                    )}
                  </div>

                  {/* User Footer: Timestamp & Copy option */}
                  <div className="flex items-center gap-2 px-1 text-[11px] text-[#8A7E6C] dark:text-[#6B6358]">
                    {msg.time && (
                      <span className="font-mono text-[10px] opacity-75">{msg.time}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-[#1A1A1A] dark:hover:text-[#EDE8E1]"
                      title="Copy message"
                    >
                      {copiedMessageId === msg.id ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Copied
                        </span>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              );
            }

            // ── Assistant Turn (ChatGPT-style Frameless Layout) ─────────────
            return (
              <div
                key={msg.id}
                className="flex flex-col space-y-2.5 group animate-fade-up"
                style={{ "--delay": delay } as React.CSSProperties}
              >
                {/* Assistant Label Row */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#C4552F] flex items-center justify-center text-white shrink-0 shadow-2xs">
                    <Feather className="w-3 h-3" />
                  </div>
                  <span className="font-sans font-semibold text-xs sm:text-sm text-[#C4552F] dark:text-[#E87A53] tracking-tight">
                    Safvan AI
                  </span>
                  {msg.time && (
                    <span className="text-[10px] font-mono text-[#8A7E6C] dark:text-[#6B6358]">
                      {msg.time}
                    </span>
                  )}
                </div>

                {/* Error Banner State */}
                {isErrorMsg ? (
                  <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 p-4 space-y-3 my-1">
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-red-800 dark:text-red-300">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-relaxed">{msg.content}</p>
                      </div>
                    </div>

                    {onRegenerate && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onRegenerate}
                          disabled={isGenerating}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-2xs",
                            "bg-[#C4552F] hover:bg-[#A8421F] active:scale-95 disabled:opacity-50"
                          )}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry response</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Normal Assistant Content with Markdown & Syntax Highlighting */
                  <div className="space-y-3 text-sm leading-relaxed pl-0.5 sm:pl-1">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}

                {/* ChatGPT-style Action Toolbar */}
                {!isErrorMsg && msg.content.trim().length > 0 && (
                  <div className="flex items-center gap-1 pt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 select-none">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                        "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1]",
                        "dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                      )}
                      title="Copy response"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>

                    {/* Text-to-Speech Output Button (Web Speech API) */}
                    {isSpeechSynthesisSupported && (
                      <button
                        type="button"
                        onClick={() =>
                          isSpeakingThis ? stopSpeaking() : speakMessage(msg.id, msg.content)
                        }
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-150",
                          isSpeakingThis
                            ? "text-[#C4552F] bg-[#C4552F]/10 dark:text-[#E87A53] dark:bg-[#C4552F]/20 font-semibold"
                            : "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1] dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                        )}
                        title={isSpeakingThis ? "Stop speaking" : "Read response aloud"}
                      >
                        {isSpeakingThis ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-[#C4552F] dark:text-[#E87A53] animate-pulse" />
                            <span className="text-[11px] text-[#C4552F] dark:text-[#E87A53]">
                              Speaking...
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium hidden sm:inline">Read</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Regenerate Button (available on assistant messages) */}
                    {onRegenerate && isLastAssistantMessage && !isGenerating && (
                      <button
                        type="button"
                        onClick={onRegenerate}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                          "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1]",
                          "dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                        )}
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium hidden sm:inline">
                          Regenerate
                        </span>
                      </button>
                    )}

                    {/* Thumbs Up */}
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, "up")}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        feedbackState[msg.id] === "up"
                          ? "text-[#C4552F] bg-[#C4552F]/10 dark:text-[#E87A53]"
                          : "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1] dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                      )}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Thumbs Down */}
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, "down")}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        feedbackState[msg.id] === "down"
                          ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40"
                          : "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1] dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                      )}
                      title="Bad response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Active Generating / Typing Indicator */}
          {isGenerating && (
            <div className="flex items-center gap-2 pt-1 pl-0.5 sm:pl-1">
              <div className="w-5 h-5 rounded-md bg-[#C4552F] flex items-center justify-center text-white shrink-0 shadow-2xs">
                <Feather className="w-3 h-3 animate-pulse" />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border shadow-2xs",
                  "bg-[#F4ECE1] border-[#E7DCCC]",
                  "dark:bg-[#1E1A15] dark:border-[#2E2820]"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-[#C4552F] animate-bounce-dot-1" />
                <span className="w-2 h-2 rounded-full bg-[#C4552F] animate-bounce-dot-2" />
                <span className="w-2 h-2 rounded-full bg-[#C4552F] animate-bounce-dot-3" />
                <span className="text-xs font-mono text-[#8A7E6C] dark:text-[#6B6358] ml-1 select-none">
                  Thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";
