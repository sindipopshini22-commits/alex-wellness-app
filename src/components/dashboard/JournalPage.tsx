"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────
interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
  updatedAt: string;
}

const MOODS = [
  { emoji: "😌", label: "Calm" },
  { emoji: "😊", label: "Good" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😟", label: "Anxious" },
  { emoji: "😰", label: "Overwhelmed" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🥱", label: "Tired" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function getMoodEmoji(mood: string | null): string {
  if (!mood) return "";
  const found = MOODS.find((m) => m.label.toLowerCase() === mood.toLowerCase());
  return found?.emoji ?? mood;
}

// ─── Component ─────────────────────────────────────────────────────────
export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  // ── Load entries ──────────────────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/journal");
      if (res.ok) {
        const data: JournalEntry[] = await res.json();
        setEntries(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ── Select entry ──────────────────────────────────────────────────────
  const selectEntry = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        setSelectedId(entry.id);
        setTitle(entry.title ?? "");
        setContent(entry.content);
        setMood(entry.mood ?? "");
        setShowMobileList(false);
      }
    },
    [entries]
  );

  const newEntry = useCallback(async () => {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "", title: "" }),
    });
    if (res.ok) {
      const entry: JournalEntry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setTitle("");
      setContent("");
      setMood("");
      setShowMobileList(false);
    }
  }, []);

  // ── Save entry ────────────────────────────────────────────────────────
  const saveEntry = useCallback(async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/journal/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, mood }),
      });
      if (res.ok) {
        const updated: JournalEntry = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === selectedId ? updated : e)));
      }
    } finally {
      setSaving(false);
    }
  }, [selectedId, title, content, mood]);

  // ── Delete entry ──────────────────────────────────────────────────────
  const deleteEntry = useCallback(async () => {
    if (!selectedId) return;
    if (!confirm("Delete this entry?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/journal/${selectedId}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== selectedId));
        setSelectedId(null);
        setTitle("");
        setContent("");
        setMood("");
        setShowMobileList(true);
      }
    } finally {
      setDeleting(false);
    }
  }, [selectedId]);

  // ── Auto-save on blur ─────────────────────────────────────────────────
  const handleBlur = useCallback(() => {
    if (selectedId && content.trim()) {
      saveEntry();
    }
  }, [selectedId, content, saveEntry]);

  // ── Keyboard shortcut: Ctrl+S / Cmd+S ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveEntry();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveEntry]);

  // ── Selected entry full data ──────────────────────────────────────────
  const selectedEntry = entries.find((e) => e.id === selectedId);

  // ── Group entries by date section ─────────────────────────────────────
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterdayStr = new Date(today.getTime() - 86400000).toDateString();

  const grouped = entries.reduce<{ label: string; entries: JournalEntry[] }[]>((acc, entry) => {
    const date = new Date(entry.createdAt);
    const dateStr = date.toDateString();
    let label: string;
    if (dateStr === todayStr) label = "Today";
    else if (dateStr === yesterdayStr) label = "Yesterday";
    else if (date.getTime() > today.getTime() - 7 * 86400000) label = "This Week";
    else label = "Earlier";

    const existing = acc.find((g) => g.label === label);
    if (existing) existing.entries.push(entry);
    else acc.push({ label, entries: [entry] });
    return acc;
  }, []);

  return (
    <div className="flex h-full">
      {/* ── Entry List (sidebar on desktop, overlay on mobile) ── */}
      <div
        className={`${
          showMobileList ? "flex" : "hidden"
        } w-full flex-col border-r border-zinc-800 md:flex md:w-72 lg:w-80 ${
          selectedId && !showMobileList ? "md:flex" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📔</span>
            <h2 className="text-sm font-semibold text-zinc-100">Journal</h2>
          </div>
          <button
            onClick={newEntry}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-zinc-100"
          >
            + New
          </button>
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="mb-2 text-2xl">📝</span>
              <p className="text-sm text-zinc-500">No entries yet.</p>
              <p className="text-xs text-zinc-600">Tap &ldquo;+ New&rdquo; to write your first entry.</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <div className="px-4 pt-4 pb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  {group.label}
                </div>
                {group.entries.map((entry) => {
                  const isActive = entry.id === selectedId;
                  const preview =
                    entry.content.length > 60
                      ? entry.content.slice(0, 60) + "…"
                      : entry.content || "(empty)";
                  return (
                    <button
                      key={entry.id}
                      onClick={() => selectEntry(entry.id)}
                      className={`w-full px-4 py-2.5 text-left transition-all ${
                        isActive
                          ? "bg-zinc-800/60 border-l-2 border-emerald-500"
                          : "hover:bg-zinc-800/30 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[70%]">
                          {entry.title || "Untitled"}
                        </span>
                        {entry.mood && (
                          <span className="text-sm">{getMoodEmoji(entry.mood)}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[11px] text-zinc-500">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-600 truncate">{preview}</p>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Editor Panel ── */}
      <div
        className={`${
          !showMobileList || entries.length === 0 ? "flex" : "hidden md:flex"
        } flex-1 flex-col`}
      >
        {selectedId && selectedEntry ? (
          <>
            {/* Editor header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-2">
                {/* Mobile back button */}
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  ← Back
                </button>
                <span className="text-xs text-zinc-500">
                  {formatDate(selectedEntry.createdAt)}
                </span>
                {selectedEntry.updatedAt !== selectedEntry.createdAt && (
                  <span className="text-[10px] text-zinc-600">· edited</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEntry}
                  disabled={saving}
                  className="rounded-lg bg-emerald-700/60 px-4 py-1.5 text-xs font-medium text-emerald-100 transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={deleteEntry}
                  disabled={deleting}
                  className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-all hover:text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                >
                  {deleting ? "…" : "🗑️"}
                </button>
              </div>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                placeholder="Entry title…"
                className="mb-4 w-full bg-transparent text-xl font-semibold text-zinc-100 placeholder-zinc-700 outline-none"
              />

              {/* Mood selector */}
              <div className="mb-5 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] text-zinc-600">Mood:</span>
                {MOODS.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => {
                      setMood(mood === m.label ? "" : m.label);
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                      mood === m.label
                        ? "bg-zinc-700 text-zinc-100 ring-1 ring-zinc-500"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                    }`}
                    title={m.label}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                placeholder="How are you feeling? Write freely…"
                className="min-h-[200px] w-full flex-1 resize-none bg-transparent text-sm leading-relaxed text-zinc-300 placeholder-zinc-700 outline-none"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800 px-4 py-2">
              <p className="text-[10px] text-zinc-700">
                {content.length} characters · {content.split(/\s+/).filter(Boolean).length} words
                <span className="ml-2">· Ctrl+S to save</span>
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center px-6 text-center">
              <span className="mb-3 text-3xl">📖</span>
              <p className="text-sm text-zinc-500">
                {entries.length === 0
                  ? "Start your first journal entry"
                  : "Select an entry or create a new one"}
              </p>
              {entries.length === 0 && (
                <button
                  onClick={newEntry}
                  className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-700"
                >
                  + Write your first entry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
