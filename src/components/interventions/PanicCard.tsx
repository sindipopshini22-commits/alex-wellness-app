"use client";
import { useEffect, useState } from "react";

type Phase = "Inhale" | "Hold" | "Exhale";
const PLAN: Record<Phase, number> = { Inhale: 4, Hold: 7, Exhale: 8 };
const NEXT: Record<Phase, Phase> = { Inhale: "Hold", Hold: "Exhale", Exhale: "Inhale" };

const SENSES = [
  { sense: "See", prompt: "5 things you can see" },
  { sense: "Touch", prompt: "4 things you can touch" },
  { sense: "Hear", prompt: "3 things you can hear" },
  { sense: "Smell", prompt: "2 things you can smell" },
  { sense: "Taste", prompt: "1 thing you can taste" }
];

export default function PanicCard() {
  const [phase, setPhase] = useState<Phase>("Inhale");
  const [seconds, setSeconds] = useState(PLAN.Inhale);
  const [cycleCount, setCycleCount] = useState(0);
  const [mode, setMode] = useState<"breathing" | "grounding">("breathing");
  const [checkedSenses, setCheckedSenses] = useState<number[]>([]);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(prev => {
        if (prev > 1) return prev - 1;
        setPhase(current => {
          const next = NEXT[current];
          if (next === "Inhale") setCycleCount(c => c + 1);
          setSeconds(PLAN[next]);
          return next;
        });
        return prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function toggleSense(i: number) {
    setCheckedSenses(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

  function resetAll() {
    setCycleCount(0);
    setCheckedSenses([]);
    setPhase("Inhale");
    setSeconds(PLAN.Inhale);
  }

  const allSensesChecked = checkedSenses.length === SENSES.length;

  return (
    <div className="w-full max-w-md rounded-2xl border border-red-900/30 bg-zinc-950 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">
          {mode === "breathing" ? "Panic Intercept" : "Grounding"}
        </h3>
        <button
          onClick={() => { setMode(m => m === "breathing" ? "grounding" : "breathing"); resetAll(); }}
          className="rounded-lg border border-zinc-800 px-3 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {mode === "breathing" ? "Grounding ↻" : "Breathing ↻"}
        </button>
      </div>
      <p className="text-xs text-zinc-400">
        Your body is in a false alarm. Pick a technique to ground it.
      </p>

      {mode === "breathing" && (
        <>
          <div className="my-8 flex items-center justify-center">
            <div
              className={`flex h-40 w-40 items-center justify-center rounded-full border border-red-500/20 text-xl font-bold transition-all duration-1000 ${
                phase === "Inhale"
                  ? "scale-110 bg-red-500/10"
                  : phase === "Hold"
                  ? "scale-110 bg-red-500/20"
                  : "scale-95 bg-red-500/5 opacity-70"
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-zinc-100">{phase}</span>
                <span className="mt-1 text-xs text-red-400">{seconds}s</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Cycles: {cycleCount} / 4</span>
            {cycleCount >= 4 && (
              <button
                onClick={() => { setCycleCount(0); setPhase("Inhale"); setSeconds(PLAN.Inhale); }}
                className="rounded-lg border border-zinc-800 px-3 py-1 text-zinc-300 hover:bg-zinc-900"
              >
                Repeat
              </button>
            )}
          </div>
        </>
      )}

      {mode === "grounding" && (
        <div className="mt-5 space-y-3">
          <p className="text-xs text-zinc-500">
            Engage each sense to anchor yourself in the present.
          </p>
          {SENSES.map((s, i) => (
            <button
              key={s.sense}
              onClick={() => toggleSense(i)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                checkedSenses.includes(i)
                  ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-200"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[10px] font-bold uppercase">
                  {s.sense[0]}
                </span>
                <span className={checkedSenses.includes(i) ? "line-through" : ""}>
                  {s.prompt}
                </span>
              </div>
              {checkedSenses.includes(i) && (
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          {allSensesChecked && (
            <p className="pt-2 text-center text-xs text-emerald-400">
              You are here. You are safe. The panic will pass.
            </p>
          )}
        </div>
      )}

      <div className="mt-5 border-t border-zinc-800 pt-4 text-center">
        <p className="text-[10px] text-zinc-600">
          Your body is having a false alarm. You are not in danger.
        </p>
      </div>
    </div>
  );
}
