"use client";
import { useState } from "react";

const ZOOM = [
  { lens: "Cosmic", text: "You're a brief, self-aware flicker on a small rock circling an ordinary star. None of this was promised to mean anything — meaning is something you make." },
  { lens: "Civilization", text: "Every person you pass is carrying a private weather system. You are not alone in feeling small. You are part of a species that has always asked this question." },
  { lens: "Lifetime", text: "A hundred years is a long time to a human and a blink to a star. The discomfort is real, but the question is not new and you don't have to answer it tonight." },
  { lens: "Today", text: "You are here, breathing, in a room. There is something small and concrete you can do in the next ten minutes. Start there." }
];

export default function MacroZoomCard() {
  const [i, setI] = useState(0);
  const z = ZOOM[i];
  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Existential Zoom</h3>
      <p className="mt-1 text-xs text-zinc-500">Same question, four different distances. Pick a lens.</p>
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm leading-relaxed">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Lens: {z.lens}</div>
        <p className="mt-2 text-zinc-200">{z.text}</p>
      </div>
      <div className="mt-5 flex justify-between text-xs">
        <button onClick={() => setI(v => Math.max(0, v - 1))} disabled={i === 0} className="rounded-xl border border-zinc-800 px-3 py-1.5 text-zinc-300 disabled:opacity-30">Wider</button>
        <button onClick={() => setI(v => Math.min(ZOOM.length - 1, v + 1))} disabled={i === ZOOM.length - 1} className="rounded-xl border border-zinc-800 px-3 py-1.5 text-zinc-300 disabled:opacity-30">Closer</button>
      </div>
    </div>
  );
}
