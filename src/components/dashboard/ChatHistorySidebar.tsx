"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type SessionItem = {
  id: string;
  createdAt: string;
  preview: string;
  messageCount: number;
};

export default function ChatHistorySidebar({
  sessions,
  activeSessionId,
}: {
  sessions: SessionItem[];
  activeSessionId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNewChatBusy, setIsNewChatBusy] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [activeSessionId]);

  function switchSession(sessionId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("session", sessionId);
    params.set("tab", "chat");
    router.push(`/dashboard?${params.toString()}`);
  }

  async function newChat() {
    setIsNewChatBusy(true);
    const params = new URLSearchParams();
    params.set("new", "1");
    params.set("tab", "chat");
    router.push(`/dashboard?${params.toString()}`);
    setTimeout(() => setIsNewChatBusy(false), 500);
  }

  const sessionList = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Past Chats
        </h3>
        {/* Desktop collapse — hidden on mobile (uses its own close) */}
        <button
          onClick={() => setCollapsed(true)}
          className="hidden md:block rounded-lg p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
          title="Collapse sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-2">
        <button
          onClick={newChat}
          disabled={isNewChatBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <p className="mt-8 text-center text-xs text-zinc-600">No past chats yet.</p>
        ) : (
          <div className="space-y-1">
            {sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const date = new Date(s.createdAt);
              const dateStr = date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              const timeStr = date.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                    isActive
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {s.preview === "Empty session"
                        ? "Empty session"
                        : s.preview + (s.preview.length >= 80 ? "..." : "")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
                    <span>{dateStr} · {timeStr}</span>
                    {s.messageCount > 0 && (
                      <span className="rounded-full bg-zinc-800 px-1.5 py-0.5">
                        {s.messageCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile: floating button + drawer overlay ── */}
      <div className="md:hidden">
        {/* Floating button to open drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-20 left-4 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl transition-all hover:bg-zinc-800 active:scale-95"
          title="Chat history"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>

        {/* Drawer backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer panel */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Close button at top */}
            <div className="flex items-center justify-end border-b border-zinc-800 px-4 py-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {sessionList}
          </div>
        </div>
      </div>

      {/* ── Desktop: collapsible sidebar ── */}
      <div className="hidden md:block">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 border-r border-zinc-800 bg-zinc-950/50 px-2 py-4">
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
              title="Open history"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button
              onClick={newChat}
              disabled={isNewChatBusy}
              className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all disabled:opacity-30"
              title="New chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        ) : (
          <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/30">
            {sessionList}
          </aside>
        )}
      </div>
    </>
  );
}
