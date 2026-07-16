"use client";
import { useEffect, useRef, useState } from "react";
import InterventionRouter from "../interventions/InterventionRouter";
import { reportMessage } from "@/lib/chat";

type Attachment = {
  id: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
};

type Msg = {
  id: string;
  sender: "USER" | "BOT";
  content: string;
  customType?: string;
  payload?: any;
  attachments?: Attachment[];
};

export default function ChatWindow({
  sessionId,
  profile,
  initContext
}: {
  sessionId: string;
  profile: any;
  initContext?: { initContext?: string; module?: string };
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);

  // Load existing messages when sessionId changes
  useEffect(() => {
    async function loadMessages() {
      setMessages([]);
      setLoaded(false);
      try {
        const res = await fetch(`/api/sessions/${sessionId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {
        // silently fail
      }
      setLoaded(true);
    }
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    if (initContext?.initContext === "closure" && initContext.module) {
      setInput(`I just finished the ${initContext.module} module. Can you help me process what stuck with me?`);
    }
  }, [initContext]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── File picker ──────────────────────────────────────────────────────

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const valid = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        alert(`"${f.name}" is too large. Max 10MB.`);
        return false;
      }
      return true;
    });

    const withPreviews = valid.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));

    setPendingFiles((prev) => [...prev, ...withPreviews]);
    // Reset so the same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => {
      const p = prev[index];
      if (p?.preview) URL.revokeObjectURL(p.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  // ── Upload one file and return its URL ───────────────────────────────

  async function uploadFile(file: File): Promise<{ url: string; filename: string; mimeType: string; size: number }> {
    const form = new FormData();
    form.append("sessionId", sessionId);
    form.append("file", file);

    const res = await fetch("/api/chat/upload", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data;
  }

  // ── Send ─────────────────────────────────────────────────────────────

  async function send() {
    if ((!input.trim() && pendingFiles.length === 0) || busy) return;

    const text = input;
    setInput("");
    setBusy(true);

    let uploaded: { url: string; filename: string; mimeType: string; size: number }[] = [];

    // Upload any pending files first
    if (pendingFiles.length > 0) {
      try {
        for (const pf of pendingFiles) {
          const result = await uploadFile(pf.file);
          uploaded.push(result);
        }
      } catch (e: any) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            sender: "USER",
            content: text || "(file upload failed)",
          },
        ]);
        setBusy(false);
        setPendingFiles([]);
        return;
      }
      setPendingFiles([]);
    }

    // Build content with file mention
    const fileSummary =
      uploaded.length > 0
        ? text
          ? text
          : `[Attached: ${uploaded.map((u) => u.filename).join(", ")}]`
        : text;

    // Add user message to chat with attachment metadata
    const atts = uploaded.map((u) => ({
      id: crypto.randomUUID(),
      filename: u.filename,
      filepath: u.url,
      mimeType: u.mimeType,
      size: u.size,
    }));

    const userMsg: Msg = {
      id: crypto.randomUUID(),
      sender: "USER",
      content: fileSummary,
      attachments: atts,
    };
    setMessages((m) => [...m, userMsg]);

    // 1. Pre-screen (just the text for crisis detection)
    const pre = await fetch("/api/chat/intercept", {
      method: "POST",
      body: JSON.stringify({ content: text || "(shared an attachment)" }),
    }).then((r) => r.json());

    if (pre.status === "intercepted") {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          sender: "BOT",
          content: pre.payload?.message ?? "Take a look at this.",
          customType: pre.type,
          payload: pre,
        },
      ]);
      setBusy(false);
      return;
    }

    // 2. Stream — send attachments to be persisted
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        content: text || "(shared an attachment)",
        sessionId,
        attachments: uploaded.map((u) => ({
          filename: u.filename,
          filepath: u.url,
          mimeType: u.mimeType,
          size: u.size,
        })),
      }),
    });
    if (!res.body) {
      setBusy(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    const id = crypto.randomUUID();
    setMessages((m) => [...m, { id, sender: "BOT", content: "" }]);
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, content: acc } : x)));
    }
    setBusy(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {!loaded ? (
          <div className="mt-24 text-center text-zinc-600 text-sm animate-pulse">Loading...</div>
        ) : messages.length === 0 ? (
          <EmptyState profile={profile} />
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} />)
        )}
      </div>

      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-zinc-800 px-3 py-2">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative shrink-0">
              {pf.preview ? (
                <img
                  src={pf.preview}
                  alt={pf.file.name}
                  className="h-16 w-16 rounded-lg object-cover border border-zinc-700"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-[10px] text-zinc-400">
                  <span className="truncate px-1">{pf.file.name}</span>
                </div>
              )}
              <button
                onClick={() => removePendingFile(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white hover:bg-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-zinc-900 p-3">
        <div className="flex gap-2 items-end">
          <div className="relative flex-1 flex items-end gap-2">
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Talk to me..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
              title="Attach a photo or file"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt"
              multiple
              className="hidden"
              onChange={handleFilePick}
            />
          </div>
          <button
            onClick={send}
            disabled={busy || (!input.trim() && pendingFiles.length === 0)}
            className="rounded-xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {busy ? (
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>Sending</span>
              </div>
            ) : (
              "Send"
            )}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">
          Not a substitute for therapy. If you&apos;re in crisis, dial 988.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ profile }: { profile: any }) {
  return (
    <div className="mt-24 text-center text-zinc-500">
      <p className="text-sm">
        Hey{profile?.primaryFocus ? `, looks like ${profile.primaryFocus} is the headline right now` : ""}.
      </p>
      <p className="mt-1 text-xs">Drop it here. I won&apos;t bite — but I won&apos;t lie either.</p>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.sender === "USER";

  if (!isUser && (msg.customType === "CRISIS_ALERT" || msg.customType === "HUMAN_ESCALATION")) {
    return <CrisisCard payload={msg.payload} type={msg.customType} />;
  }
  if (!isUser && msg.customType === "CRISIS_RESOURCES") {
    return <CrisisResourcesCard payload={msg.payload} />;
  }
  if (!isUser && msg.customType === "CONSTRAINED") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl border border-amber-900/30 bg-amber-950/20 p-4 text-sm text-amber-100">
          <p className="font-semibold text-amber-200">Let&apos;s check in for a moment.</p>
          <p className="mt-1 text-amber-100/80">{msg.payload?.message}</p>
        </div>
      </div>
    );
  }
  if (!isUser && msg.customType === "INTERVENTION_CARD") {
    return (
      <div className="flex justify-start">
        <InterventionRouter
          subType={msg.payload?.subType ?? ""}
          rawText={msg.payload?.rawText}
        />
      </div>
    );
  }

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-zinc-100 text-zinc-950"
              : "border border-zinc-800 bg-zinc-900/60 text-zinc-100"
          }`}
        >
          {/* Attachments */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className={`mb-2 space-y-1.5 ${isUser ? "" : ""}`}>
              {msg.attachments.map((att) =>
                att.mimeType.startsWith("image/") ? (
                  <a
                    key={att.id}
                    href={att.filepath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/image block overflow-hidden rounded-xl border border-zinc-700/50 transition-shadow hover:shadow-lg"
                  >
                    <img
                      src={att.filepath}
                      alt={att.filename}
                      className="max-h-64 w-full object-contain bg-zinc-900"
                    />
                    <div className="border-t border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-500 group-hover/image:text-zinc-400">
                      {att.filename} · {(att.size / 1024).toFixed(0)}KB
                    </div>
                  </a>
                ) : (
                  <a
                    key={att.id}
                    href={att.filepath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      isUser
                        ? "border-zinc-300/40 bg-zinc-200/50 text-zinc-700 hover:bg-zinc-200"
                        : "border-zinc-700/50 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-lg">📎</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium">{att.filename}</p>
                      <p className="text-[10px] opacity-60">
                        {(att.size / 1024).toFixed(0)}KB
                      </p>
                    </div>
                    <svg className="h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                )
              )}
            </div>
          )}

          {/* Text content */}
          {msg.content && (
            <div className="whitespace-pre-wrap">{msg.content}</div>
          )}
        </div>
        {!isUser && (
          <button
            onClick={() => reportMessage(msg.id)}
            className="absolute -right-1 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-[10px] text-zinc-600 opacity-0 transition-opacity hover:border-red-800 hover:text-red-400 group-hover:opacity-100"
            title="Report this message"
          >
            ⚑
          </button>
        )}
      </div>
    </div>
  );
}

function CrisisCard({ payload, type }: { payload: any; type: string }) {
  const isEscalation = type === "HUMAN_ESCALATION";
  return (
    <div className={`rounded-2xl border p-5 text-sm ${
      isEscalation
        ? "border-red-900/70 bg-red-950/60 text-red-100"
        : "border-red-900/50 bg-red-950/40 text-red-100"
    }`}>
      <div className="font-semibold">
        {isEscalation ? "Your safety matters. Please reach a real human right now." : "You matter. Let's get you to a human right now."}
      </div>
      <p className="mt-2 text-red-200">{payload?.message}</p>
      <ul className="mt-3 space-y-1 text-xs">
        {payload?.hotlines?.us?.suicide && <li>US Crisis: {payload.hotlines.us.suicide}</li>}
        {payload?.hotlines?.us?.crisis && <li>US Text: {payload.hotlines.us.crisis}</li>}
        {payload?.hotlines?.us?.substance && <li>US Substance: {payload.hotlines.us.substance}</li>}
        {payload?.hotlines?.uk?.samaritans && <li>UK: {payload.hotlines.uk.samaritans}</li>}
        {payload?.hotlines?.uk?.text && <li>UK Text: {payload.hotlines.uk.text}</li>}
        {payload?.hotlines?.intl && <li>{payload.hotlines.intl}</li>}
        {payload?.hotlines?.emergency && <li className="pt-1 font-medium">{payload.hotlines.emergency}</li>}
      </ul>
      {payload?.checkinPrompt && (
        <p className="mt-3 text-xs text-red-300 italic">{payload.checkinPrompt}</p>
      )}
    </div>
  );
}

function CrisisResourcesCard({ payload }: { payload: any }) {
  return (
    <div className="rounded-2xl border border-amber-900/40 bg-amber-950/30 p-5 text-sm text-amber-100">
      <div className="font-semibold text-amber-200">I want you to have these resources.</div>
      <p className="mt-2 text-amber-200/80">{payload?.message}</p>
      <ul className="mt-3 space-y-1 text-xs">
        {payload?.hotlines?.us?.suicide && <li>US: {payload.hotlines.us.suicide}</li>}
        {payload?.hotlines?.us?.crisis && <li>US: {payload.hotlines.us.crisis}</li>}
        {payload?.hotlines?.us?.substance && <li>US: {payload.hotlines.us.substance}</li>}
        {payload?.hotlines?.uk?.samaritans && <li>UK: {payload.hotlines.uk.samaritans}</li>}
        {payload?.hotlines?.uk?.text && <li>UK: {payload.hotlines.uk.text}</li>}
        {payload?.hotlines?.intl && <li>{payload.hotlines.intl}</li>}
        {payload?.hotlines?.emergency && <li className="pt-1 font-medium">{payload.hotlines.emergency}</li>}
      </ul>
      {payload?.checkinPrompt && (
        <p className="mt-3 text-xs text-amber-300 italic">{payload.checkinPrompt}</p>
      )}
    </div>
  );
}
