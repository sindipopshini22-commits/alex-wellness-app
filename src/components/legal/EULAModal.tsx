"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EULA_TEXT, EULA_VERSION } from "@/lib/eula";

export default function Eulamodal({ onAccepted }: { onAccepted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Track whether the user has scrolled to the bottom.
    // This is a soft signal — we still let them tap I Agree regardless.
  }, []);

  async function accept() {
    setBusy(true);
    const res = await fetch("/api/legal/accept", { method: "POST" });
    if (res.ok) {
      onAccepted();
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <header className="border-b border-zinc-800 p-6">
          <h2 className="text-xl font-semibold">Before we start</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Alex is a wellness tool, not a medical device. Please read and accept our End-User License Agreement.
          </p>
        </header>

        <div
          className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-zinc-300"
          onScroll={e => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) setScrolled(true);
          }}
        >
          <pre className="whitespace-pre-wrap font-sans">{EULA_TEXT}</pre>
        </div>

        <footer className="border-t border-zinc-800 p-6">
          <p className="text-xs text-zinc-500">
            Version {EULA_VERSION}.{" "}
            {scrolled
              ? "Thanks for reading."
              : "Please scroll through the agreement before accepting."}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <a
              href="/legal/eula"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-400"
            >
              View full document
            </a>
            <button
              onClick={accept}
              disabled={busy}
              className="rounded-xl bg-zinc-100 px-6 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50"
            >
              {busy ? "Saving..." : "I Agree"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
