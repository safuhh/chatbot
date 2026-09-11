import { useState, useEffect, useRef, useCallback } from "react";
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
  const [authActiveChatId, setAuthActiveChatId] = useState<string>(() => Date.now().toString());
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Track which conversations have been loaded from Supabase to avoid re-fetching
  const loadedConversationIds = useRef<Set<string>>(new Set());
  // Track if the sidebar history has been loaded for this user
  const historyLoadedForUser = useRef<string | null>(null);

  // ── Shared State ───────────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.6-flash");

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
    [isAuthMode]
  );

  const currentMessages = conversations[activeChatId] || [];

  // ── Load conversation list from Supabase when user logs in ─────────────────
  useEffect(() => {
    if (!user || isTemporaryMode) return;
    if (historyLoadedForUser.current === user.id) return;

    historyLoadedForUser.current = user.id;
    setAuthLoading(true);

    loadConversations().then((history) => {
      setAuthChatHistory(history);
      setAuthLoading(false);
    });
  }, [user, isTemporaryMode]);

  // ── When user switches to a conversation, load its messages if not cached ──
  useEffect(() => {
    if (!isAuthMode || !activeChatId) return;
    if (loadedConversationIds.current.has(activeChatId)) return;
    // Only fetch if it's an existing conversation (in history), not a brand-new local one
    const existsInHistory = authChatHistory.some((item) => item.id === activeChatId);
    if (!existsInHistory) return;

    loadedConversationIds.current.add(activeChatId);
    loadMessages(activeChatId).then((msgs) => {
      setAuthConversations((prev) => ({ ...prev, [activeChatId]: msgs }));
    });
  }, [isAuthMode, activeChatId, authChatHistory]);

  // ── Reset auth state when user logs out ────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setAuthConversations({});
      setAuthChatHistory([]);
      setAuthActiveChatId(Date.now().toString());
      loadedConversationIds.current.clear();
      historyLoadedForUser.current = null;
    }
  }, [user]);

  // ── Check for saved draft message from login redirect ──────────────────────
  useEffect(() => {
    const draft = sessionStorage.getItem("draft_message");
    if (draft && user) {
      sessionStorage.removeItem("draft_message");
      executeSendMessage(draft, false);
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
    }
  };

  // ── Select Conversation ────────────────────────────────────────────────────
  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
  };

  // ── Delete Conversation ────────────────────────────────────────────────────
  const handleDeleteChat = async (id: string) => {
    if (isAuthMode) {
      // Delete from Supabase
      await deleteConversation(id);

      // Update local state immediately
      setAuthChatHistory((prev) => prev.filter((item) => item.id !== id));
      setAuthConversations((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      loadedConversationIds.current.delete(id);

      if (authActiveChatId === id) {
        setAuthActiveChatId(Date.now().toString());
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
  const executeSendMessage = async (
    userText: string,
    isTemp: boolean,
    attachments?: Attachment[]
  ): Promise<void> => {
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
    const title =
      titleText.length > 60 ? `${titleText.slice(0, 60)}...` : titleText;
    const displayTitle = title.length > 28 ? `${title.slice(0, 28)}...` : title;

    // Add to sidebar history if it's a new conversation
    if (isNewConversation) {
      const newHistoryItem: ChatHistoryItem = {
        id: targetActiveChatId,
        title: displayTitle,
        group: "TODAY",
      };
      targetSetChatHistory((prev: ChatHistoryItem[]) => [newHistoryItem, ...prev]);

      // Persist conversation to Supabase (only for authenticated non-temporary users)
      if (!isTemp && user) {
        loadedConversationIds.current.add(targetActiveChatId);
        await createConversation(targetActiveChatId, title, user.id);
      }
    }

    // Update local state with user message + empty assistant placeholder
    const updatedThread = [...existingThread, userMsg, assistantMsg];
    targetSetConversations((prev: Record<string, ChatMessage[]>) => ({
      ...prev,
      [targetActiveChatId]: updatedThread,
    }));
    setIsGenerating(true);

    // Save user message to Supabase
    if (!isTemp && user) {
      await saveMessage(userMsg, targetActiveChatId);
    }

    // Stream response from Gemini
    let finalContent = "";
    await streamGeminiChat(
      existingThread,
      userText,
      (updatedText: string) => {
        finalContent = updatedText;
        targetSetConversations((prev: Record<string, ChatMessage[]>) => {
          const thread = prev[targetActiveChatId] || [];
          return {
            ...prev,
            [targetActiveChatId]: thread.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: updatedText } : msg
            ),
          };
        });
      },
      attachments
    );

    setIsGenerating(false);

    // Save completed assistant message to Supabase
    if (!isTemp && user && finalContent) {
      const finalAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: "assistant",
        content: finalContent,
        time: timeString,
      };
      await saveMessage(finalAssistantMsg, targetActiveChatId);
    }
  };

  // ── Main send handler (called by UI) ───────────────────────────────────────
  const handleSendMessage = async (
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
  };

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
        onNewConversation={handleNewConversation}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        isGenerating={isGenerating || authLoading}
        modelName={selectedModel}
        onModelChange={(model: string) => setSelectedModel(model)}
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
