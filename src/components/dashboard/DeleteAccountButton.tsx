"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function destroy() {
    if (!confirm("This will permanently delete your account and all data. Continue?")) return;
    setBusy(true);
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      alert("Delete failed. Check console.");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={destroy}
      disabled={busy}
      className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-500 hover:border-red-900/40 hover:text-red-300 disabled:opacity-50"
    >
      {busy ? "Deleting..." : "Delete account"}
    </button>
  );
}
