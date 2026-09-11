export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  isImage: boolean;
  base64?: string;
  text?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  time?: string;
  isError?: boolean;
  isStreaming?: boolean;
  attachments?: Attachment[];
  codeSnippet?: {
    filename: string;
    code: string;
  };
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  group: "TODAY" | "YESTERDAY" | "LAST 7 DAYS" | "LAST 30 DAYS" | "OLDER";
}

export interface TerraChatProps {
  title?: string;
  messages?: ChatMessage[];
  onSendMessage?: (message: string, attachments?: Attachment[]) => void;
  onRegenerate?: () => void;
  onNewConversation?: () => void;
  chatHistory?: ChatHistoryItem[];
  activeChatId?: string;
  onSelectChat?: (id: string) => void;
  isGenerating?: boolean;
  placeholder?: string;
  showTopBar?: boolean;
  className?: string;
  /** True when the user is not logged in — enables guest/temporary mode */
  isGuest?: boolean;
  /** Display name for logged-in users (email or full name) */
  userDisplayName?: string;
  /** Called when the user clicks Sign out in the sidebar */
  onLogout?: () => Promise<void>;
  /** True when temporary (incognito / unsaved) chat mode is active */
  isTemporaryMode?: boolean;
  /** Called to toggle temporary chat mode on or off */
  onToggleTemporaryMode?: (enabled: boolean) => void;
  /** Called when a user deletes a conversation from the sidebar */
  onDeleteChat?: (id: string) => Promise<void> | void;
  /** Called to activate ChatGPT-style Voice-to-Voice mode */
  onOpenVoiceMode?: () => void;
}
