"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── WHO-aligned experience options ───────────────────────────────────
// Replaces the cold "sex assigned at birth" question.
// These reflect the WHO continuum: mental health is about how we cope with
// stress, connect with others, and find meaning — not a binary checkbox.
const EXPERIENCES = [
  {
    id: "stress",
    label: "Stress and overwhelm",
    subtitle: "Like I'm carrying too much",
    emoji: "🌊",
  },
  {
    id: "sadness",
    label: "Sadness",
    subtitle: "Things feel grey and heavy",
    emoji: "🌧️",
  },
  {
    id: "worry",
    label: "Worry",
    subtitle: "My mind won't stop spinning",
    emoji: "🌀",
  },
  {
    id: "numbness",
    label: "Numbness",
    subtitle: "I feel disconnected from everything",
    emoji: "❄️",
  },
  {
    id: "irritability",
    label: "Irritability",
    subtitle: "Everything gets under my skin",
    emoji: "🔥",
  },
  {
    id: "other",
    label: "Something else",
    subtitle: "I'm not sure how to name it yet",
    emoji: "💭",
  },
];

// ─── WHO-aligned functional domain options ────────────────────────────
// Replaces the diagnostic label picker (anxiety, depression, PTSD, etc.).
// WHO: mental health is about coping with stress, realizing abilities,
// learning/working well, and contributing to community.
const HARDEST_PARTS = [
  {
    id: "daily_tasks",
    label: "Getting through the day",
    subtitle: "Everyday tasks feel like mountains",
    emoji: "🏔️",
  },
  {
    id: "connection",
    label: "Connecting with people",
    subtitle: "I feel isolated or misunderstood",
    emoji: "🫂",
  },
  {
    id: "sleep",
    label: "Rest and sleep",
    subtitle: "I can't switch off or rest properly",
    emoji: "🌙",
  },
  {
    id: "focus",
    label: "Focus and motivation",
    subtitle: "I can't concentrate or get things done",
    emoji: "🎯",
  },
  {
    id: "emotions",
    label: "Understanding my feelings",
    subtitle: "I don't know what I'm feeling or why",
    emoji: "🔍",
  },
  {
    id: "unspecific",
    label: "It's just... heavy",
    subtitle: "No single thing — it all feels like a lot",
    emoji: "💫",
  },
];

// ─── Support system options ───────────────────────────────────────────
// WHO: protective factors include social connections, community ties,
// and access to professional care.
const SUPPORT_OPTIONS = [
  {
    id: "well_supported",
    label: "I have people I can really talk to",
    subtitle: "Friends, family, or community who get it",
    emoji: "🤝",
  },
  {
    id: "some_support",
    label: "I have some support, but it's complicated",
    subtitle: "People care, but I don't always feel understood",
    emoji: "🧩",
  },
  {
    id: "alone",
    label: "I mostly deal with things alone",
    subtitle: "I don't really have someone to turn to",
    emoji: "💔",
  },
  {
    id: "in_therapy",
    label: "I'm working with a therapist or counselor",
    subtitle: "I have professional support I trust",
    emoji: "🩺",
  },
  {
    id: "tried_therapy",
    label: "I've tried therapy before",
    subtitle: "It wasn't quite the right fit, but I'm open",
    emoji: "🔄",
  },
];

// Shared with the questionnaire page so both onboarding flows feel like one product.
const BG_IMAGE =
  "https://cdn.builder.io/api/v1/image/assets%2F32a7e967e38946a18979c1eb330ccf9b%2F42fc77094cc946a18175e7b1b3395a8b?format=webp&width=800&height=1200";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0 text-[#a1c9ae]">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[23px] w-[23px]">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    username: "",
    age: 25,
    sex: "",
    primaryFocus: "",
    currentExperience: null as string | null,
    hardestPart: null as string | null,
    supportSystem: null as string | null,
    hasProfessionalHelp: false,
    hasFeltThisWayBefore: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TOTAL_STEPS = 6;
  const next = () => {
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const canProceed =
    (step === 0 && data.username.trim().length >= 2) ||
    (step === 1 && data.age >= 13 && data.age <= 120) ||
    (step === 2 && data.currentExperience !== null) ||
    (step === 3 && data.hardestPart !== null) ||
    (step === 4 && data.supportSystem !== null) ||
    (step === 5);

  // Derive contextual flags from supportSystem selection.
  // hasProfessionalHelp = currently in therapy (distinct from "tried before")
  // hasFeltThisWayBefore = has some familiarity with this headspace
  function selectSupport(id: string) {
    setData({
      ...data,
      supportSystem: id,
      hasProfessionalHelp: id === "in_therapy",
      hasFeltThisWayBefore: id === "tried_therapy" || id === "some_support" || id === "in_therapy",
    });
  }

  async function finish() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        // Map the WHO-aligned experience to primaryFocus for backward compat
        primaryFocus: data.hardestPart ?? data.currentExperience ?? "",
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Something went wrong. Let's try again.");
      setBusy(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090f0e] px-5 py-7 text-[#f7f5ed] sm:px-8">
      <img
        src={BG_IMAGE}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 bg-[#090f0e]/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090f0e]/75 via-[#090f0e]/45 to-[#090f0e]/80" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-lg flex-col justify-center py-4">
        {/* Branded header */}
        <header className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.07em]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e6775b] text-sm text-[#183b39]">
              a
            </span>
            alex
          </span>
          <span className="text-xs font-medium text-[#8ca49c]">A quiet beginning</span>
        </header>

        {/* Progress segments */}
        <div className="mb-7 flex items-center gap-2" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-[#a1c9ae]" : "bg-[#253532]"
              }`}
            />
          ))}
        </div>

        <div key={step} className="animate-fade-up">
          {/* ── Step 0: Username ── */}
          {step === 0 && (
            <StepIntro
              eyebrow="Let's start with you"
              title="Hey there"
              copy="I'm Alex. I'm genuinely glad you're here. Before we dive in — what should I call you?"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Your name</span>
                <input
                  type="text"
                  autoFocus
                  value={data.username}
                  onChange={(e) => setData({ ...data, username: e.target.value })}
                  placeholder="Your name..."
                  maxLength={30}
                  className="h-14 w-full rounded-2xl border border-[#354b45] bg-[#182522] px-4 text-base text-[#f7f5ed] outline-none placeholder:text-[#6d827b] transition-colors focus:border-[#a1c9ae] focus:ring-2 focus:ring-[#a1c9ae]/10"
                />
                <span className="mt-3 block text-xs leading-relaxed text-[#829890]">
                  A first name or nickname — whatever feels like you.
                </span>
              </label>
            </StepIntro>
          )}

          {/* ── Step 1: Age ── */}
          {step === 1 && (
            <StepIntro
              eyebrow="A little about you"
              title="How old are you?"
              copy="Different stages of life carry different kinds of weight — knowing roughly where you are helps me show up the right way."
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Your age</span>
                <input
                  type="number"
                  min={13}
                  max={120}
                  autoFocus
                  value={data.age}
                  onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                  className="h-14 w-full rounded-2xl border border-[#354b45] bg-[#182522] px-4 text-base text-[#f7f5ed] outline-none transition-colors focus:border-[#a1c9ae] focus:ring-2 focus:ring-[#a1c9ae]/10"
                />
                <span className="mt-3 block text-xs leading-relaxed text-[#829890]">
                  You need to be at least 13. Your age stays private — it just helps me understand
                  your world a bit better.
                </span>
              </label>
            </StepIntro>
          )}

          {/* ── Step 2: "What's been on your mind lately?" ── */}
          {step === 2 && (
            <OptionStep
              eyebrow="What's been on your mind lately?"
              title="Whatever you're feeling right now is valid."
              options={EXPERIENCES}
              value={data.currentExperience}
              onSelect={(id) => setData({ ...data, currentExperience: id })}
              footer="This helps me meet you where you actually are — not where a form assumes you might be."
            />
          )}

          {/* ── Step 3: "What part of daily life feels hardest?" ── */}
          {step === 3 && (
            <OptionStep
              eyebrow="A gentle check-in"
              title="What part of daily life feels hardest right now?"
              options={HARDEST_PARTS}
              value={data.hardestPart}
              onSelect={(id) => setData({ ...data, hardestPart: id })}
              footer="This isn't a diagnosis. It simply helps me understand where to begin."
            />
          )}

          {/* ── Step 4: "Who's in your corner?" ── */}
          {step === 4 && (
            <OptionStep
              eyebrow="Your support system"
              title="Who's in your corner?"
              options={SUPPORT_OPTIONS}
              value={data.supportSystem}
              onSelect={selectSupport}
              footer="However you answered — you're showing up for yourself by being here. That already counts for a lot."
            />
          )}

          {/* ── Step 5: Ready ── */}
          {step === 5 && (
            <div>
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#dbe9db] text-[#183b39]">
                <ShieldIcon />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6775b]">
                One last thing
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-[0.98] tracking-[-0.055em]">
                You&apos;re ready, {data.username.trim() || "friend"}.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-[#a9bbb4]">
                Thank you for trusting me with all of this. Before we start, here&apos;s what you
                should know:
              </p>
              <div className="mt-7 space-y-3">
                <Disclosure
                  icon="🎯"
                  title="I'm not a therapist"
                  body="I'm a self-guided support tool — here to listen, reflect, and help you process. I don't diagnose or replace professional care."
                />
                <Disclosure
                  icon="🔒"
                  title="What you share stays with you"
                  body="Everything you tell me is private. You can delete your data anytime from Settings — no questions asked."
                />
                <Disclosure
                  icon="🚨"
                  title="If you're in crisis, you're not alone"
                  body="I'll connect you to a real person on a helpline right away. I'm not equipped to handle emergencies alone, and I'll never pretend I am."
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-center text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#263a35] pt-6">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#8ca49c] transition-colors hover:text-[#f7f5ed] disabled:invisible"
          >
            ← Back
          </button>
          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canProceed}
              className="flex items-center gap-2 rounded-full bg-[#a1c9ae] px-5 py-3 text-sm font-semibold text-[#183b39] transition-all hover:bg-[#c1dec9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-[#e6775b] px-5 py-3 text-sm font-semibold text-[#183b39] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "One moment..." : "Start talking with Alex"} →
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function StepIntro({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6775b]">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold leading-[0.98] tracking-[-0.055em]">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#a9bbb4]">{copy}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function OptionStep({
  eyebrow,
  title,
  options,
  value,
  onSelect,
  footer,
}: {
  eyebrow: string;
  title: string;
  options: { id: string; label: string; subtitle: string; emoji: string }[];
  value: string | null;
  onSelect: (id: string) => void;
  footer: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6775b]">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold leading-[1.02] tracking-[-0.045em]">{title}</h1>
      <div className="mt-7 space-y-2.5">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              type="button"
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                selected
                  ? "border-[#a1c9ae] bg-[#a1c9ae]/10"
                  : "border-[#2d413c] bg-[#182522] hover:border-[#58736a]"
              }`}
            >
              <span className="text-xl">{option.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-[#829890]">{option.subtitle}</span>
              </span>
              {selected && <CheckIcon />}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-[#829890]">{footer}</p>
    </div>
  );
}

function Disclosure({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#2d413c] bg-[#182522] p-3.5">
      <span className="mt-0.5 text-lg">{icon}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#829890]">{body}</p>
      </div>
    </div>
  );
}
