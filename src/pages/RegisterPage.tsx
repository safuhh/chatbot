import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuthContext } from "@/lib/AuthContext";

// Password strength scoring
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score, label: "Fair", color: "#f97316" };
  if (score <= 3) return { score, label: "Good", color: "#eab308" };
  return { score, label: "Strong", color: "#22c55e" };
}

export default function RegisterPage() {
  const { register, login, user, loading } = useAuthContext();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already logged in, redirect to chat
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const strength = password ? getPasswordStrength(password) : null;

  function validate(): string | null {
    if (!name.trim() || name.trim().length < 2)
      return "Please enter your full name (at least 2 characters).";
    if (!email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address.";
    if (!password) return "Please enter a password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);

      // Attempt immediate auto-login
      try {
        await login(email.trim(), password);
        navigate("/", { replace: true });
        return;
      } catch {
        setSuccess("Account created successfully! Redirecting to sign in...");
        setTimeout(() => navigate("/login", { state: { email: email.trim() }, replace: true }), 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";

      // If user already exists or rate limit was reached, try auto-login
      if (
        msg.includes("already exists") ||
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("429") ||
        msg.includes("rate limit")
      ) {
        try {
          await login(email.trim(), password);
          navigate("/", { replace: true });
          return;
        } catch {
          setError("An account with this email already exists. Try signing in instead.");
        }
      } else if (msg.includes("Password should be")) {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (msg.includes("valid email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("sbpgs") || msg.includes("Not Found")) {
        setError("Registration service is temporarily unavailable (404). Please try again later.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Start your journey with Safvan AI">
      <form onSubmit={handleSubmit} noValidate>
        <div className="p-7 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-up">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes("already exists") && (
                  <Link
                    to="/login"
                    state={{ email: email.trim() }}
                    className="block mt-1 font-semibold text-[#C4552F] hover:underline"
                  >
                    Click here to sign in with {email} →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs animate-fade-up">
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Name field */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-name"
              className="block text-xs font-semibold text-[#1A1A1A] tracking-wide"
            >
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7E6C] pointer-events-none" />
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="Your name"
                className={cn(
                  "w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none",
                  "bg-[#FAF6F0] text-[#1A1A1A] placeholder-[#8A7E6C]",
                  "border-[#E7DCCC] focus:border-[#C4552F] focus:ring-2 focus:ring-[#C4552F]/15"
                )}
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-[#1A1A1A] tracking-wide"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7E6C] pointer-events-none" />
              <input
                id="register-email"
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
              htmlFor="register-password"
              className="block text-xs font-semibold text-[#1A1A1A] tracking-wide"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7E6C] pointer-events-none" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="At least 6 characters"
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

            {/* Password strength bar */}
            {strength && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background:
                          i <= Math.ceil((strength.score / 5) * 4)
                            ? strength.color
                            : "#E7DCCC",
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="register-confirm"
              className="block text-xs font-semibold text-[#1A1A1A] tracking-wide"
            >
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7E6C] pointer-events-none" />
              <input
                id="register-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                placeholder="Repeat your password"
                className={cn(
                  "w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none",
                  "bg-[#FAF6F0] text-[#1A1A1A] placeholder-[#8A7E6C]",
                  confirmPassword && confirmPassword !== password
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                    : "border-[#E7DCCC] focus:border-[#C4552F] focus:ring-2 focus:ring-[#C4552F]/15"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7E6C] hover:text-[#1A1A1A] transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[10px] text-red-500 font-mono">Passwords don't match</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            type="submit"
            disabled={submitting || !!success}
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
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 border-t border-[#F0E3D5] pt-4">
          <p className="text-center text-xs text-[#8A7E6C]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#C4552F] hover:text-[#A8421F] font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
