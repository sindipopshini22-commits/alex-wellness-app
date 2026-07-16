"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LectureArticle } from "./moduleData";

export default function CourseLayout({ article }: { article: LectureArticle }) {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const section = article.sections[currentSection];
  const isLast = currentSection === article.sections.length - 1;

  async function finish() {
    await fetch("/api/classroom/progress", {
      method: "POST",
      body: JSON.stringify({ moduleId: article.title, inputs: {}, isCompleted: true })
    });
    router.push(`/dashboard?initContext=closure&module=${encodeURIComponent(article.title)}`);
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-zinc-100 shadow-xl">
      <div className="mb-6 flex items-center justify-between text-xs text-zinc-500">
        <span className="font-medium text-zinc-300">{article.title}</span>
        <span>
          Section {currentSection + 1} of {article.sections.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-400 transition-all duration-500"
          style={{ width: `${((currentSection + 1) / article.sections.length) * 100}%` }}
        />
      </div>

      <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{section.body}</p>

      {/* Source attribution */}
      {!isLast && (
        <p className="mt-6 text-[10px] text-zinc-600">
          Source: {article.source} —{" "}
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-400"
          >
            Read original
          </a>
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <button
          disabled={currentSection === 0}
          onClick={() => setCurrentSection((c) => c - 1)}
          className="rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-400 disabled:opacity-30"
        >
          Back
        </button>
        {!isLast ? (
          <button
            onClick={() => setCurrentSection((c) => c + 1)}
            className="rounded-xl bg-zinc-100 px-6 py-2 text-xs font-semibold text-zinc-950"
          >
            Next
          </button>
        ) : (
          <button
            onClick={finish}
            className="rounded-xl bg-emerald-500 px-6 py-2 text-xs font-semibold text-zinc-950"
          >
            Finish & Discuss with Alex
          </button>
        )}
      </div>
    </div>
  );
}
