import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Shield, UserPlus, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToTemporary: () => void;
  pendingMessage?: string;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  onSwitchToTemporary,
  pendingMessage,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-up">
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all border",
          "bg-[#FAF6F0] text-[#1A1A1A] border-[#E7DCCC]",
          "dark:bg-[#1C1814] dark:text-[#EDE8E1] dark:border-[#2E2820]"
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A7E6C] hover:text-[#1A1A1A] dark:hover:text-[#EDE8E1] hover:bg-[#F4ECE1] dark:hover:bg-[#2A241E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#C4552F]/10 text-[#C4552F] mb-4">
          <Lock className="w-6 h-6" />
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold tracking-tight text-[#1A1A1A] dark:text-[#EDE8E1]">
          Sign in to save your chat
        </h3>
        <p className="mt-1.5 text-xs text-[#8A7E6C] dark:text-[#9A8E80] leading-relaxed">
          Logged-in users can store their chat history permanently. You can sign in, create a free account, or switch to <strong className="text-[#C4552F]">Temporary Chat</strong> mode to use the AI without an account.
        </p>

        {/* Pending message snippet preview if any */}
        {pendingMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#F4ECE1] dark:bg-[#25201A] border border-[#E7DCCC]/60 dark:border-[#332B22]">
            <p className="text-[11px] font-mono text-[#8A7E6C] dark:text-[#9A8E80] truncate">
              💬 Draft: "{pendingMessage}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => navigate("/login")}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white transition-all shadow-sm",
              "bg-[#C4552F] hover:bg-[#A8421F] active:scale-[0.98]"
            )}
          >
            <LogIn className="w-4 h-4" />
            Sign in to existing account
          </button>

          <button
            onClick={() => navigate("/register")}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all border",
              "bg-[#FAF6F0] hover:bg-[#F4ECE1] text-[#1A1A1A] border-[#E7DCCC]",
              "dark:bg-[#1C1814] dark:hover:bg-[#25201A] dark:text-[#EDE8E1] dark:border-[#332B22]"
            )}
          >
            <UserPlus className="w-4 h-4 text-[#C4552F]" />
            Create new account
          </button>

          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-[#E7DCCC] dark:border-[#2E2820]" />
            <span className="absolute bg-[#FAF6F0] dark:bg-[#1C1814] px-2 text-[10px] uppercase font-mono text-[#8A7E6C]">
              Or
            </span>
          </div>

          <button
            onClick={() => {
              onSwitchToTemporary();
              onClose();
            }}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all",
              "bg-[#F5EBE0] hover:bg-[#EBDDCC] text-[#8C3D20] dark:bg-[#2C241B] dark:hover:bg-[#382E22] dark:text-[#E89D7F]"
            )}
          >
            <Shield className="w-4 h-4 text-[#C4552F]" />
            Continue in Temporary Chat Mode
          </button>
        </div>
      </div>
    </div>
  );
};
