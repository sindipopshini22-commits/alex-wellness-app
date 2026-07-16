"use client";
import { useState } from "react";

export default function ExportButton() {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    const res = await fetch("/api/user/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alex-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  return (
    <button
      onClick={download}
      disabled={busy}
      className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
    >
      {busy ? "Preparing..." : "Download my data (JSON)"}
    </button>
  );
}
