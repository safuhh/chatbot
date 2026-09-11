"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

import { ChatMessage, ChatHistoryItem, TerraChatProps, Attachment } from "../chat/types";
import { ChatSidebar } from "../chat/ChatSidebar";
import { ChatHeader } from "../chat/ChatHeader";
import { ChatEmptyState } from "../chat/ChatEmptyState";
import { ChatMessageList } from "../chat/ChatMessageList";
import { ChatComposer } from "../chat/ChatComposer";

export type { ChatMessage, ChatHistoryItem, TerraChatProps, Attachment };

export default function TerraChatUI({
  title = "Safvan AI",
  messages: externalMessages,
  onSendMessage,
  onNewConversation,
  chatHistory: externalChatHistory,
  activeChatId: externalActiveChatId,
  onSelectChat,
  isGenerating = false,
  placeholder = "Reply to Safvan AI…",
  showTopBar = true,
  className,
  isGuest = false,
  userDisplayName,
  onLogout,
  isTemporaryMode = false,
  onToggleTemporaryMode,
  onDeleteChat,
}: TerraChatProps) {
  // ── Chat State
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [internalChatHistory, setInternalChatHistory] = useState<ChatHistoryItem[]>([]);
  const [internalActiveChatId, setInternalActiveChatId] = useState<string>(() =>
    Date.now().toString()
  );

  const messages = externalMessages ?? internalMessages;
  const chatHistory = externalChatHistory ?? internalChatHistory;
  const activeChatId = externalActiveChatId ?? internalActiveChatId;

  const [inputMessage, setInputMessage] = useState("");
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("safvan_theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("safvan_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("safvan_theme", "light");
    }
  }, [isDark]);

  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Handlers
  const handleNewConversation = () => {
    setInternalMessages([]);
    setInternalActiveChatId(Date.now().toString());
    if (onNewConversation) {
      onNewConversation();
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectChat = (id: string) => {
    setInternalActiveChatId(id);
    if (onSelectChat) {
      onSelectChat(id);
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSend = (customAttachments?: Attachment[]) => {
    if ((!inputMessage.trim() && (!customAttachments || customAttachments.length === 0)) || isGenerating) return;
    const userText = inputMessage.trim();
    setInputMessage("");

    if (onSendMessage) {
      onSendMessage(userText, customAttachments);
    } else {
      if (internalMessages.length === 0) {
        setInternalChatHistory((prev) => [
          {
            id: activeChatId,
            title: userText ? (userText.length > 28 ? `${userText.slice(0, 28)}...` : userText) : "Attachment",
            group: "TODAY",
          },
          ...prev,
        ]);
      }
      setInternalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "user",
          content: userText,
          attachments: customAttachments,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };

  // ── Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // ── Keyboard shortcut ⌘N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewConversation]);

  const activeChat = chatHistory.find((item) => item.id === activeChatId);

  return (
    <div
      className={cn(
        isDark ? "dark" : "",
        "flex h-screen w-full overflow-hidden relative font-sans-body",
        "bg-[#FAF6F0] text-[#1A1A1A]",
        "dark:bg-[#141210] dark:text-[#EDE8E1]",
        "animate-fade-slide-in",
        className
      )}
    >
      {/* Sidebar Component */}
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeChatId={activeChatId}
        chatHistory={chatHistory}
        onNewConversation={handleNewConversation}
        onSelectChat={handleSelectChat}
        onDeleteChat={onDeleteChat}
        isGuest={isGuest || isTemporaryMode}
        userDisplayName={userDisplayName}
        onLogout={onLogout}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {showTopBar && (
          <ChatHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            title={activeChat?.title ?? title}
            isDark={isDark}
            setIsDark={setIsDark}
            isTemporaryMode={isTemporaryMode}
            onToggleTemporaryMode={onToggleTemporaryMode}
          />
        )}

        {messages.length === 0 ? (
          <ChatEmptyState
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSend={handleSend}
            isGenerating={isGenerating}
            placeholder={isTemporaryMode ? "Type a message in Temporary Chat…" : placeholder}
            isTemporaryMode={isTemporaryMode}
          />
        ) : (
          <>
            <ChatMessageList
              messages={messages}
              isGenerating={isGenerating}
              messagesEndRef={messagesEndRef}
            />

            <ChatComposer
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleSend={handleSend}
              isGenerating={isGenerating}
              placeholder={isTemporaryMode ? "Type a message in Temporary Chat…" : placeholder}
            />
          </>
        )}
      </div>
    </div>
  );
}
