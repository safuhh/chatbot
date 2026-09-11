import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/lib/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps any route that requires authentication.
 * - While auth is loading → shows a branded spinner
 * - If user is a guest (not logged in) → redirects to /login
 * - If user is logged in → renders children normally
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF6F0] dark:bg-[#141210]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="w-10 h-10 rounded-xl bg-[#C4552F] flex items-center justify-center shadow-lg animate-pulse">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white stroke-[1.5]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-[#8A7E6C] dark:text-[#6B6358] font-mono tracking-wide">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
