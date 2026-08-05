import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock,
  ExternalLink,
  Feather,
  Heart,
  Home,
  LifeBuoy,
  Menu,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  Pause,
  Play,
  Plus,
  Settings,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  FIRST_AID_KIT,
  LECTURES,
  type FirstAidExercise,
  type LectureArticle,
} from "../lib/classroomData";

const navItems = [
  { id: "today", label: "Today", icon: Home },
  { id: "conversations", label: "Conversations", icon: MessageCircle },
  { id: "journal", label: "Journal", icon: NotebookPen },
  { id: "classroom", label: "Classroom", icon: BookOpen },
  { id: "firstaid", label: "First Aid Kit", icon: LifeBuoy },
] as const;

type ViewId = (typeof navItems)[number]["id"];

const prompts = [
  "I feel a little overwhelmed today",
  "Help me understand what I’m feeling",
  "Can we do a grounding exercise?",
];

const moods = ["Heavy", "Low", "Okay", "Good", "Bright"];

interface SessionItem {
  id: string;
  createdAt: string;
  preview: string;
  messageCount: number;
}

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: "USER" | "BOT";
  content: string;
  createdAt: string;
}

type View = ViewId | "chat";

function initials(name: string | null | undefined) {
  const clean = (name ?? "A").trim();
  return clean.charAt(0).toUpperCase() || "A";
}

function greetingName(name: string | null | undefined) {
  const clean = (name ?? "").trim();
  if (!clean) return "friend";
  return clean.split(" ")[0];
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [view, setView] = useState<View>("today");
  const [activeNav, setActiveNav] = useState<ViewId>("today");

  // Backend state
  const [username, setUsername] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load profile + sessions on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, sessionsRes] = await Promise.all([
          fetch("/api/profile", { credentials: "include" }),
          fetch("/api/sessions", { credentials: "include" }),
        ]);
        if (profileRes.status === 401) {
          // No valid session — bounce to the login page
          navigate("/login", { replace: true });
          return;
        }
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (!cancelled) {
            // Users who haven't finished onboarding go back to the questionnaire
            if (profile.hasCompletedOnboarding === false) {
              navigate("/questionnaire", { replace: true });
              return;
            }
            setUsername(profile.username ?? null);
          }
        }
        if (sessionsRes.ok) {
          const list = (await sessionsRes.json()) as SessionItem[];
          if (!cancelled) {
            setSessions(list);
            // Start with the most recent session, or create a fresh one
            if (list.length > 0) setSessionId(list[0].id);
          }
        }
      } catch {
        // fall through — session creation will retry on first message
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages]);

  // Load messages when a session is selected
  useEffect(() => {
    if (!sessionId || view !== "chat") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/messages`, {
          credentials: "include",
        });
        if (res.ok) {
          const messages = (await res.json()) as ChatMessage[];
          if (!cancelled) setChatMessages(messages);
        }
      } catch {
        // ignore load errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, view]);

  // Ensure a session exists before sending a message
  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/sessions", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not start a conversation.");
    const created = (await res.json()) as { id: string };
    setSessionId(created.id);
    return created.id;
  }

  async function sendMessage(text?: string) {
    const trimmed = (text ?? message).trim();
    if (!trimmed || isSending) return;
    setMessage("");
    setIsSending(true);

    // Optimistically add the user message
    setChatMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        sender: "USER",
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    setView("chat");
    setActiveNav("conversations");

    try {
      const sid = await ensureSession();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: trimmed, sessionId: sid }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        // Intercepted (crisis / constrained) or error — show the message
        const data = await response.json();
        const reply =
          data?.payload?.message ?? data?.error ?? "I’m here with you.";
        setChatMessages((current) => [
          ...current,
          {
            id: `bot-${Date.now()}`,
            sender: "BOT",
            content: reply,
            createdAt: new Date().toISOString(),
          },
        ]);
        return;
      }
      if (!response.ok) throw new Error("Chat request failed");

      // Streaming plain-text response
      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let fullReply = "";
      const botId = `bot-${Date.now()}`;
      setChatMessages((current) => [
        ...current,
        {
          id: botId,
          sender: "BOT",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullReply += decoder.decode(value, { stream: true });
        setChatMessages((current) =>
          current.map((m) =>
            m.id === botId ? { ...m, content: fullReply } : m
          )
        );
      }
      if (!fullReply) {
        setChatMessages((current) =>
          current.map((m) =>
            m.id === botId
              ? { ...m, content: "I’m here with you. What’s on your mind?" }
              : m
          )
        );
      }
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          id: `bot-err-${Date.now()}`,
          sender: "BOT",
          content:
            "I’m having trouble connecting right now. Please try that again in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  // Mood check-in → saved to the journal
  async function checkIn(selected: string) {
    setMood(selected);
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "Daily check-in",
          content: `Checked in feeling ${selected.toLowerCase()} today.`,
          mood: selected.toLowerCase(),
        }),
      });
      refreshJournal();
    } catch {
      // mood stays selected locally even if save fails
    }
  }

  async function refreshJournal() {
    try {
      const res = await fetch("/api/journal", { credentials: "include" });
      if (res.ok) setJournal((await res.json()) as JournalEntry[]);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (view === "journal") refreshJournal();
  }, [view]);

  function openNav(id: ViewId) {
    setActiveNav(id);
    setShowMenu(false);
    if (id === "today") setView("today");
    else if (id === "conversations") setView("chat");
    else if (id === "journal") setView("journal");
    else if (id === "classroom") setView("classroom");
    else if (id === "firstaid") setView("firstaid");
  }

  const conversationCount = sessions.length;

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#24332f]">
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className={`fixed inset-y-0 left-0 z-30 flex w-[272px] flex-col border-r border-[#e5e6df] bg-[#fbfaf7] p-6 transition-transform lg:relative lg:translate-x-0 ${showMenu ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#273b35] text-[#d9f28b]"><Sparkles className="h-4 w-4" /></div>
              <span className="font-display text-xl font-semibold tracking-[-0.04em]">alex</span>
            </Link>
            <button onClick={() => setShowMenu(false)} className="rounded-lg p-2 text-[#88918b] hover:bg-[#eef0e9] lg:hidden"><X className="h-4 w-4" /></button>
          </div>

          <div className="mt-12 space-y-1">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa19c]">Your space</p>
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => openNav(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeNav === id ? "bg-[#eaf1e4] text-[#486342]" : "text-[#7b857e] hover:bg-[#f0f1ec] hover:text-[#3e5047]"}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={activeNav === id ? 2.2 : 1.8} />
                {label}
                {id === "conversations" && (
                  <span className="ml-auto rounded-full bg-[#e7e8e1] px-2 py-0.5 text-[10px] text-[#8b938c]">
                    {conversationCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-1">
            <button onClick={() => openNav("classroom")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7b857e] transition hover:bg-[#f0f1ec] hover:text-[#3e5047]"><CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.8} />How Alex works</button>
            <button onClick={() => (window.location.href = "/settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#7b857e] transition hover:bg-[#f0f1ec] hover:text-[#3e5047]"><Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />Settings</button>
            <div className="mt-5 flex items-center gap-3 border-t border-[#e6e7e0] px-3 pt-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9d2] text-sm font-bold text-[#66804a]">{initials(username)}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#3e5047]">{username ?? "Your space"}</p><p className="text-xs text-[#9aa19c]">Private account</p></div>
              <button onClick={() => (window.location.href = "/settings")} aria-label="Account options"><MoreHorizontal className="h-4 w-4 text-[#9aa19c]" /></button>
            </div>
          </div>
        </aside>

        {showMenu && <button aria-label="Close navigation" onClick={() => setShowMenu(false)} className="fixed inset-0 z-20 bg-[#273b35]/20 lg:hidden" />}

        <section className="flex min-w-0 flex-1 flex-col">
          {/* ── Header ── */}
          <header className="flex h-[76px] items-center justify-between border-b border-[#e5e6df] bg-[#f9f8f5]/80 px-5 backdrop-blur sm:px-8 lg:px-12">
            <button onClick={() => setShowMenu(true)} className="rounded-xl p-2 text-[#617067] hover:bg-white lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="hidden items-center gap-2 text-sm text-[#7d8780] sm:flex"><span className="h-2 w-2 rounded-full bg-[#9bbd52]" />Your space is private</div>
            <div className="flex items-center gap-3 sm:ml-auto">
              <span className="hidden text-right sm:block"><span className="block text-xs font-semibold text-[#6c7770]">{todayLabel()}</span><span className="block text-xs text-[#9aa19c]">A moment for yourself</span></span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9d2] text-sm font-bold text-[#66804a]">{initials(username)}</div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            {view === "today" && (
              <TodayView
                username={username}
                mood={mood}
                onMood={checkIn}
                message={message}
                setMessage={setMessage}
                onSend={() => sendMessage()}
                onPrompt={(p) => sendMessage(p)}
                sending={isSending}
              />
            )}

            {view === "chat" && (
              <ChatView
                messages={chatMessages}
                message={message}
                setMessage={setMessage}
                onSend={() => sendMessage()}
                onPrompt={(p) => sendMessage(p)}
                sending={isSending}
                sessions={sessions}
                activeSessionId={sessionId}
                onSelectSession={(id) => {
                  setSessionId(id);
                  setChatMessages([]);
                }}
                onNewChat={() => {
                  setSessionId(null);
                  setChatMessages([]);
                }}
              />
            )}

            {view === "journal" && (
              <JournalView
                entries={journal}
                onRefresh={refreshJournal}
                onCompose={(content) => sendMessage(content)}
              />
            )}

            {view === "classroom" && (
              <ClassroomView onDiscuss={(prompt) => sendMessage(prompt)} />
            )}

            {view === "firstaid" && (
              <FirstAidView onDiscuss={(prompt) => sendMessage(prompt)} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ── Today view (the user's original design, now live) ── */
function TodayView({
  username,
  mood,
  onMood,
  message,
  setMessage,
  onSend,
  onPrompt,
  sending,
}: {
  username: string | null;
  mood: string | null;
  onMood: (m: string) => void;
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
  onPrompt: (p: string) => void;
  sending: boolean;
}) {
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="mb-9 flex items-start justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-[#8b9c62]">{timeGreeting()}, {greetingName(username)}</p>
            <h1 className="font-display text-4xl font-medium tracking-[-0.05em] text-[#273b35] sm:text-5xl">How are you arriving today?</h1>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1e4] text-[#75974b] sm:flex"><Feather className="h-5 w-5" /></div>
        </div>

        <div className="rounded-[1.75rem] bg-[#dce9d2] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#69805d]">Daily check-in</p>
              <h2 className="mt-2 font-display text-2xl tracking-[-0.04em] text-[#304639]">A quick moment to notice.</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-[#76924f]"><Heart className="h-5 w-5" /></div>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#637662]">There&apos;s no need to fix anything. Just notice what feels most true right now.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {moods.map((item) => (
              <button
                key={item}
                onClick={() => onMood(item)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${mood === item ? "border-[#779843] bg-[#779843] text-white" : "border-white/70 bg-white/50 text-[#607460] hover:bg-white/80"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-[-0.04em] text-[#304639]">Start wherever you are</h2>
            <button onClick={() => onPrompt(prompts[0])} className="text-xs font-semibold text-[#82905f] hover:text-[#526b42]">See all</button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {prompts.map((prompt, index) => (
              <button
                key={prompt}
                onClick={() => onPrompt(prompt)}
                className="group min-h-[136px] rounded-2xl border border-[#e5e6df] bg-white/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#cbd8c1] hover:bg-white"
              >
                <span className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl ${index === 0 ? "bg-[#f1e7d9] text-[#b18454]" : index === 1 ? "bg-[#e5edda] text-[#779843]" : "bg-[#e2edf0] text-[#6b9298]"}`}>
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="block text-sm font-semibold leading-5 text-[#4b5c52]">{prompt}</span>
                <ChevronRight className="mt-3 h-4 w-4 text-[#a2aba3] transition group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-9 rounded-2xl border border-[#e5e6df] bg-white/70 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f2ec] text-[#78905a]"><MessageCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-[#3e5047]">Talk with Alex</p>
              <p className="text-xs text-[#8b958e]">A private conversation, whenever you need it.</p>
            </div>
          </div>
          <form
            className="mt-5 flex items-center gap-3 rounded-xl border border-[#e5e6df] bg-[#fbfaf7] p-2 pl-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What&apos;s on your mind?"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#3e5047] outline-none placeholder:text-[#a5ada7]"
            />
            <button
              type="submit"
              disabled={sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#273b35] text-[#d9f28b] transition hover:bg-[#344c42] disabled:opacity-50"
              aria-label="Send message"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-[1.5rem] bg-[#273b35] p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b8cd87]">Your rhythm</p>
            <Target className="h-4 w-4 text-[#b8cd87]" />
          </div>
          <p className="mt-5 font-display text-3xl tracking-[-0.05em]">2 days</p>
          <p className="mt-1 text-sm text-[#b8c4bb]">of showing up for yourself</p>
          <div className="mt-6 flex gap-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div key={`${day}-${index}`} className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${index < 2 ? "bg-[#d9f28b] text-[#415638]" : "bg-white/10 text-[#98a89e]"}`}>{day}</div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-[#e5e6df] bg-white/70 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl tracking-[-0.04em] text-[#304639]">A gentle idea</h3>
            <Sparkles className="h-4 w-4 text-[#9bbd52]" />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#76827a]">Try naming five things you can see, four you can touch, and three you can hear.</p>
          <button onClick={() => onPrompt("Can we do a grounding exercise?")} className="mt-5 flex items-center gap-2 text-xs font-bold text-[#779843]">Try grounding <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
        <div className="rounded-[1.5rem] border border-[#e5e6df] bg-[#f0f3ed] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b8a72]">Need more support?</p>
          <p className="mt-3 text-sm leading-6 text-[#6d7971]">Alex is not a therapist or emergency service. In crisis, call or text <strong className="text-[#485c4c]">988</strong> in the US.</p>
          <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#779843]">Find local help <ChevronRight className="h-3.5 w-3.5" /></a>
        </div>
      </aside>
    </div>
  );
}

/* ── Conversations view (streaming chat with Alex) ── */
function ChatView({
  messages,
  message,
  setMessage,
  onSend,
  onPrompt,
  sending,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
}: {
  messages: ChatMessage[];
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
  onPrompt: (p: string) => void;
  sending: boolean;
  sessions: SessionItem[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b9c62]">Conversations</p>
          <h1 className="mt-2 font-display text-3xl tracking-[-0.05em] text-[#273b35]">Talk with Alex</h1>
        </div>
        <button onClick={onNewChat} className="flex items-center gap-2 rounded-full bg-[#273b35] px-4 py-2 text-xs font-semibold text-[#d9f28b] transition hover:bg-[#344c42]">
          <Plus className="h-3.5 w-3.5" /> New chat
        </button>
      </div>

      {sessions.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${activeSessionId === s.id ? "border-[#779843] bg-[#e5edda] text-[#486342]" : "border-[#e5e6df] bg-white/70 text-[#7b857e] hover:bg-white"}`}
            >
              {s.preview.slice(0, 24) || "Conversation"}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-[52vh] space-y-4 overflow-y-auto rounded-[1.5rem] border border-[#e5e6df] bg-white/70 p-5 sm:p-7">
        {messages.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5edda] text-[#779843]"><Sparkles className="h-5 w-5" /></div>
            <p className="font-display text-xl tracking-[-0.04em] text-[#304639]">A private conversation</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#76827a]">Drop something here. I won&apos;t bite — but I won&apos;t lie either.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {prompts.map((p) => (
                <button key={p} onClick={() => onPrompt(p)} className="rounded-full border border-[#cbd8c1] bg-[#f0f3ed] px-3 py-2 text-xs text-[#607460] transition hover:bg-[#e5edda]">{p}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "USER" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.sender === "USER" ? "rounded-br-md bg-[#273b35] text-[#f4f7ef]" : "rounded-bl-md border border-[#e5e6df] bg-[#fbfaf7] text-[#3e5047]"}`}>
                {m.sender === "BOT" && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9c62]"><Sparkles className="h-3 w-3" />Alex</div>
                )}
                {m.content || (m.sender === "BOT" && <span className="inline-block animate-pulse">…</span>)}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#e5e6df] bg-[#fbfaf7] px-4 py-3 text-sm text-[#76827a]">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#779843]" /> Alex is thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="mt-5 flex items-center gap-3 rounded-xl border border-[#e5e6df] bg-white/80 p-2 pl-4">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What&apos;s on your mind?"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#3e5047] outline-none placeholder:text-[#a5ada7]"
        />
        <button type="submit" disabled={sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#273b35] text-[#d9f28b] transition hover:bg-[#344c42] disabled:opacity-50" aria-label="Send message">
          <Plus className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-4 text-center text-[11px] text-[#9aa19c]">Alex is a wellness companion, not a substitute for therapy. In crisis, call or text 988.</p>
    </div>
  );
}

/* ── Journal view ── */
function JournalView({
  entries,
  onRefresh,
  onCompose,
}: {
  entries: JournalEntry[];
  onRefresh: () => void;
  onCompose: (content: string) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b9c62]">Journal</p>
          <h1 className="mt-2 font-display text-3xl tracking-[-0.05em] text-[#273b35]">Your reflections</h1>
        </div>
        <button onClick={onRefresh} className="rounded-full border border-[#e5e6df] bg-white/70 px-4 py-2 text-xs font-semibold text-[#7b857e] transition hover:bg-white">Refresh</button>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-[1.5rem] border border-[#e5e6df] bg-white/70 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e7d9] text-[#b18454]"><NotebookPen className="h-5 w-5" /></div>
          <p className="font-display text-xl tracking-[-0.04em] text-[#304639]">Nothing written yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#76827a]">Your daily check-ins will collect here — a quiet record of how you&apos;ve been arriving.</p>
          <button onClick={() => onCompose("I'd like to write in my journal")} className="mt-6 rounded-full bg-[#273b35] px-5 py-2.5 text-xs font-semibold text-[#d9f28b] transition hover:bg-[#344c42]">Write with Alex</button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-[1.25rem] border border-[#e5e6df] bg-white/70 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b9c62]">{entry.title ?? "Entry"}</p>
                <span className="text-xs text-[#9aa19c]">
                  {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {entry.mood && <span className="ml-2 rounded-full bg-[#e5edda] px-2 py-0.5 text-[10px] text-[#607460]">{entry.mood}</span>}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#4b5c52]">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Classroom view (lectures) ── */
function ClassroomView({ onDiscuss }: { onDiscuss: (prompt: string) => void }) {
  const [article, setArticle] = useState<LectureArticle | null>(null);

  if (article) {
    return (
      <ArticleReader
        article={article}
        onBack={() => setArticle(null)}
        onDiscuss={onDiscuss}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b9c62]">Classroom</p>
        <h1 className="mt-2 font-display text-3xl tracking-[-0.05em] text-[#273b35] sm:text-4xl">Learn how your mind works</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#76827a]">Short, evidence-based guides on the experiences you told us about. Take them one section at a time.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {LECTURES.map((lecture, index) => (
          <button
            key={lecture.title}
            onClick={() => setArticle(lecture)}
            className="group rounded-[1.5rem] border border-[#e5e6df] bg-white/70 p-6 text-left transition hover:-translate-y-0.5 hover:border-[#cbd8c1] hover:bg-white"
          >
            <div className="flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 0 ? "bg-[#e2edf0] text-[#6b9298]" : index === 1 ? "bg-[#e5edda] text-[#779843]" : index === 2 ? "bg-[#f1e7d9] text-[#b18454]" : "bg-[#eadfe6] text-[#9b6b92]"}`}>
                <BookOpen className="h-4 w-4" />
              </span>
              <ChevronRight className="h-4 w-4 text-[#a2aba3] transition group-hover:translate-x-1" />
            </div>
            <h2 className="mt-4 font-display text-xl tracking-[-0.03em] text-[#304639]">{lecture.title}</h2>
            <p className="mt-1 text-xs text-[#9aa19c]">{lecture.sections.length} sections · Source: {lecture.source}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ArticleReader({
  article,
  onBack,
  onDiscuss,
}: {
  article: LectureArticle;
  onBack: () => void;
  onDiscuss: (prompt: string) => void;
}) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [saved, setSaved] = useState(false);
  const section = article.sections[sectionIndex];
  const isLast = sectionIndex === article.sections.length - 1;

  async function finish() {
    setComplete(true);
    if (saved) return;
    try {
      await fetch("/api/classroom/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ moduleId: article.title, inputs: {}, isCompleted: true }),
      });
      setSaved(true);
    } catch {
      // progress save is best-effort
    }
  }

  if (complete) {
    return (
      <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-[#e5e6df] bg-white/70 p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5edda] text-[#779843]"><CheckCircle2 className="h-6 w-6" /></div>
        <h2 className="font-display text-2xl tracking-[-0.04em] text-[#304639]">You finished the guide</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#76827a]">
          That&apos;s real work — understanding how your mind operates is the first step to working with it.
        </p>
        <button
          onClick={() => onDiscuss(`I just finished reading “${article.title}”. Can we talk about what stood out to me?`)}
          className="mt-6 rounded-full bg-[#273b35] px-6 py-2.5 text-xs font-semibold text-[#d9f28b] transition hover:bg-[#344c42]"
        >
          Discuss with Alex
        </button>
        <button onClick={onBack} className="mt-4 block w-full text-xs font-semibold text-[#82905f] hover:text-[#526b42]">
          Browse more guides
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-[#82905f] hover:text-[#526b42]">
        <ArrowLeft className="h-3.5 w-3.5" /> All guides
      </button>
      <div className="rounded-[1.5rem] border border-[#e5e6df] bg-white/70 p-6 sm:p-8">
        <div className="flex items-center justify-between text-xs text-[#9aa19c]">
          <span className="font-semibold text-[#6c7770]">{article.title}</span>
          <span>Section {sectionIndex + 1} of {article.sections.length}</span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e6df]">
          <div
            className="h-full rounded-full bg-[#9bbd52] transition-all duration-500"
            style={{ width: `${((sectionIndex + 1) / article.sections.length) * 100}%` }}
          />
        </div>
        <h2 className="mt-6 font-display text-2xl tracking-[-0.04em] text-[#304639]">{section.heading}</h2>
        <p className="mt-4 text-sm leading-7 text-[#4b5c52]">{section.body}</p>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-1 text-[11px] font-semibold text-[#82905f] hover:text-[#526b42]"
        >
          <ExternalLink className="h-3 w-3" /> Source: {article.source}
        </a>
        <div className="mt-8 flex items-center justify-between">
          <button
            disabled={sectionIndex === 0}
            onClick={() => setSectionIndex((c) => c - 1)}
            className="rounded-full border border-[#e5e6df] px-5 py-2 text-xs font-semibold text-[#7b857e] transition hover:bg-white disabled:opacity-30"
          >
            Back
          </button>
          {!isLast ? (
            <button
              onClick={() => setSectionIndex((c) => c + 1)}
              className="rounded-full bg-[#273b35] px-6 py-2 text-xs font-semibold text-[#d9f28b] transition hover:bg-[#344c42]"
            >
              Next section
            </button>
          ) : (
            <button
              onClick={finish}
              className="rounded-full bg-[#9bbd52] px-6 py-2 text-xs font-semibold text-[#273b35] transition hover:bg-[#8aad44]"
            >
              Finish guide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── First Aid Kit view ── */
function FirstAidView({ onDiscuss }: { onDiscuss: (prompt: string) => void }) {
  const [exercise, setExercise] = useState<FirstAidExercise | null>(null);

  if (exercise) {
    return (
      <FirstAidRunner
        exercise={exercise}
        onBack={() => setExercise(null)}
        onDiscuss={onDiscuss}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b9c62]">First Aid Kit</p>
        <h1 className="mt-2 font-display text-3xl tracking-[-0.05em] text-[#273b35] sm:text-4xl">For the moments that hit hardest</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#76827a]">Step-by-step exercises to get you through an acute episode — a panic attack, an ADHD freeze, an OCD spike. Follow along, one step at a time.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {FIRST_AID_KIT.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setExercise(item)}
            className={`group rounded-[1.5rem] border bg-gradient-to-br p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${item.color}`}
          >
            <div className="flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 0 ? "bg-white/70 text-[#3f88a8]" : index === 1 ? "bg-white/70 text-[#8a63b8]" : index === 2 ? "bg-white/70 text-[#c08a3e]" : index === 3 ? "bg-white/70 text-[#3e9e75]" : "bg-white/70 text-[#d1607a]"}`}>
                <LifeBuoy className="h-4 w-4" />
              </span>
              <ChevronRight className="h-4 w-4 text-[#a2aba3] transition group-hover:translate-x-1" />
            </div>
            <h2 className="mt-4 font-display text-xl tracking-[-0.03em] text-[#304639]">{item.title}</h2>
            <p className="mt-1 text-xs text-[#7b857e]">{item.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function FirstAidRunner({
  exercise,
  onBack,
  onDiscuss,
}: {
  exercise: FirstAidExercise;
  onBack: () => void;
  onDiscuss: (prompt: string) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [saved, setSaved] = useState(false);

  const step = exercise.steps[currentStep];
  const isLast = currentStep === exercise.steps.length - 1;

  // Count down once per second while running
  useEffect(() => {
    if (!isRunning || !step?.duration) return;
    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, currentStep]);

  // Stop the timer when it reaches zero
  useEffect(() => {
    if (isRunning && started && timer === 0) setIsRunning(false);
  }, [isRunning, started, timer]);

  function startStep() {
    setStarted(true);
    setTimer(step?.duration ?? 10);
    setIsRunning(true);
  }

  function nextStep() {
    setIsRunning(false);
    if (isLast) {
      setIsComplete(true);
      if (!saved) {
        fetch("/api/classroom/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ moduleId: exercise.id, inputs: {}, isCompleted: true }),
        })
          .then(() => setSaved(true))
          .catch(() => {});
      }
    } else {
      setStarted(false);
      setCurrentStep((c) => c + 1);
      setTimer(0);
    }
  }

  function prevStep() {
    setIsRunning(false);
    setStarted(false);
    setCurrentStep((c) => Math.max(0, c - 1));
    setTimer(0);
  }

  if (isComplete) {
    return (
      <div className={`mx-auto max-w-2xl rounded-[1.5rem] border bg-gradient-to-br p-10 text-center ${exercise.color}`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-[#5a6b52]"><CheckCircle2 className="h-6 w-6" /></div>
        <h2 className="font-display text-2xl tracking-[-0.04em] text-[#304639]">You did it</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#4b5c52]">You got through the worst of it. That took strength — you deserve to acknowledge it.</p>
        <button
          onClick={() => onDiscuss(`I just finished the “${exercise.title}” exercise. Can we talk about how I'm feeling now?`)}
          className="mt-6 rounded-full bg-[#273b35] px-6 py-2.5 text-xs font-semibold text-[#d9f28b] transition hover:bg-[#344c42]"
        >
          Discuss with Alex
        </button>
        <button onClick={onBack} className="mt-4 block w-full text-xs font-semibold text-[#82905f] hover:text-[#526b42]">
          Back to First Aid Kit
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-[#82905f] hover:text-[#526b42]">
        <ArrowLeft className="h-3.5 w-3.5" /> First Aid Kit
      </button>
      <div className={`rounded-[1.5rem] border bg-gradient-to-br p-6 sm:p-8 ${exercise.color}`}>
        <h2 className="font-display text-2xl tracking-[-0.04em] text-[#304639]">{exercise.title}</h2>
        <p className="mt-1 text-xs text-[#7b857e]">{exercise.subtitle}</p>

        <div className="mt-6 flex gap-1">
          {exercise.steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? "bg-[#273b35]/50" : "bg-[#273b35]/10"}`}
            />
          ))}
        </div>

        <div className="mt-8 min-h-[110px]">
          <p className="text-base leading-7 text-[#3e5047]">{step.instruction}</p>
        </div>

        {step.duration && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-3xl font-semibold text-[#304639]">
              <Clock className="h-5 w-5 text-[#82905f]" />
              {started && timer === 0 ? "Done" : `${timer > 0 ? timer : step.duration}s`}
            </div>
            {!isRunning && timer === 0 && (
              <button
                onClick={startStep}
                className="flex items-center gap-1.5 rounded-full border border-[#273b35]/20 bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#3e5047] transition hover:bg-white"
              >
                <Play className="h-3 w-3" /> Start timer
              </button>
            )}
            {isRunning && (
              <button
                onClick={() => setIsRunning(false)}
                className="flex items-center gap-1.5 rounded-full border border-[#273b35]/20 bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#3e5047] transition hover:bg-white"
              >
                <Pause className="h-3 w-3" /> Pause
              </button>
            )}
            {!isRunning && started && timer > 0 && (
              <button
                onClick={() => setIsRunning(true)}
                className="flex items-center gap-1.5 rounded-full border border-[#273b35]/20 bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#3e5047] transition hover:bg-white"
              >
                <Play className="h-3 w-3" /> Resume
              </button>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            disabled={currentStep === 0}
            onClick={prevStep}
            className="rounded-full border border-[#273b35]/15 bg-white/60 px-5 py-2 text-xs font-semibold text-[#7b857e] transition hover:bg-white disabled:opacity-30"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="rounded-full bg-[#273b35] px-6 py-2 text-xs font-semibold text-[#d9f28b] transition hover:bg-[#344c42]"
          >
            {isLast ? "Finish" : "Next step"}
          </button>
        </div>
      </div>
    </div>
  );
}
