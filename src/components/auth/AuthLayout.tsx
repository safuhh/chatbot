import React from "react";
import { Feather } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

/**
 * Shared wrapper for Login and Register pages.
 * Matches the warm editorial design of the chat UI.
 */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(196,85,47,0.08) 0%, transparent 70%), #FAF6F0",
      }}
    >
      {/* Decorative grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#C4552F 1px, transparent 1px), linear-gradient(90deg, #C4552F 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-[420px] animate-fade-slide-in">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#C4552F] flex items-center justify-center text-white shadow-lg mb-4 animate-soft-pulse">
            <Feather className="w-5 h-5" />
          </div>
          <h1 className="font-sans font-bold text-2xl text-[#1A1A1A] tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[#8A7E6C] mt-1 text-center">{subtitle}</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border shadow-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            borderColor: "#E7DCCC",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#8A7E6C] mt-6 font-mono">
          Safvan AI · Secure Authentication
        </p>
      </div>
    </div>
  );
}
