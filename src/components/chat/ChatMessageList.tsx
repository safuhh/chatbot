import React, { useState } from "react";
import {
  Feather,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./types";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isGenerating,
  messagesEndRef,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto py-4 sm:py-6">
      {/* Centered content column — matches composer max-width */}
      <div className="max-w-[760px] mx-auto px-3 sm:px-4 space-y-4">
        {messages.map((msg, index) => {
          const delay = `${Math.min(index * 60, 300)}ms`;

          // User Turn
          if (msg.sender === "user") {
            return (
              <div
                key={msg.id}
                className="flex justify-end animate-fade-up"
                style={{ "--delay": delay } as React.CSSProperties}
              >
                <div
                  className={cn(
                    "rounded-2xl rounded-tr-xs p-3.5 sm:p-4 shadow-2xs max-w-[88%] sm:max-w-[75%] space-y-2",
                    "bg-[#F0E3D5] border border-[#EAD6C4] text-[#1A1A1A]",
                    "dark:bg-[#2A1F16] dark:border-[#3D2F22] dark:text-[#EDE8E1]"
                  )}
                >
                  {/* Attachments inside user message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {msg.attachments.map((att) =>
                        att.isImage ? (
                          <div key={att.id} className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-w-[280px]">
                            <img
                              src={att.url || (att.base64 ? `data:${att.type || "image/jpeg"};base64,${att.base64}` : "")}
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
                            <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {msg.content && (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // Assistant Turn (Frameless)
          return (
            <div
              key={msg.id}
              className="flex flex-col space-y-3 group animate-fade-up"
              style={{ "--delay": delay } as React.CSSProperties}
            >
              {/* Label */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#C4552F] flex items-center justify-center text-white shrink-0">
                  <Feather className="w-3 h-3" />
                </div>
                <span className="font-sans font-semibold text-xs sm:text-sm text-[#C4552F] dark:text-[#D4663F] tracking-tight">
                  Safvan AI
                </span>
                {msg.time && (
                  <span className="text-[10px] font-mono text-[#8A7E6C] dark:text-[#6B6358]">
                    {msg.time}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="space-y-4 text-sm leading-relaxed pl-1">
                <p className="text-[15px] leading-[1.68] whitespace-pre-wrap">
                  {msg.content}
                </p>

                {/* Optional code block */}
                {msg.codeSnippet && (
                  <div className="rounded-xl border border-[#E7DCCC] dark:border-[#2E2820] overflow-hidden shadow-sm my-3">
                    <div className="bg-[#1F1A15] px-4 py-2 flex items-center justify-between border-b border-white/10 text-xs font-mono">
                      <div className="flex items-center gap-2 text-[#EAD9BE]">
                        <FileCode className="w-3.5 h-3.5 text-[#C4552F]" />
                        <span>{msg.codeSnippet.filename}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(msg.id, msg.codeSnippet!.code)}
                        className="flex items-center gap-1 text-[#EAD9BE]/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-[11px]"
                      >
                        {copiedCodeId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 bg-[#262019] font-mono-code text-xs text-[#EAD9BE] overflow-x-auto leading-relaxed">
                      <code>{msg.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions (Accessible on touch, hover on desktop) */}
              <div className="flex items-center gap-1 pt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  className={cn(
                    "p-2 sm:p-1.5 rounded-lg transition-colors",
                    "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1]",
                    "dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                  )}
                  title="Copy"
                >
                  {copiedMessageId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  className={cn(
                    "p-2 sm:p-1.5 rounded-lg transition-colors",
                    "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1]",
                    "dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                  )}
                  title="Helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  className={cn(
                    "p-2 sm:p-1.5 rounded-lg transition-colors",
                    "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1]",
                    "dark:text-[#6B6358] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
                  )}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 pt-2 pl-1">
            <div className="w-5 h-5 rounded bg-[#C4552F] flex items-center justify-center text-white shrink-0">
              <Feather className="w-3 h-3" />
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border",
                "bg-[#F4ECE1] border-[#E7DCCC]",
                "dark:bg-[#1E1A15] dark:border-[#2E2820]"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-[#C4552F] animate-bounce-dot-1" />
              <span className="w-2 h-2 rounded-full bg-[#C4552F] animate-bounce-dot-2" />
              <span className="w-2 h-2 rounded-full bg-[#C4552F] animate-bounce-dot-3" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
