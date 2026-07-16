"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function anon() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/anon", { method: "POST" });
    if (res.ok) router.push("/onboarding");
    else {
      setError("Anonymous sign-in failed. Try again.");
      setBusy(false);
    }
  }

  async function forgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSent(true);
        setError(null);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function creds(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      // If the user has already completed onboarding (returning user), skip straight to dashboard
      if (data.hasCompletedOnboarding) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } else {
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Hey, I&apos;m Alex.</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {mode === "register"
          ? "Create an account so Alex remembers you across devices."
          : "Sign in to remember you, or jump in anonymously."}
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={creds} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-600 transition-colors"
        />
        <div className="relative">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="password (min 8 chars)"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
        <button
          disabled={busy}
          className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {busy ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => {
            setMode(mode === "register" ? "signin" : "register");
            setForgotMode(false);
            setForgotSent(false);
            setError(null);
          }}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {mode === "register" ? "Already have an account?" : "No account? Create one"}
        </button>

        {mode === "signin" && !forgotMode && (
          <button
            onClick={() => {
              setForgotMode(true);
              setError(null);
            }}
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Forgot password?
          </button>
        )}
      </div>

      {/* Forgot password flow */}
      {forgotMode && !forgotSent && (
        <form onSubmit={forgotPassword} className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs text-zinc-400">
            Enter your email and I'll send you a reset link.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-zinc-600 transition-colors"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {busy ? "Sending..." : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => { setForgotMode(false); setError(null); }}
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {forgotSent && (
        <div className="mt-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-center">
          <span className="text-2xl">📬</span>
          <p className="mt-2 text-sm text-emerald-200">Check your email!</p>
          <p className="mt-1 text-xs text-zinc-500">
            If that email is registered, you'll receive a reset link shortly.
          </p>
          <button
            onClick={() => { setForgotMode(false); setForgotSent(false); setError(null); }}
            className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      )}

      {/* Sign in with Google */}
      <button
        onClick={() => {
          setError(null);
          // Redirect directly to /api/auth/google. If Google OAuth is not
          // configured, the server returns a 501 JSON error page — the user
          // can press Back to return here.
          window.location.href = "/api/auth/google";
        }}
        className="group flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 py-3 text-sm text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700 disabled:opacity-50 transition-all"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="font-medium">Sign in with Google</span>
      </button>

      <div className="relative my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-zinc-800" />
        <span className="text-xs text-zinc-600">or</span>
        <div className="flex-1 border-t border-zinc-800" />
      </div>

      <button
        onClick={anon}
        disabled={busy}
        className="w-full rounded-xl border border-zinc-800 py-3 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
      >
        Continue anonymously
      </button>
    </main>
  );
}
