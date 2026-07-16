// /legal/eula — public-facing hosted EULA.
// Required by Apple Guideline 5.1.1 — paste this URL into App Store Connect.

import { EULA_TEXT, EULA_VERSION, EULA_LAST_UPDATED } from "@/lib/eula";

export const metadata = {
  title: `Alex — End-User License Agreement (v${EULA_VERSION})`
};

export default function Eulapage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-zinc-100">
      <header className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold">End-User License Agreement</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Version {EULA_VERSION} · Last updated {EULA_LAST_UPDATED}
        </p>
      </header>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">
        {EULA_TEXT}
      </pre>
    </main>
  );
}
