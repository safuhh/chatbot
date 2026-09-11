import React from "react";
import {
  Menu,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  title: string;
  isDark: boolean;
  setIsDark: (dark: boolean | ((prev: boolean) => boolean)) => void;
  isTemporaryMode?: boolean;
  onToggleTemporaryMode?: (enabled: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  title,
  isDark,
  setIsDark,
  isTemporaryMode = false,
  onToggleTemporaryMode,
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between",
        "backdrop-blur-md border-b",
        "bg-[#FAF6F0]/85 border-[#E7DCCC]",
        "dark:bg-[#141210]/85 dark:border-[#2E2820]",
        "animate-fade-slide-down"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={cn(
            "p-2 sm:p-1.5 rounded-lg shrink-0 transition-all duration-200 active:scale-90",
            "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1]",
            "dark:text-[#9A8E80] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
          )}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 hidden md:block" />
          ) : (
            <PanelLeft className="w-4 h-4 hidden md:block" />
          )}
          <Menu className="w-4 h-4 md:hidden" />
        </button>
        <h1 className="font-sans font-semibold text-sm sm:text-base tracking-tight truncate text-[#1A1A1A] dark:text-[#EDE8E1]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Temporary Chat Toggle Button */}
        {onToggleTemporaryMode && (
          <button
            onClick={() => onToggleTemporaryMode(!isTemporaryMode)}
            title={isTemporaryMode ? "Disable Temporary Chat (Switch to Normal)" : "Enable Temporary Chat (Incognito / Unsaved)"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              isTemporaryMode
                ? "bg-[#C4552F] text-white border-[#C4552F] shadow-sm shadow-[#C4552F]/20"
                : "bg-[#FAF6F0] hover:bg-[#F4ECE1] text-[#8A7E6C] hover:text-[#1A1A1A] border-[#E7DCCC] dark:bg-[#1E1A15] dark:hover:bg-[#28221B] dark:text-[#9A8E80] dark:hover:text-[#EDE8E1] dark:border-[#2E2820]"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isTemporaryMode ? "Temporary On" : "Temporary Chat"}
            </span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark((prev) => !prev)}
          title={isDark ? "Light Mode" : "Dark Mode"}
          className={cn(
            "p-2 sm:p-1.5 rounded-lg transition-colors",
            "text-[#8A7E6C] hover:text-[#1A1A1A] hover:bg-[#F4ECE1]",
            "dark:text-[#9A8E80] dark:hover:text-[#EDE8E1] dark:hover:bg-[#1E1A15]"
          )}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
