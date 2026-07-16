// Shared chat utilities for client-side components.

/**
 * Report a bot-generated message for UGC moderation (Apple Guideline 1.2).
 * Shows a brief toast notification on success.
 */
export async function reportMessage(messageId: string) {
  try {
    const res = await fetch("/api/chat/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId })
    });
    if (res.ok) {
      const toast = document.createElement("div");
      toast.className =
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-900/40 bg-red-950/80 px-4 py-2 text-xs text-red-200 backdrop-blur-sm transition-all duration-300";
      toast.textContent = "Message reported. Thank you.";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  } catch {
    // silently fail — reporting is best-effort
  }
}
