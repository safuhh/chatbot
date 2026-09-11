import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TerraChatUI, { ChatMessage, ChatHistoryItem, Attachment } from "@/components/ui/terra-chat";
import { streamGeminiChat } from "@/lib/gemini";
import { useAuthContext } from "@/lib/AuthContext";
import { useGuestSession } from "@/lib/useGuestSession";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import {
  loadConversations,
  createConversation,
  deleteConversation,
  loadMessages,
  saveMessage,
} from "@/lib/chatApi";

/**
 * ChatApp — Main chatbot experience.
 *
 * Data strategy:
 *  • Logged-in + Normal mode  → All conversations & messages saved to Supabase.
 *  • Temporary mode (any user) → In-memory only; NOTHING written to Supabase.
 *  • Guest (not logged in)     → In-memory only via useGuestSession (sessionStorage).
 */
export default function ChatApp() {
  const { user, isGuest, logout } = useAuthContext();
  const { chatId: urlChatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();

  // ── Temporary Chat ─────────────────────────────────────────────────────────
  const [isTemporaryMode, setIsTemporaryMode] = useState<boolean>(false);

  // ── Login Modal ────────────────────────────────────────────────────────────
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string>("");

  // ── Guest / Temporary session (sessionStorage) ─────────────────────────────
  const {
    initialized: guestInitialized,
    conversations: guestConversations,
    setConversations: setGuestConversations,
    chatHistory: guestChatHistory,
    setChatHistory: setGuestChatHistory,
    activeChatId: guestActiveChatId,
    setActiveChatId: setGuestActiveChatId,
  } = useGuestSession();

  // ── Authenticated session (Supabase-backed) ────────────────────────────────
  const [authConversations, setAuthConversations] = useState<Record<string, ChatMessage[]>>({});
  const [authChatHistory, setAuthChatHistory] = useState<ChatHistoryItem[]>([]);
  const [authActiveChatId, setAuthActiveChatId] = useState<string>(() => {
    if (urlChatId) return urlChatId;
    const saved = typeof window !== "undefined" ? localStorage.getItem("last_active_chat_id") : null;
    if (saved) return saved;
    return Date.now().toString();
  });
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Track which conversations have been loaded from Supabase to avoid re-fetching
  const loadedConversationIds = useRef<Set<string>>(new Set());
  // Track if the sidebar history has been loaded for this user
  const historyLoadedForUser = useRef<string | null>(null);
  // AbortController for the current in-flight Gemini request — cancels stale requests
  const abortRef = useRef<AbortController | null>(null);

  // ── Shared State ───────────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // ── Active state routing (temporary vs auth vs guest) ──────────────────────
  const isAuthMode = !isTemporaryMode && !!user;

  const conversations = isAuthMode ? authConversations : guestConversations;
  const chatHistory = isAuthMode ? authChatHistory : guestChatHistory;
  const activeChatId = isAuthMode ? authActiveChatId : guestActiveChatId;

  const setActiveChatId = useCallback(
    (id: string) => {
      if (isAuthMode) setAuthActiveChatId(id);
      else setGuestActiveChatId(id);
    },
    [isAuthMode, setGuestActiveChatId]
  );

  const currentMessages = conversations[activeChatId] || [];

  // ── Sync URL param with state when user navigates back/forward in browser ──
  useEffect(() => {
    if (isAuthMode && urlChatId && urlChatId !== authActiveChatId) {
      setAuthActiveChatId(urlChatId);
      localStorage.setItem("last_active_chat_id", urlChatId);
    }
  }, [urlChatId, authActiveChatId, isAuthMode]);

  // ── Load conversation list from Supabase when user logs in ─────────────────
  useEffect(() => {
    if (!user || isTemporaryMode) return;
    if (historyLoadedForUser.current === user.id) return;

    historyLoadedForUser.current = user.id;
    setAuthLoading(true);

    loadConversations().then((history) => {
      setAuthChatHistory(history);
      setAuthLoading(false);

      if (history.length > 0) {
        if (urlChatId) {
          const exists = history.some((item) => item.id === urlChatId);
          if (exists) {
            setAuthActiveChatId(urlChatId);
            localStorage.setItem("last_active_chat_id", urlChatId);
          } else {
            // URL chatId doesn't exist in history, redirect to latest
            const defaultId = history[0].id;
            setAuthActiveChatId(defaultId);
            localStorage.setItem("last_active_chat_id", defaultId);
            navigate(`/c/${defaultId}`, { replace: true });
          }
        } else {
          // No URL chatId: if a valid last active chat was saved, restore it
          const savedId = localStorage.getItem("last_active_chat_id");
          const existsSaved = savedId && history.some((item) => item.id === savedId);
          if (existsSaved && savedId) {
            setAuthActiveChatId(savedId);
            navigate(`/c/${savedId}`, { replace: true });
          }
          // If no active chat saved (e.g. user initiated New Conversation), remain on empty chat at /
        }
      }
    });
  }, [user, isTemporaryMode, urlChatId, navigate]);

  // ── When user switches to a conversation, load its messages if not cached ──
  useEffect(() => {
    if (!isAuthMode || !activeChatId) return;
    if (loadedConversationIds.current.has(activeChatId)) return;

    loadedConversationIds.current.add(activeChatId);
    loadMessages(activeChatId).then((msgs) => {
      setAuthConversations((prev) => ({ ...prev, [activeChatId]: msgs }));
    });
  }, [isAuthMode, activeChatId]);

  // ── Reset auth state when user logs out ────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setAuthConversations({});
      setAuthChatHistory([]);
      setAuthActiveChatId(Date.now().toString());
      loadedConversationIds.current.clear();
      historyLoadedForUser.current = null;
      localStorage.removeItem("last_active_chat_id");
    }
  }, [user]);



  // ── Temporary Chat Toggle ──────────────────────────────────────────────────
  const handleToggleTemporaryMode = (enabled: boolean) => {
    setIsTemporaryMode(enabled);
    if (enabled) {
      const freshId = Date.now().toString();
      setGuestActiveChatId(freshId);
      setGuestConversations((prev) => ({ ...prev, [freshId]: [] }));
    }
  };

  // ── New Conversation ───────────────────────────────────────────────────────
  const handleNewConversation = () => {
    const newId = Date.now().toString();
    setActiveChatId(newId);
    if (isAuthMode) {
      setAuthConversations((prev) => ({ ...prev, [newId]: [] }));
      localStorage.removeItem("last_active_chat_id");
      navigate("/");
    }
  };

  // ── Select Conversation ────────────────────────────────────────────────────
  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    if (isAuthMode) {
      localStorage.setItem("last_active_chat_id", id);
      if (urlChatId !== id) {
        navigate(`/c/${id}`);
      }
    }
  };

  // ── Delete Conversation ────────────────────────────────────────────────────
  const handleDeleteChat = async (id: string) => {
    if (isAuthMode) {
      // Delete from Supabase
      await deleteConversation(id);

      // Update local state immediately
      const nextHistory = authChatHistory.filter((item) => item.id !== id);
      setAuthChatHistory(nextHistory);
      setAuthConversations((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      loadedConversationIds.current.delete(id);

      if (authActiveChatId === id) {
        if (nextHistory.length > 0) {
          const nextActiveId = nextHistory[0].id;
          setAuthActiveChatId(nextActiveId);
          localStorage.setItem("last_active_chat_id", nextActiveId);
          navigate(`/c/${nextActiveId}`, { replace: true });
        } else {
          const newId = Date.now().toString();
          setAuthActiveChatId(newId);
          localStorage.removeItem("last_active_chat_id");
          navigate("/", { replace: true });
        }
      }
    } else {
      // Guest / Temporary — remove from in-memory state
      setGuestChatHistory((prev) => prev.filter((item) => item.id !== id));
      setGuestConversations((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (guestActiveChatId === id) {
        setGuestActiveChatId(Date.now().toString());
      }
    }
  };

  // ── Core send message function ─────────────────────────────────────────────
  // Max conversation turns sent to Gemini. Older messages are dropped to reduce
  // token count and improve time-to-first-token on long conversations.
  const MAX_HISTORY_MESSAGES = 20; // 10 user + 10 assistant turns

  const executeSendMessage = useCallback(async (
    userText: string,
    isTemp: boolean,
    attachments?: Attachment[]
  ): Promise<void> => {
    // ⚡ Cancel any in-flight request immediately so we don't waste quota
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const abortController = new AbortController();
    abortRef.current = abortController;

    // ⚡ Show generating state FIRST — before any state updates or async work
    // so the typing indicator appears in the same React paint as the Send click
    setIsGenerating(true);

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Decide which state bucket to operate on
    const targetActiveChatId = isTemp ? guestActiveChatId : authActiveChatId;
    const targetConversations = isTemp ? guestConversations : authConversations;
    const targetSetConversations = isTemp ? setGuestConversations : setAuthConversations;
    const targetSetChatHistory = isTemp ? setGuestChatHistory : setAuthChatHistory;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: userText,
      attachments,
      time: timeString,
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: "assistant",
      content: "",
      time: timeString,
    };

    const existingThread = targetConversations[targetActiveChatId] || [];
    const isNewConversation = existingThread.length === 0;

    // Create a title from the first message
    const titleText =
      userText || (attachments && attachments.length > 0 ? attachments[0].name : "New Chat");
    const title = titleText.length > 60 ? `${titleText.slice(0, 60)}...` : titleText;
    const displayTitle = title.length > 28 ? `${title.slice(0, 28)}...` : title;

    // Add to sidebar history if it's a new conversation
    if (isNewConversation) {
      const newHistoryItem: ChatHistoryItem = {
        id: targetActiveChatId,
        title: displayTitle,
        group: "TODAY",
      };
      targetSetChatHistory((prev: ChatHistoryItem[]) => [newHistoryItem, ...prev]);

      // ⚡ Fire-and-forget — do NOT await; streaming starts immediately
      if (!isTemp && user) {
        loadedConversationIds.current.add(targetActiveChatId);
        localStorage.setItem("last_active_chat_id", targetActiveChatId);
        navigate(`/c/${targetActiveChatId}`, { replace: true });
        createConversation(targetActiveChatId, title, user.id).catch((e) =>
          console.warn("[ChatApp] createConversation:", e)
        );
      }
    }

    // Update local state with user message + empty assistant placeholder
    const updatedThread = [...existingThread, userMsg, assistantMsg];
    // Track the index of the assistant message for O(1) updates during streaming
    const assistantMsgIndex = updatedThread.length - 1;

    targetSetConversations((prev: Record<string, ChatMessage[]>) => ({
      ...prev,
      [targetActiveChatId]: updatedThread,
    }));

    // ⚡ Fire-and-forget — save user message without blocking stream start
    if (!isTemp && user) {
      saveMessage(userMsg, targetActiveChatId).catch((e) =>
        console.warn("[ChatApp] saveMessage(user):", e)
      );
    }

    // ⚡ Trim history to last MAX_HISTORY_MESSAGES before sending to Gemini.
    // Fewer tokens → lower TTFT, especially on long conversations.
    const trimmedHistory = existingThread.slice(-MAX_HISTORY_MESSAGES);

    // Stream response from Gemini
    // ⚡ skipCache=true for Temporary Chat — those responses must not pollute the cache
    let finalContent = "";
    try {
      await streamGeminiChat(
        trimmedHistory,
        userText,
        (updatedText: string) => {
          // Drop updates from an aborted request
          if (abortController.signal.aborted) return;
          finalContent = updatedText;
          // ⚡ O(1) update: directly replace the assistant message at its known index
          targetSetConversations((prev: Record<string, ChatMessage[]>) => {
            const thread = prev[targetActiveChatId];
            if (!thread) return prev;
            const updated = [...thread];
            updated[assistantMsgIndex] = { ...updated[assistantMsgIndex], content: updatedText };
            return { ...prev, [targetActiveChatId]: updated };
          });
        },
        attachments,
        isTemp // skipCache
      );
    } catch (err) {
      if (!abortController.signal.aborted) {
        console.error("[ChatApp] streamGeminiChat error:", err);
      }
    }

    // Only update state if this request wasn't superseded by a newer one
    if (!abortController.signal.aborted) {
      setIsGenerating(false);
      abortRef.current = null;

      // Save completed assistant message to Supabase (fire-and-forget)
      if (!isTemp && user && finalContent) {
        const finalAssistantMsg: ChatMessage = {
          id: assistantMsgId,
          sender: "assistant",
          content: finalContent,
          time: timeString,
        };
        saveMessage(finalAssistantMsg, targetActiveChatId).catch((e) =>
          console.warn("[ChatApp] saveMessage(assistant):", e)
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isTemporaryMode, guestActiveChatId, authActiveChatId, guestConversations, authConversations]);

  // ── Main send handler (called by UI) ───────────────────────────────────────
  const handleSendMessage = useCallback(async (
    userText: string,
    attachments?: Attachment[]
  ): Promise<void> => {
    // Temporary Chat — no auth check, no persistence
    if (isTemporaryMode) {
      await executeSendMessage(userText, true, attachments);
      return;
    }

    // Normal Chat — require login
    if (user) {
      await executeSendMessage(userText, false, attachments);
    } else {
      setPendingUserMessage(userText);
      setShowLoginModal(true);
    }
  }, [isTemporaryMode, user, executeSendMessage]);

  // ── Regenerate handler ─────────────────────────────────────────────────────
  const handleRegenerate = useCallback(async (): Promise<void> => {
    if (isGenerating) return;
    const thread = currentMessages;
    if (!thread || thread.length === 0) return;

    // Find last user message in the thread
    const lastUserMsgIndex = [...thread].reverse().findIndex((m) => m.sender === "user");
    if (lastUserMsgIndex === -1) return;

    const actualIndex = thread.length - 1 - lastUserMsgIndex;
    const lastUserMsg = thread[actualIndex];

    // Truncate thread to before the last user message turn
    const trimmedThread = thread.slice(0, actualIndex);

    const targetSetConversations = isTemporaryMode ? setGuestConversations : setAuthConversations;
    const targetActiveChatId = isTemporaryMode ? guestActiveChatId : authActiveChatId;

    targetSetConversations((prev) => ({
      ...prev,
      [targetActiveChatId]: trimmedThread,
    }));

    await executeSendMessage(lastUserMsg.content, isTemporaryMode, lastUserMsg.attachments);
  }, [
    isGenerating,
    currentMessages,
    isTemporaryMode,
    setGuestConversations,
    setAuthConversations,
    guestActiveChatId,
    authActiveChatId,
    executeSendMessage,
  ]);

  // ── Switch to temporary mode from modal ────────────────────────────────────
  const handleSwitchToTemporaryFromModal = () => {
    setIsTemporaryMode(true);
    setPendingUserMessage("");
    const freshId = Date.now().toString();
    setGuestActiveChatId(freshId);
    setGuestConversations((prev) => ({ ...prev, [freshId]: [] }));
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isTemporaryMode && !guestInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF6F0] dark:bg-[#141210]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C4552F] flex items-center justify-center text-white animate-pulse">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-white stroke-2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-xs text-[#8A7E6C] dark:text-[#6B6358] font-mono">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <TerraChatUI
        title="Safvan AI"
        messages={currentMessages}
        onSendMessage={handleSendMessage}
        onRegenerate={handleRegenerate}
        onNewConversation={handleNewConversation}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        isGenerating={isGenerating || authLoading}
        isGuest={isGuest}
        isTemporaryMode={isTemporaryMode}
        onToggleTemporaryMode={handleToggleTemporaryMode}
        userDisplayName={user?.user_metadata?.full_name || user?.email || undefined}
        onLogout={logout}
        onDeleteChat={handleDeleteChat}
      />

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToTemporary={handleSwitchToTemporaryFromModal}
        pendingMessage={pendingUserMessage}
      />
    </>
  );
}
