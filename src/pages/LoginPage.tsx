import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuthContext } from "@/lib/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmail = (location.state as { email?: string })?.email;

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem("remember_me") === "true";
  });
  const [email, setEmail] = useState(() => {
    return stateEmail || localStorage.getItem("remembered_email") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync pre-filled email from location state and clear any legacy saved password
  useEffect(() => {
    localStorage.removeItem("remembered_password");
    if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [stateEmail]);

  // If already logged in, redirect to chat
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  // Client-side validation
  function validate(): string | null {
    if (!email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);

      // Handle Remember Me feature (only save email, NEVER passwords)
      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
        localStorage.setItem("remembered_email", email.trim());
      } else {
        localStorage.removeItem("remember_me");
        localStorage.removeItem("remembered_email");
      }
      localStorage.removeItem("remembered_password");

      navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      const status = typeof err === "object" && err !== null && "status" in err ? (err as { status?: number }).status : undefined;

      // Make Supabase / API error messages user-friendly
      if (status === 429 || msg.includes("429") || msg.includes("Too many requests") || msg.includes("Too Many Requests") || msg.includes("rate limit") || msg.includes("security purposes")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (msg.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please confirm your email address before logging in.");
      } else if (status === 404 || msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("sbpgs") || msg.includes("Not Found")) {
        setError("Authentication service is temporarily unavailable (404). Please try again or continue as Guest.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue with Safvan AI">
      <form onSubmit={handleSubmit} noValidate>
        <div className="p-7 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-up">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#1A1A1A] tracking-wide"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7E6C] pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                className={cn(
                  "w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none",
                  "bg-[#FAF6F0] text-[#1A1A1A] placeholder-[#8A7E6C]",
                  "border-[#E7DCCC] focus:border-[#C4552F] focus:ring-2 focus:ring-[#C4552F]/15"
                )}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#1A1A1A] tracking-wide"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7E6C] pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className={cn(
                  "w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none",
                  "bg-[#FAF6F0] text-[#1A1A1A] placeholder-[#8A7E6C]",
                  "border-[#E7DCCC] focus:border-[#C4552F] focus:ring-2 focus:ring-[#C4552F]/15"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7E6C] hover:text-[#1A1A1A] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password row */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer select-none">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E7DCCC] text-[#C4552F] focus:ring-[#C4552F]/30 focus:ring-offset-0 cursor-pointer accent-[#C4552F]"
              />
              <span className="font-medium text-[#1A1A1A]">Remember me</span>
            </label>
            <a
              href="#"
              className="text-[11px] text-[#C4552F] hover:text-[#A8421F] transition-colors font-medium"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={submitting}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 mt-2",
              "bg-[#C4552F] hover:bg-[#A8421F] active:scale-[0.98]",
              "shadow-sm shadow-[#C4552F]/30",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            )}
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Divider footer */}
        <div className="px-7 pb-6 border-t border-[#F0E3D5] pt-4">
          <p className="text-center text-xs text-[#8A7E6C]">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#C4552F] hover:text-[#A8421F] font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
