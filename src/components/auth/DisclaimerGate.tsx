"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "alex_disclaimer_accepted";

export default function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setAccepted(true);
    }
    setLoading(false);
  }, []);

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, "true");
    setAccepted(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="border-b border-amber-900/40 bg-amber-950/20 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Important Medical Disclaimer
          </p>
        </div>

        <div className="space-y-4 px-6 py-6 text-sm leading-relaxed text-zinc-300">
          <p>
            <strong className="text-zinc-100">Alex is an AI-powered psychoeducational tool</strong>
            , not a licensed therapist, clinician, or diagnostic engine. It does not provide
            medical treatment, diagnostic assessments, or crisis intervention services.
          </p>
          <p>
            Alex is designed to offer conversational support, educational content, and
            interactive exercises — but it is <strong className="text-zinc-100">not a replacement</strong>{" "}
            for professional mental health care.
          </p>
          <p>
            If you are experiencing a medical emergency, a mental health crisis, or thoughts
            of harming yourself or others, <strong className="text-zinc-100">do not use Alex</strong>.
            Call or text <strong className="text-zinc-100">988</strong> (US) or your local
            emergency number immediately.
          </p>
          <p className="text-xs text-zinc-500">
            By checking the box below and continuing, you acknowledge that you understand
            the nature and limitations of this service.
          </p>
        </div>

        <div className="border-t border-zinc-800 px-6 py-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-500 rounded"
            />
            <span className="text-sm text-zinc-300">
              I understand that Alex is an AI wellness companion, not a medical provider,
              and I agree to the above terms.
            </span>
          </label>
          <button
            onClick={handleAccept}
            disabled={!checked}
            className="mt-4 w-full rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-30 transition-colors"
          >
            I Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
