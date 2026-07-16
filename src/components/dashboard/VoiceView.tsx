"use client";
import { useEffect, useRef, useState } from "react";
import InterventionRouter from "../interventions/InterventionRouter";
import { reportMessage } from "@/lib/chat";

type Msg = {
  id: string;
  sender: "USER" | "BOT";
  content: string;
  customType?: string;
  payload?: any;
};

type Mode = "idle" | "listening" | "thinking" | "speaking";

export default function VoiceView({ sessionId, profile }: { sessionId: string; profile: any }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [mode, setMode] = useState<Mode>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sttProvider, setSttProvider] = useState<"server" | "browser" | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect STT capability on mount
  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setSttProvider("browser");
    } else {
      setSttProvider("server"); // will 501 on /api/voice/stt if not configured
    }
  }, []);

  // Browser speech synthesis for fallback TTS
  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setMode("thinking");
    setMessages(m => [...m, { id: crypto.randomUUID(), sender: "USER", content: text }]);

    // Pre-screen
    const pre = await fetch("/api/chat/intercept", {
      method: "POST",
      body: JSON.stringify({ content: text })
    }).then(r => r.json());

    if (pre.status === "intercepted") {
      const interceptedMsg: Msg = {
        id: crypto.randomUUID(),
        sender: "BOT",
        content: pre.payload?.message ?? "Take a look at this.",
        customType: pre.type,
        payload: pre
      };
      setMessages(m => [...m, interceptedMsg]);
      // Speak the crisis message aloud
      speak(interceptedMsg.content);
      setMode("speaking");
      setTimeout(() => setMode("idle"), 4000);
      return;
    }

    // Stream the LLM reply (text only — we'll speak it after)
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ content: text, sessionId })
    });
    if (!res.body) {
      setMode("idle");
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    const id = crypto.randomUUID();
    setMessages(m => [...m, { id, sender: "BOT", content: "" }]);
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages(m => m.map(x => (x.id === id ? { ...x, content: acc } : x)));
    }
    // Speak the final response
    setMode("speaking");
    speak(acc);
    setTimeout(() => setMode("idle"), 5000);
  }

  function startListening() {
    setError(null);
    setTranscript("");

    if (sttProvider === "browser") {
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        setError("Browser does not support SpeechRecognition. Use Chrome/Edge.");
        return;
      }
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e: any) => {
        let t = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          t += e.results[i][0].transcript;
        }
        setTranscript(t);
        if (e.results[e.results.length - 1].isFinal) {
          rec.stop();
          send(t);
        }
      };
      rec.onerror = (e: any) => {
        setError(e.error);
        setMode("idle");
      };
      rec.onend = () => {
        if (mode === "listening") setMode("idle");
      };
      recognitionRef.current = rec;
      rec.start();
      setMode("listening");
    } else {
      // Server STT path — not wired in this smoke test (no Deepgram key)
      setError("Server STT not configured. Set DEEPGRAM_API_KEY in .env to enable.");
      setMode("idle");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setMode("idle");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {messages.length === 0 && (
          <div className="mt-24 text-center text-zinc-500">
            <p className="text-sm">Tap the orb and start talking.</p>
            <p className="mt-1 text-xs">
              STT: <span className="text-zinc-400">{sttProvider ?? "checking..."}</span>
              {" · "}TTS: <span className="text-zinc-400">browser fallback</span>
            </p>
          </div>
        )}
        {messages.map(m => (
          <VoiceBubble key={m.id} msg={m} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-zinc-900 p-6">
        {transcript && mode === "listening" && (
          <p className="text-xs text-zinc-400 italic">&ldquo;{transcript}&rdquo;</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={mode === "listening" ? stopListening : startListening}
          className={`flex h-32 w-32 items-center justify-center rounded-full border-2 transition-all ${
            mode === "listening"
              ? "border-red-500 bg-red-500/10 animate-pulse"
              : mode === "thinking"
              ? "border-amber-500 bg-amber-500/10"
              : mode === "speaking"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-700 bg-zinc-900"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            {mode === "listening" ? "Listening" : mode === "thinking" ? "Thinking" : mode === "speaking" ? "Speaking" : "Tap to talk"}
          </span>
        </button>

        <p className="text-[10px] text-zinc-600">
          Audio is processed in real time and never stored.
        </p>
      </div>
    </div>
  );
}

function VoiceBubble({ msg }: { msg: Msg }) {
  const isUser = msg.sender === "USER";

  if (!isUser && (msg.customType === "CRISIS_ALERT" || msg.customType === "HUMAN_ESCALATION")) {
    const isEscalation = msg.customType === "HUMAN_ESCALATION";
    return (
      <div className="flex justify-start">
        <div className={`max-w-[80%] rounded-2xl border p-5 text-sm ${
          isEscalation
            ? "border-red-900/70 bg-red-950/60 text-red-100"
            : "border-red-900/50 bg-red-950/40 text-red-100"
        }`}>
          <div className="font-semibold">
            {isEscalation ? "Your safety matters. Please reach a real human right now." : "You matter. Let's get you to a human right now."}
          </div>
          <p className="mt-2 text-red-200">{msg.payload?.message}</p>
          <ul className="mt-3 space-y-1 text-xs">
            {msg.payload?.hotlines?.us?.suicide && <li>US Crisis: {msg.payload.hotlines.us.suicide}</li>}
            {msg.payload?.hotlines?.us?.crisis && <li>US Text: {msg.payload.hotlines.us.crisis}</li>}
            {msg.payload?.hotlines?.uk?.samaritans && <li>UK: {msg.payload.hotlines.uk.samaritans}</li>}
            {msg.payload?.hotlines?.intl && <li>{msg.payload.hotlines.intl}</li>}
            {msg.payload?.hotlines?.emergency && <li className="pt-1 font-medium">{msg.payload.hotlines.emergency}</li>}
          </ul>
          {msg.payload?.checkinPrompt && (
            <p className="mt-3 text-xs text-red-300 italic">{msg.payload.checkinPrompt}</p>
          )}
        </div>
      </div>
    );
  }

  if (!isUser && msg.customType === "CRISIS_RESOURCES") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl border border-amber-900/40 bg-amber-950/30 p-5 text-sm text-amber-100">
          <div className="font-semibold text-amber-200">I want you to have these resources.</div>
          <p className="mt-2 text-amber-200/80">{msg.payload?.message}</p>
          <ul className="mt-3 space-y-1 text-xs">
            {msg.payload?.hotlines?.us?.suicide && <li>US: {msg.payload.hotlines.us.suicide}</li>}
            {msg.payload?.hotlines?.us?.crisis && <li>US: {msg.payload.hotlines.us.crisis}</li>}
            {msg.payload?.hotlines?.uk?.samaritans && <li>UK: {msg.payload.hotlines.uk.samaritans}</li>}
            {msg.payload?.hotlines?.intl && <li>{msg.payload.hotlines.intl}</li>}
            {msg.payload?.hotlines?.emergency && <li className="pt-1 font-medium">{msg.payload.hotlines.emergency}</li>}
          </ul>
          {msg.payload?.checkinPrompt && (
            <p className="mt-3 text-xs text-amber-300 italic">{msg.payload.checkinPrompt}</p>
          )}
        </div>
      </div>
    );
  }

  if (!isUser && msg.customType === "CONSTRAINED") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl border border-amber-900/30 bg-amber-950/20 p-4 text-sm text-amber-100">
          <p className="font-semibold text-amber-200">Let's check in for a moment.</p>
          <p className="mt-1 text-amber-100/80">{msg.payload?.message}</p>
        </div>
      </div>
    );
  }

  if (!isUser && msg.customType === "INTERVENTION_CARD") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%]">
          <InterventionRouter subType={msg.payload?.subType ?? ""} rawText={msg.payload?.rawText} />
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[80%]">
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-zinc-100 text-zinc-950"
              : "border border-zinc-800 bg-zinc-900/60 text-zinc-100"
          }`}
        >
          {msg.content}
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

