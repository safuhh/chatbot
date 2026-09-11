import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { loginUser, logoutUser, registerUser } from "./authApi";

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Central auth hook — subscribes to Supabase session state.
 *
 * Supabase automatically handles:
 * - Access token refresh (via refresh token stored in memory/cookie)
 * - Session persistence across page reloads
 * - Token expiry and rotation
 *
 * We never manually store or read JWT tokens.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount (handles page refresh)
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[useAuth] getSession error:", err);
        setUser(null);
        setLoading(false);
      });

    // Real-time listener for auth events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await loginUser(email, password);
    setUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await registerUser(email, password, name);
    // Note: if email confirmation is disabled in Supabase, the user is
    // immediately logged in after signUp. If enabled, they must confirm first.
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user ?? null);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isGuest: !loading && user === null,
    login,
    register,
    logout,
  };
}
