import { useState, useEffect, useCallback } from "react";
import type { ChatMessage, ChatHistoryItem } from "@/components/chat/types";

const STORAGE_KEY = "safvan_guest_session";

interface GuestSessionData {
  conversations: Record<string, ChatMessage[]>;
  chatHistory: ChatHistoryItem[];
  activeChatId: string;
}

function loadSession(): GuestSessionData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestSessionData;
  } catch {
    return null;
  }
}

function saveSession(data: GuestSessionData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage quota exceeded — silently skip
  }
}

/**
 * Manages temporary guest chat state backed by sessionStorage.
 *
 * - Data is automatically cleared when the browser tab is closed (sessionStorage semantics).
 * - On page refresh within the same tab, the session is restored transparently.
 * - Nothing is written to any database.
 */
export function useGuestSession() {
  const [initialized, setInitialized] = useState(false);
  const [conversations, setConversationsRaw] = useState<Record<string, ChatMessage[]>>({});
  const [chatHistory, setChatHistoryRaw] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatIdRaw] = useState<string>(() => Date.now().toString());

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setConversationsRaw(saved.conversations);
      setChatHistoryRaw(saved.chatHistory);
      setActiveChatIdRaw(saved.activeChatId);
    }
    setInitialized(true);
  }, []);

  // Persist every state update back to sessionStorage
  const setConversations = useCallback(
    (updater: React.SetStateAction<Record<string, ChatMessage[]>>) => {
      setConversationsRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveSession({ conversations: next, chatHistory, activeChatId });
        return next;
      });
    },
    [chatHistory, activeChatId]
  );

  const setChatHistory = useCallback(
    (updater: React.SetStateAction<ChatHistoryItem[]>) => {
      setChatHistoryRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveSession({ conversations, chatHistory: next, activeChatId });
        return next;
      });
    },
    [conversations, activeChatId]
  );

  const setActiveChatId = useCallback(
    (id: string) => {
      setActiveChatIdRaw(id);
      saveSession({ conversations, chatHistory, activeChatId: id });
    },
    [conversations, chatHistory]
  );

  /** Wipe the entire guest session (e.g., when user logs in) */
  const clearGuestSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setConversationsRaw({});
    setChatHistoryRaw([]);
    setActiveChatIdRaw(Date.now().toString());
  }, []);

  return {
    initialized,
    conversations,
    setConversations,
    chatHistory,
    setChatHistory,
    activeChatId,
    setActiveChatId,
    clearGuestSession,
  };
}
