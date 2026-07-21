import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Camera, Heart, HeartPulse, Info, Menu, MessageCircle, Mic, Paperclip, PenLine, Send, Settings, ShieldAlert, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChatResponse } from "@shared/api";

type Tab = "chat" | "first-aid" | "journal" | "lectures";

const tabs: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "first-aid", label: "First Aid Kit", icon: HeartPulse },
  { id: "journal", label: "Journal", icon: PenLine },
  { id: "lectures", label: "Lectures", icon: BookOpen },
];

const starters = ["I need to talk about something", "Help me make sense of today", "I’m feeling a little overwhelmed"];

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("chat");
  const [message, setMessage] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [assistantReplies, setAssistantReplies] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    setShowDisclaimer(localStorage.getItem("alex_disclaimer_accepted") !== "true");
  }, []);

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    setSentMessages((current) => [...current, trimmed]);
    setMessage("");
    setIsSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!response.ok) throw new Error("Chat request failed");
      const data = (await response.json()) as ChatResponse;
      setAssistantReplies((current) => [...current, data.reply]);
    } catch {
      setAssistantReplies((current) => [...current, "I’m having trouble connecting right now. Please try that again in a moment."]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#edf6f0] text-[#183b39] lg:h-screen lg:overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-[#d3e3d8] bg-[#edf6f0] px-4 sm:px-6">
        <div className="flex items-center gap-5"><Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.07em]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e6775b] text-sm text-[#183b39]">a</span>alex</Link><span className="hidden h-5 w-px bg-[#bfd3c6] sm:block" /><span className="hidden text-sm text-zinc-400 sm:block">Your gentle space</span></div>
        <div className="flex items-center gap-3"><span className="hidden rounded-full bg-[#dbe9df] px-3 py-1.5 text-xs text-[#416457] sm:block">Welcome back</span><button className="rounded-full p-2 text-[#658176] transition-colors hover:bg-[#dbe9df] hover:text-[#183b39]" aria-label="Settings"><Settings size={18} /></button><button onClick={() => setMobileNav((open) => !open)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 lg:hidden" aria-label="Open navigation">{mobileNav ? <X size={18} /> : <Menu size={18} />}</button></div>
      </header>
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
        <aside className={`${mobileNav ? "block" : "hidden"} absolute inset-x-0 top-16 z-20 border-b border-[#d3e3d8] bg-[#e5f1e8] p-3 lg:relative lg:inset-auto lg:block lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-[#d3e3d8] lg:bg-transparent lg:p-5`}>
          <div className="mb-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#789287]">Your space</div>
          <nav className="space-y-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${tab === id ? "bg-[#cfe5d6] text-[#183b39]" : "text-[#668176] hover:bg-[#dbe9df] hover:text-[#183b39]"}`}><Icon size={17} />{label}</button>)}</nav>
          <div className="mt-8 border-t border-[#d3e3d8] pt-5"><div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#789287]">Past chats</div><button className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">+</span> New chat</button><p className="px-3 pt-5 text-xs leading-relaxed text-[#789287]">Your conversations will appear here.</p></div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[#d3e3d8] px-5 py-4 sm:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">{tabs.find((item) => item.id === tab)?.label}</p></div>
          {tab === "chat" ? <ChatView message={message} setMessage={setMessage} sendMessage={sendMessage} sentMessages={sentMessages} assistantReplies={assistantReplies} isSending={isSending} /> : <ResourceView tab={tab} />}
        </section>
      </div>
      <AnimatePresence>{showDisclaimer && <Disclaimer onAccept={() => { localStorage.setItem("alex_disclaimer_accepted", "true"); setShowDisclaimer(false); }} acknowledged={acknowledged} setAcknowledged={setAcknowledged} />}</AnimatePresence>
    </main>
  );
}

function ChatView({ message, setMessage, sendMessage, sentMessages, assistantReplies, isSending }: { message: string; setMessage: (value: string) => void; sendMessage: () => void; sentMessages: string[]; assistantReplies: string[]; isSending: boolean }) {
  return <div className="flex min-h-0 flex-1 flex-col bg-[#f8faf9] text-zinc-900"><div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-8"><div className="flex items-center gap-3"><button className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden" aria-label="Back to navigation"><Menu size={18} /></button><div className="grid h-10 w-10 place-items-center rounded-full bg-[#dbe9db] text-[#183b39]"><Sparkles size={19} /></div><div><p className="text-sm font-semibold">Alex</p><p className="text-[11px] text-emerald-600">Here with you</p></div></div><button className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100" aria-label="Conversation information"><Info size={18} /></button></div><div className="flex flex-1 flex-col justify-end overflow-y-auto px-5 py-8 sm:px-8"><motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-2xl"><div className="mb-8"><p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">A private conversation</p><h1 className="mt-3 text-2xl font-medium tracking-[-0.03em] sm:text-3xl">Hey, it’s good to have you here.</h1><p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">Drop something here. I won’t bite — but I won’t lie either.</p></div><div className="space-y-3"><div className="flex items-end gap-2"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dbe9db] text-[#183b39]"><Sparkles size={13} /></div><p className="max-w-sm rounded-2xl rounded-bl-md bg-zinc-200 px-4 py-3 text-sm text-zinc-700">What’s on your mind today?</p></div><div className="flex flex-wrap justify-end gap-2 pt-2">{starters.map((starter) => <button key={starter} onClick={() => setMessage(starter)} className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-emerald-500 hover:text-emerald-700">{starter}</button>)}</div></div>{sentMessages.map((item, index) => <div key={`${item}-${index}`} className="mt-4 ml-auto flex max-w-md items-end justify-end gap-2"><div className="rounded-2xl rounded-br-md bg-[#1f8a70] px-4 py-3 text-sm text-white">{item}</div>{assistantReplies[index] && <div className="mr-auto flex items-end gap-2"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dbe9db] text-[#183b39]"><Sparkles size={13} /></div><p className="max-w-sm rounded-2xl rounded-bl-md bg-zinc-200 px-4 py-3 text-sm text-zinc-700">{assistantReplies[index]}</p></div>}</div>)}{isSending && <p className="mt-4 text-xs text-zinc-400">Alex is thinking...</p>}</motion.div></div><div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-3 sm:px-8 sm:pb-6"><div className="mx-auto max-w-2xl"><div className="mb-2 flex items-center gap-1 text-zinc-400"><button className="rounded-full p-2 hover:bg-zinc-100" aria-label="Open camera"><Camera size={17} /></button><button className="rounded-full p-2 hover:bg-zinc-100" aria-label="Send a heart"><Heart size={17} /></button><button className="rounded-full p-2 hover:bg-zinc-100" aria-label="Record a voice note"><Mic size={17} /></button></div><div className="flex items-end gap-2 rounded-full border border-zinc-300 bg-zinc-50 p-1.5 transition-colors focus-within:border-emerald-500"><button className="mb-1 rounded-full p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800" aria-label="Attach a file"><Paperclip size={18} /></button><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} placeholder="Talk to me..." className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400" /><button onClick={sendMessage} disabled={!message.trim() || isSending} className="mb-1 rounded-full bg-[#1f8a70] p-2.5 text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Send message"><Send size={16} /></button></div><p className="mt-3 text-center text-[10px] text-zinc-400">Alex is a wellness companion, not a substitute for therapy. If you’re in crisis, contact emergency services.</p></div></div></div>;
}

function ResourceView({ tab }: { tab: Exclude<Tab, "chat"> }) { const content = { "first-aid": ["First Aid Kit", "Short interactive exercises for difficult moments.", ["Calm a panic attack", "Navigate an existential crisis", "Get through a heavy day"]], journal: ["Journal", "A private place to put down what’s on your mind.", ["Start a new entry", "Your recent reflections", "Prompts for today"]], lectures: ["Lecture Articles", "Evidence-based ideas from trusted sources.", ["Understanding your nervous system", "The science of feeling safe", "Making space for difficult feelings"]] }[tab] as [string, string, string[]]; return <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8"><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold tracking-[-0.04em]">{content[0]}</h1><p className="mt-3 text-sm text-zinc-400">{content[1]}</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{content[2].map((item, index) => <button key={item} className="group rounded-2xl border border-[#c8dccf] bg-[#f4faf5] p-5 text-left transition-all hover:-translate-y-1 hover:border-emerald-400/50"><span className="text-xs text-emerald-400">0{index + 1}</span><p className="mt-12 text-sm font-medium text-[#315b4b] group-hover:text-emerald-700">{item}</p><span className="mt-3 block text-xs text-[#7a9587]">Explore →</span></button>)}</div></div></div>; }

function Disclaimer({ onAccept, acknowledged, setAcknowledged }: { onAccept: () => void; acknowledged: boolean; setAcknowledged: (value: boolean) => void }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 py-8 backdrop-blur-sm"><motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-700 bg-[#111313] p-6 shadow-2xl sm:p-8"><div className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-amber-400/10 text-amber-300"><ShieldAlert size={21} /></div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Before we begin</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Important medical disclaimer</h2><p className="mt-5 text-sm leading-relaxed text-zinc-300">Alex is an AI-powered psychoeducational tool, not a replacement for professional mental health care. Alex cannot diagnose, treat, or provide medical advice.</p><p className="mt-4 text-sm leading-relaxed text-zinc-400">If you are in immediate danger or thinking about harming yourself, please contact 988 in the US or your local emergency services now.</p><label className="mt-7 flex gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 text-sm leading-relaxed text-zinc-300"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-emerald-400" />I understand that Alex is an AI wellness companion, not a medical provider, and I agree to the above terms.</label><button onClick={onAccept} disabled={!acknowledged} className="mt-6 w-full rounded-full bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35">I acknowledge & continue</button></motion.div></motion.div>; }
