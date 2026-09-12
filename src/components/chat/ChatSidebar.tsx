import React, { useState } from "react";
import {
  Feather,
  Plus,
  Search,
  MessageSquare,
  LogOut,
  PanelLeftClose,
  X,
  ShieldOff,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatHistoryItem } from "./types";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeChatId: string;
  chatHistory: ChatHistoryItem[];
  onNewConversation: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  /** True when the user has not logged in */
  isGuest?: boolean;
  /** Display name or email for logged-in user */
  userDisplayName?: string;
  /** Called when the user clicks Sign out */
  onLogout?: () => Promise<void>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeChatId,
  chatHistory,
  onNewConversation,
  onSelectChat,
  onDeleteChat,
  isGuest = false,
  userDisplayName,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredHistory = chatHistory.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-[264px] max-w-[85vw] h-full h-[100dvh] flex flex-col shrink-0 overflow-hidden",
          "border-r",
          "bg-[#F4ECE1] border-[#E7DCCC]",
          "dark:bg-[#1A1A1A] dark:border-[#2E2820]",
          "sidebar-drawer-transition",
          "md:relative md:z-0 md:max-w-none",
          sidebarOpen
            ? "translate-x-0 md:ml-0 opacity-100 shadow-2xl md:shadow-none pointer-events-auto"
            : "-translate-x-full md:-ml-[264px] opacity-0 pointer-events-none"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "p-4 flex items-center justify-between border-b shrink-0",
            "border-[#E7DCCC]/60 dark:border-[#2E2820]/60"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#C4552F] flex items-center justify-center text-white shadow-sm animate-soft-pulse shrink-0">
              <Feather className="w-4 h-4" />
            </div>
            <span className="font-sans font-bold text-lg text-[#1A1A1A] dark:text-[#EDE8E1] tracking-tight">
              Safvan AI
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
              "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#E7DCCC]",
              "dark:text-[#9A8E80] dark:hover:text-[#EDE8E1] dark:hover:bg-[#2E2820]"
            )}
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4 hidden md:block" />
            <X className="w-4 h-4 md:hidden" />
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={onNewConversation}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#C4552F] hover:bg-[#A8421F] text-white rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>New conversation</span>
            </div>
            <span className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
              ⌘N
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7E6C] dark:text-[#6B6358]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className={cn(
                "w-full pl-8 pr-3 py-1.5 rounded-lg text-xs",
                "border focus:outline-none transition-colors",
                "bg-[#FAF6F0] border-[#E7DCCC] text-[#1A1A1A] placeholder-[#8A7E6C]",
                "focus:border-[#C4552F]",
                "dark:bg-[#141210] dark:border-[#2E2820] dark:text-[#EDE8E1] dark:placeholder-[#6B6358]"
              )}
            />
          </div>
        </div>

        {/* History Groups */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 space-y-4">
          {/* Guest session notice */}
          {isGuest && chatHistory.length > 0 && (
            <div
              className={cn(
                "mx-1 mb-1 px-3 py-2 rounded-lg flex items-start gap-2 text-[10px] leading-snug",
                "bg-amber-50 border border-amber-200 text-amber-700",
                "dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-400"
              )}
            >
              <ShieldOff className="w-3 h-3 mt-0.5 shrink-0" />
              <span>Temporary session — history clears when you close this tab.</span>
            </div>
          )}

          {(["TODAY", "YESTERDAY", "LAST 7 DAYS", "LAST 30 DAYS", "OLDER"] as const).map((group) => {
            const items = filteredHistory.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="space-y-0.5">
                <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-[#8A7E6C] dark:text-[#6B6358] uppercase font-mono">
                  {group}
                </div>
                {items.map((item) => {
                  const isActive = item.id === activeChatId;
                  const isConfirming = confirmDeleteId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150",
                        isActive
                          ? "bg-[#F0E3D5] border border-[#EAD6C4] text-[#C4552F] font-semibold dark:bg-[#2A1F16] dark:border-[#3D2F22] dark:text-[#D4663F]"
                          : "text-[#1A1A1A]/80 hover:bg-[#EAD6C4]/50 dark:text-[#EDE8E1]/70 dark:hover:bg-[#2E2820]/60"
                      )}
                    >
                      <button
                        onClick={() => onSelectChat(item.id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                      >
                        <MessageSquare
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive
                              ? "text-[#C4552F] dark:text-[#D4663F]"
                              : "text-[#8A7E6C] dark:text-[#6B6358]"
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </button>

                      {/* Delete action / Confirmation UI */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1 shrink-0 animate-fade-in pl-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteChat) onDeleteChat(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="p-1.5 sm:p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="p-1.5 sm:p-1 rounded bg-[#8A7E6C]/20 hover:bg-[#8A7E6C]/40 text-[#1A1A1A] dark:text-[#EDE8E1] transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(item.id);
                          }}
                          className={cn(
                            "p-1.5 sm:p-1 rounded transition-opacity shrink-0",
                            "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                            "text-[#8A7E6C] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
                            isActive && "opacity-100 text-red-500/80"
                          )}
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Account Row */}
        <div
          className={cn(
            "p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t shrink-0 z-10",
            "border-[#E7DCCC] bg-[#F4ECE1]",
            "dark:border-[#2E2820] dark:bg-[#1A1510]"
          )}
        >
          {isGuest ? (
            /* Guest / unauthenticated state */
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  "bg-amber-100 dark:bg-amber-900/30"
                )}
              >
                <ShieldOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold leading-tight text-[#1A1A1A] dark:text-[#EDE8E1] truncate">
                  Guest Mode
                </span>
                <span className="text-[10px] leading-tight text-amber-600 dark:text-amber-400">
                  Temporary · Not saved
                </span>
              </div>
            </div>
          ) : (
            /* Logged-in user state */
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] dark:bg-[#EDE8E1] text-[#FAF6F0] dark:text-[#1A1A1A] font-sans font-bold text-xs flex items-center justify-center shrink-0">
                  {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold leading-tight text-[#1A1A1A] dark:text-[#EDE8E1] truncate">
                    {userDisplayName || "Account"}
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-[#C4552F] dark:text-[#D4663F]">
                    Logged in
                  </span>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    onLogout();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors whitespace-nowrap",
                    "text-[#C4552F] bg-[#C4552F]/15 hover:bg-[#C4552F]/25 active:scale-95",
                    "dark:text-[#D4663F] dark:bg-[#D4663F]/20 dark:hover:bg-[#D4663F]/30"
                  )}
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Sign out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden",
          "sidebar-backdrop-transition",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
    </>
  );
};
