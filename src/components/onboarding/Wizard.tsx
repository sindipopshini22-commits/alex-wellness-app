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
    (step === 2 && data.currentExperience !== null) ||
    (step === 3 && data.hardestPart !== null) ||
    (step === 4 && data.supportSystem !== null) ||
    (step !== 0 && step !== 2 && step !== 3 && step !== 4);

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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      {/* Progress dots */}
      <div className="mb-8 flex justify-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              i <= step
                ? i === step
                  ? "bg-emerald-400 scale-125"
                  : "bg-zinc-300"
                : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl backdrop-blur-sm transition-all duration-300">
        {/* ── Step 0: Username ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👋</span>
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  Hey there
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                  I&apos;m Alex. I&apos;m genuinely glad you&apos;re here.
                  Before we dive in — what should I call you?
                </p>
              </div>
            </div>
            <div>
              <input
                type="text"
                value={data.username}
                onChange={(e) => setData({ ...data, username: e.target.value })}
                placeholder="Your name..."
                maxLength={30}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-3.5 text-base text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                autoFocus
              />
              <p className="mt-2 text-xs text-zinc-600">
                A first name or nickname — whatever feels like you.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 1: Age ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🌱</span>
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  A little about you
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                  How old are you? Different stages of life carry different
                  kinds of weight — knowing roughly where you are helps me
                  show up the right way.
                </p>
              </div>
            </div>
            <div>
              <input
                type="number"
                min={13}
                max={120}
                value={data.age}
                onChange={(e) => setData({ ...data, age: Number(e.target.value) })}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-5 py-3.5 text-base text-zinc-100 outline-none transition-all focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                autoFocus
              />
              <p className="mt-2 text-xs text-zinc-600">
                You need to be at least 13. Your age stays private — it just
                helps me understand your world a bit better.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: "What's been on your mind lately?" ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💭</span>
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  What&apos;s been on your mind lately?
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                  There&apos;s no wrong answer. Whatever you&apos;re feeling
                  right now — even if you can&apos;t quite name it — is valid.
                  Pick what resonates most.
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {EXPERIENCES.map((exp) => {
                const isSelected = data.currentExperience === exp.id;
                return (
                  <button
                    key={exp.id}
                    onClick={() => setData({ ...data, currentExperience: exp.id })}
                    className={`group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-700/50 bg-emerald-950/30"
                        : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                    }`}
                  >
                    <span className={`text-xl transition-transform duration-200 ${
                      isSelected ? "scale-110" : "group-hover:scale-110"
                    }`}>
                      {exp.emoji}
                    </span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        isSelected ? "text-emerald-200" : "text-zinc-200"
                      }`}>
                        {exp.label}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {exp.subtitle}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-emerald-400 text-lg">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-zinc-600">
              This helps me meet you where you actually are — not where a form
              assumes you might be.
            </p>
          </div>
        )}

        {/* ── Step 3: "What part of daily life feels hardest?" ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  What part of daily life feels hardest right now?
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                  This isn&apos;t a diagnosis — I&apos;m not a doctor and I&apos;d
                  never pretend to be one. I just want to understand where
                  you&apos;re feeling the weight so I can help where it actually
                  matters.
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {HARDEST_PARTS.map((hp) => {
                const isSelected = data.hardestPart === hp.id;
                return (
                  <button
                    key={hp.id}
                    onClick={() => setData({ ...data, hardestPart: hp.id })}
                    className={`group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-700/50 bg-emerald-950/30"
                        : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                    }`}
                  >
                    <span className={`text-xl transition-transform duration-200 ${
                      isSelected ? "scale-110" : "group-hover:scale-110"
                    }`}>
                      {hp.emoji}
                    </span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        isSelected ? "text-emerald-200" : "text-zinc-200"
                      }`}>
                        {hp.label}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {hp.subtitle}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-emerald-400 text-lg">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: "Who's in your corner?" ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🫂</span>
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  Who&apos;s in your corner?
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                  Support comes in all shapes — friends, family, therapists,
                  or just your own quiet resilience. Knowing what your
                  support system looks like helps me know when to step in
                  and when to make space.
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {SUPPORT_OPTIONS.map((so) => {
                const isSelected = data.supportSystem === so.id;
                return (
                  <button
                    key={so.id}
                    onClick={() => selectSupport(so.id)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-700/50 bg-emerald-950/30"
                        : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                    }`}
                  >
                    <span className={`text-xl transition-transform duration-200 ${
                      isSelected ? "scale-110" : "group-hover:scale-110"
                    }`}>
                      {so.emoji}
                    </span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        isSelected ? "text-emerald-200" : "text-zinc-200"
                      }`}>
                        {so.label}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {so.subtitle}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-emerald-400 text-lg">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-zinc-600">
              However you answered — you&apos;re showing up for yourself by being
              here. That already counts for a lot.
            </p>
          </div>
        )}

        {/* ── Step 5: Ready ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">✨</span>
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  You&apos;re ready, {data.username || "friend"}
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                  Thank you for trusting me with all of this. Before we start,
                  here&apos;s what you should know:
                </p>
              </div>
            </div>
            <ul className="space-y-3.5">
              {[
                {
                  icon: "🎯",
                  title: "I'm not a therapist",
                  text: "I'm a self-guided support tool — here to listen, reflect, and help you process. I don't diagnose or replace professional care.",
                },
                {
                  icon: "🛡️",
                  title: "What you share stays with you",
                  text: "Everything you tell me is private. You can delete your data anytime from Settings — no questions asked.",
                },
                {
                  icon: "🚨",
                  title: "If you're in crisis, you're not alone",
                  text: "I'll connect you to a real person on a helpline right away. I'm not equipped to handle emergencies alone, and I'll never pretend I am.",
                },
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
                >
                  <span className="mt-0.5 text-lg">{item.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-zinc-200">
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                      {item.text}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-2xl border border-red-900/40 bg-red-950/30 px-5 py-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="rounded-2xl border border-zinc-800 px-5 py-2.5 text-sm text-zinc-500 transition-all hover:text-zinc-300 hover:border-zinc-700 disabled:opacity-30 disabled:hover:text-zinc-500 disabled:hover:border-zinc-800"
          >
            ← Back
          </button>
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={next}
              disabled={!canProceed}
              className="rounded-2xl bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 disabled:opacity-30"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={busy}
              className="rounded-2xl bg-emerald-500 px-8 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy ? "One moment..." : "Start talking with Alex"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
