"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <span className="text-4xl">🔗</span>
          <h1 className="mt-4 text-lg font-semibold text-zinc-100">Invalid reset link</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This reset link is missing or invalid. Please request a new one.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-xl bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <span className="text-4xl">✅</span>
          <h1 className="mt-4 text-lg font-semibold text-zinc-100">Password reset!</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You can now sign in with your new password.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Sign in with new password
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔑</span>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Reset your password</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Enter a new password for your Alex account.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            minLength={8}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 placeholder:text-zinc-600"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            minLength={8}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {busy ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </main>
  );
}

// Suspense boundary required by Next.js 16 for components using useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        </div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
