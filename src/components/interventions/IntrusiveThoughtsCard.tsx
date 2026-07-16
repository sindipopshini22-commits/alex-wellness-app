"use client";
import { useState, useCallback } from "react";

const ACT_REFRAIMES = [
  "Thoughts are mental events, not commands. You can watch them pass like clouds.",
  "You are the sky, not the weather. The thought is just weather passing through.",
  "This thought has no power over you unless you give it power by engaging with it.",
  "Notice the thought, label it as 'just a thought,' and gently return to your breath.",
  "Intrusive thoughts thrive on resistance. Let it be there without fighting it."
];

export default function IntrusiveThoughtsCard() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"input" | "dissolving" | "reframe">("input");
  const [reframe, setReframe] = useState("");

  const handleRelease = useCallback(() => {
    if (!input.trim()) return;
    setPhase("dissolving");
    const randomReframe = ACT_REFRAIMES[Math.floor(Math.random() * ACT_REFRAIMES.length)];
    setTimeout(() => {
      setReframe(randomReframe);
      setPhase("reframe");
    }, 1800);
  }, [input]);

  const handleReset = useCallback(() => {
    setInput("");
    setPhase("input");
    setReframe("");
  }, []);

  return (
    <div className="w-full max-w-md rounded-2xl border border-violet-900/30 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-400">
        Intrusive Thought Release
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        Write the looping thought, then let it dissolve.
      </p>

      {phase === "input" && (
        <div className="mt-5 space-y-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="The thought that keeps circling..."
            rows={4}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-violet-700"
          />
          <button
            onClick={handleRelease}
            disabled={!input.trim()}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-30 transition-colors"
          >
            Release
          </button>
        </div>
      )}

      {phase === "dissolving" && (
        <div className="mt-8 space-y-4 text-center">
          <p
            className="animate-pulse text-sm italic text-violet-300 transition-all duration-1000"
            style={{ animation: "thought-dissolve 1.8s ease-out forwards" }}
          >
            &ldquo;{input}&rdquo;
          </p>
          <div className="flex justify-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-violet-500"
                style={{
                  animation: `thought-dissolve 1.8s ease-out ${i * 0.15}s forwards`,
                  opacity: 1
                }}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500">Dissolving...</p>
        </div>
      )}

      {phase === "reframe" && (
        <div className="mt-6 space-y-5">
          <p className="rounded-xl border border-violet-800/40 bg-violet-950/30 p-4 text-sm leading-relaxed text-violet-200 italic">
            {reframe}
          </p>
          <p className="text-xs text-zinc-500">
            Thoughts are not facts. They are suggestions — and you get to choose whether to accept them.
          </p>
          <button
            onClick={handleReset}
            className="w-full rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            Release another thought
          </button>
        </div>
      )}
    </div>
  );
}
