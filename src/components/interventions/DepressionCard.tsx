"use client";
import { useState } from "react";

const SEED = [
  { id: "w1", label: "Open one window for 60 seconds", seconds: 60 },
  { id: "w2", label: "Drink a full glass of water", seconds: 90 },
  { id: "w3", label: "Stand outside and name 3 things you see", seconds: 120 },
  { id: "w4", label: "Send one text to anyone you trust", seconds: 180 }
];

export default function DepressionCard() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setDone(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Depression Micro-Wins</h3>
      <p className="mt-1 text-xs text-zinc-500">Motivation is a lagging indicator. Do the tiny thing anyway.</p>
      <ul className="mt-5 space-y-2">
        {SEED.map(w => (
          <li key={w.id}>
            <button onClick={() => toggle(w.id)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${done.has(w.id) ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-200 line-through" : "border-zinc-800 bg-zinc-900/60"}`}>
              <span>{w.label}</span>
              <span className="text-xs text-zinc-500">~{w.seconds}s</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-zinc-500">If none of these feel possible, tell Alex. We'll find a smaller one.</p>
    </div>
  );
}
