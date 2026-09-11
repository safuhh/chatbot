import { supabase } from "./supabase";

/**
 * Register a new user with email and password.
 * Returns the user object on success, throws on error.
 */
export async function registerUser(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;

  // Supabase returns a user object with identities: [] when the email ALREADY exists
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("An account with this email already exists. Try signing in instead.");
  }

  // Client-side fallback to ensure public.profiles record is created if session is present
  if (data.user && data.session) {
    try {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email || email,
          full_name: name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch {
      // Trigger handles server-side profile creation if client RLS blocks before session initialization
    }
  }

  return { user: data.user, session: data.session };
}

/**
 * Sign in with email and password.
 * Supabase stores the session (access + refresh token) in memory/cookie automatically.
 */
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

/**
 * Sign out the current user and invalidate the Supabase session.
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Returns the currently active Supabase session (or null).
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
