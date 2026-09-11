import { supabase } from "./supabase";
import { ChatMessage, ChatHistoryItem } from "@/components/chat/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DBConversation {
  id: string;
  title: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

interface DBMessage {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  time: string | null;
  codeFilename: string | null;
  codeSnippet: string | null;
  createdAt: string;
}

// ── Conversations ──────────────────────────────────────────────────────────────

/**
 * Load all conversations for the current authenticated user.
 * Returns as ChatHistoryItem[] for the sidebar.
 */
export async function loadConversations(): Promise<ChatHistoryItem[]> {
  const { data, error } = await supabase
    .from("Conversation")
    .select("id, title, createdAt")
    .not("user_id", "is", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("[chatApi] loadConversations error:", error.message);
    return [];
  }

  const now = new Date();

  return (data as DBConversation[]).map((conv) => {
    const created = new Date(conv.createdAt);
    const diffDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    let group: ChatHistoryItem["group"] = "OLDER";
    if (diffDays === 0) group = "TODAY";
    else if (diffDays <= 7) group = "LAST 7 DAYS";
    else if (diffDays <= 30) group = "LAST 30 DAYS";

    return {
      id: conv.id,
      title: conv.title,
      group,
    };
  });
}

/**
 * Create a new conversation in Supabase for the current user.
 * Returns the conversation ID on success, or null on failure.
 */
export async function createConversation(
  id: string,
  title: string,
  userId: string
): Promise<string | null> {
  const { error } = await supabase.from("Conversation").insert({
    id,
    title,
    user_id: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (error) {
    console.error("[chatApi] createConversation error:", error.message);
    return null;
  }

  return id;
}

/**
 * Delete a conversation (and its messages via CASCADE) from Supabase.
 */
export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from("Conversation")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[chatApi] deleteConversation error:", error.message);
  }
}

// ── Messages ───────────────────────────────────────────────────────────────────

/**
 * Load all messages for a given conversation from Supabase.
 * Returns ChatMessage[] ordered by createdAt ASC.
 */
export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("Message")
    .select("*")
    .eq("conversationId", conversationId)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("[chatApi] loadMessages error:", error.message);
    return [];
  }

  return (data as DBMessage[]).map((msg) => ({
    id: msg.id,
    sender: msg.sender as "user" | "assistant",
    content: msg.content,
    time: msg.time ?? undefined,
    codeSnippet: msg.codeFilename
      ? { filename: msg.codeFilename, code: msg.codeSnippet ?? "" }
      : undefined,
  }));
}

/**
 * Save a single message to Supabase.
 * Silently ignores errors (best-effort persistence).
 */
export async function saveMessage(
  msg: ChatMessage,
  conversationId: string
): Promise<void> {
  const { error } = await supabase.from("Message").insert({
    id: msg.id,
    conversationId,
    sender: msg.sender,
    content: msg.content,
    time: msg.time ?? null,
    codeFilename: msg.codeSnippet?.filename ?? null,
    codeSnippet: msg.codeSnippet?.code ?? null,
    createdAt: new Date().toISOString(),
  });

  if (error) {
    console.error("[chatApi] saveMessage error:", error.message);
  }
}

/**
 * Update an existing message's content in Supabase (for streaming assistant replies).
 */
export async function updateMessageContent(
  messageId: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from("Message")
    .update({ content })
    .eq("id", messageId);

  if (error) {
    console.error("[chatApi] updateMessageContent error:", error.message);
  }
}
