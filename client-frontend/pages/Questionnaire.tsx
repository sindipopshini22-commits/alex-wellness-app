import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type Option = { label: string; description: string; icon: string };

type Answers = {
  name: string;
  age: string;
  experience: string;
  hardestPart: string;
  support: string;
};

const experienceOptions: Option[] = [
  { label: "Stress and overwhelm", description: "Like I'm carrying too much", icon: "🌊" },
  { label: "Sadness", description: "Things feel grey and heavy", icon: "🌧️" },
  { label: "Worry", description: "My mind won't stop spinning", icon: "🌀" },
  { label: "Numbness", description: "I feel disconnected from everything", icon: "❄️" },
  { label: "Irritability", description: "Everything gets under my skin", icon: "🔥" },
  { label: "Something else", description: "I'm not sure how to name it yet", icon: "💭" },
];

const hardestOptions: Option[] = [
  { label: "Getting through the day", description: "Everyday tasks feel like mountains", icon: "🏔️" },
  { label: "Connecting with people", description: "I feel isolated or misunderstood", icon: "🫂" },
  { label: "Rest and sleep", description: "I can't switch off or rest properly", icon: "🌙" },
  { label: "Focus and motivation", description: "I can't concentrate or get things done", icon: "🎯" },
  { label: "Understanding my feelings", description: "I don't know what I'm feeling or why", icon: "🔍" },
  { label: "It's just... heavy", description: "No single thing — it all feels like a lot", icon: "💫" },
];

const supportOptions: Option[] = [
  { label: "I have people I can really talk to", description: "Friends, family, or community who get it", icon: "🤝" },
  { label: "I have some support, but it's complicated", description: "People care, but I don't always feel understood", icon: "🧩" },
  { label: "I mostly deal with things alone", description: "I don't really have someone to turn to", icon: "💔" },
  { label: "I'm working with a therapist or counselor", description: "I have professional support I trust", icon: "🩺" },
  { label: "I've tried therapy before", description: "It wasn't quite the right fit, but I'm open", icon: "🔄" },
];

const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

export default function Questionnaire() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ name: "", age: "25", experience: "", hardestPart: "", support: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const currentValue = [answers.name, answers.age, answers.experience, answers.hardestPart, answers.support][step];
  const canContinue = step === 0 ? answers.name.trim().length >= 2 : step === 1 ? Number(answers.age) >= 13 && Number(answers.age) <= 120 : Boolean(currentValue);

  const updateAnswer = (key: keyof Answers, value: string) => setAnswers((current) => ({ ...current, [key]: value }));
  const next = () => setStep((current) => Math.min(current + 1, 5));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  const submitProfile = async () => {
    setIsSaving(true);
    setSubmissionError("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: answers.name,
          age: Number(answers.age),
          primaryFocus: answers.experience,
          currentExperience: answers.experience,
          hardestPart: answers.hardestPart,
          supportSystem: answers.support,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to save your answers.");
      setSubmitted(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Unable to save your answers. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (submitted) {
    return <main className="flex min-h-screen items-center justify-center bg-[#183b39] px-5 py-10 text-[#fbf7ef]"><motion.div initial="hidden" animate="visible" variants={fade} className="w-full max-w-lg text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e6775b] text-[#183b39]"><Check size={28} /></div><p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#a1c9ae]">Your space is ready</p><h1 className="mt-4 text-5xl font-semibold leading-[0.96] tracking-[-0.055em]">Let's start talking, {answers.name.trim()}.</h1><p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-[#d7e4d7]">Thank you for trusting Alex with a little more of your story. You can take this one honest moment at a time.</p><Link to="/dashboard" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#e6775b] px-6 py-3.5 text-sm font-semibold text-[#183b39] transition-transform hover:-translate-y-0.5">Start talking with Alex <ArrowRight size={17} /></Link></motion.div></main>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090f0e] px-5 py-7 text-[#f7f5ed] sm:px-8">
      <img src="https://cdn.builder.io/api/v1/image/assets%2F32a7e967e38946a18979c1eb330ccf9b%2F42fc77094cc946a18175e7b1b3395a8b?format=webp&width=800&height=1200" alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-70" />
      <div className="absolute inset-0 bg-[#090f0e]/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090f0e]/75 via-[#090f0e]/45 to-[#090f0e]/80" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col justify-center">
        <header className="mb-8 flex items-center justify-between"><Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.07em]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e6775b] text-sm text-[#183b39]">a</span>alex</Link><span className="text-xs font-medium text-[#8ca49c]">A quiet beginning</span></header>
        <div className="mb-7 flex items-center gap-2" aria-label={`Step ${step + 1} of 6`}>{Array.from({ length: 6 }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? "bg-[#a1c9ae]" : "bg-[#253532]"}`} />)}</div>
        <div className="p-0 sm:p-1">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial="hidden" animate="visible" exit={{ opacity: 0, y: -10 }} variants={fade} transition={{ duration: 0.3 }}>
              {step === 0 && <StepIntro eyebrow="Let's start with you" title="Hey there" copy="I'm Alex. I'm genuinely glad you're here. Before we dive in — what should I call you?"><label className="block"><span className="mb-2 block text-sm font-medium">Your name</span><input autoFocus value={answers.name} onChange={(event) => updateAnswer("name", event.target.value)} placeholder="Your name..." className="h-14 w-full rounded-2xl border border-[#354b45] bg-[#182522] px-4 text-base outline-none placeholder:text-[#6d827b] focus:border-[#a1c9ae] focus:ring-2 focus:ring-[#a1c9ae]/10" /><span className="mt-3 block text-xs leading-relaxed text-[#829890]">A first name or nickname — whatever feels like you.</span></label></StepIntro>}
              {step === 1 && <StepIntro eyebrow="A little about you" title="How old are you?" copy="Different stages of life carry different kinds of weight — knowing roughly where you are helps me show up the right way."><label className="block"><span className="mb-2 block text-sm font-medium">Your age</span><input type="number" min="13" max="120" value={answers.age} onChange={(event) => updateAnswer("age", event.target.value)} className="h-14 w-full rounded-2xl border border-[#354b45] bg-[#182522] px-4 text-base outline-none focus:border-[#a1c9ae] focus:ring-2 focus:ring-[#a1c9ae]/10" /><span className="mt-3 block text-xs leading-relaxed text-[#829890]">You need to be at least 13. Your age stays private — it just helps me understand your world a bit better.</span></label></StepIntro>}
              {step === 2 && <OptionStep eyebrow="What's been on your mind lately?" title="Whatever you're feeling right now is valid." options={experienceOptions} value={answers.experience} onChange={(value) => updateAnswer("experience", value)} footer="This helps me meet you where you actually are — not where a form assumes you might be." />}
              {step === 3 && <OptionStep eyebrow="A gentle check-in" title="What part of daily life feels hardest right now?" options={hardestOptions} value={answers.hardestPart} onChange={(value) => updateAnswer("hardestPart", value)} footer="This isn't a diagnosis. It simply helps me understand where to begin." />}
              {step === 4 && <OptionStep eyebrow="Your support system" title="Who's in your corner?" options={supportOptions} value={answers.support} onChange={(value) => updateAnswer("support", value)} footer="However you answered — you're showing up for yourself by being here. That already counts for a lot." />}
              {step === 5 && <div><div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#dbe9db] text-[#183b39]"><ShieldCheck size={23} /></div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6775b]">One last thing</p><h1 className="mt-3 text-4xl font-semibold leading-[0.98] tracking-[-0.055em]">You're ready, {answers.name.trim() || "friend"}.</h1><p className="mt-4 text-sm leading-relaxed text-[#a9bbb4]">Thank you for trusting me with all of this. Before we start, here's what you should know:</p><div className="mt-7 space-y-3"><Disclosure icon={<Heart size={18} />} title="I'm not a therapist" body="I'm a self-guided support tool. I don't diagnose or replace professional care." /><Disclosure icon={<LockIcon />} title="What you share stays with you" body="Your reflections are private, and you can delete your data through Settings." /><Disclosure icon={<Sparkles size={18} />} title="If you're in crisis, you're not alone" body="I'll always encourage reaching out to a real person or local helpline when you need urgent help." /></div></div>}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#263a35] pt-6"><button type="button" onClick={back} disabled={step === 0} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#8ca49c] transition-colors hover:text-[#f7f5ed] disabled:invisible"><ArrowLeft size={16} /> Back</button>{step < 5 ? <button type="button" onClick={next} disabled={!canContinue} className="flex items-center gap-2 rounded-full bg-[#a1c9ae] px-5 py-3 text-sm font-semibold text-[#183b39] transition-all hover:bg-[#c1dec9] disabled:cursor-not-allowed disabled:opacity-40">Continue <ArrowRight size={16} /></button> : <button type="button" onClick={submitProfile} disabled={isSaving} className="flex items-center gap-2 rounded-full bg-[#e6775b] px-5 py-3 text-sm font-semibold text-[#183b39] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{isSaving ? "Saving..." : "Start talking with Alex"} <ArrowRight size={16} /></button>}</div>
        </div>
        {submissionError && <p role="alert" className="mt-4 text-center text-xs text-red-300">{submissionError}</p>}
        <p className="mt-6 text-center text-xs leading-relaxed text-[#61766f]">Your answers help Alex meet you where you are. You can change them later.</p>
      </div>
    </main>
  );
}

function StepIntro({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6775b]">{eyebrow}</p><h1 className="mt-3 text-4xl font-semibold leading-[0.98] tracking-[-0.055em]">{title}</h1><p className="mt-4 text-sm leading-relaxed text-[#a9bbb4]">{copy}</p><div className="mt-8">{children}</div></div>;
}

function OptionStep({ eyebrow, title, options, value, onChange, footer }: { eyebrow: string; title: string; options: Option[]; value: string; onChange: (value: string) => void; footer: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6775b]">{eyebrow}</p><h1 className="mt-3 text-3xl font-semibold leading-[1.02] tracking-[-0.045em]">{title}</h1><div className="mt-7 space-y-2.5">{options.map((option) => { const selected = value === option.label; return <button type="button" key={option.label} onClick={() => onChange(option.label)} className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${selected ? "border-[#a1c9ae] bg-[#a1c9ae]/10" : "border-[#2d413c] bg-[#182522] hover:border-[#58736a]"}`}><span className="text-xl">{option.icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{option.label}</span><span className="mt-0.5 block text-xs text-[#829890]">{option.description}</span></span>{selected && <Check size={17} className="shrink-0 text-[#a1c9ae]" />}</button>; })}</div><p className="mt-5 text-xs leading-relaxed text-[#829890]">{footer}</p></div>;
}

function Disclosure({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) { return <div className="flex gap-3 rounded-2xl border border-[#2d413c] bg-[#182522] p-3.5"><span className="mt-0.5 text-[#a1c9ae]">{icon}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-relaxed text-[#829890]">{body}</p></div></div>; }
function LockIcon() { return <ShieldCheck size={18} />; }
