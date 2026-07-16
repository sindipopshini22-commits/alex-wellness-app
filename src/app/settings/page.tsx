// /settings — user-facing controls.
// - Download my data (JSON export)
// - Delete my account (Apple 5.1.1 / GDPR)
// - Re-accept EULA if version changed

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getVerifiedUserId } from "@/lib/session";
import { EULA_VERSION } from "@/lib/eula";
import Link from "next/link";
import DeleteAccountButton from "@/components/dashboard/DeleteAccountButton";
import ExportButton from "@/components/settings/ExportButton";
import ReAcceptEULA from "@/components/settings/ReAcceptEULA";

export default async function SettingsPage() {
  const userId = await getVerifiedUserId();
  if (!userId) redirect("/login");

  const user = await db.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) redirect("/login");

  const lastEula = await db.legalAcceptance.findFirst({
    where: { userId, documentType: "EULA" },
    orderBy: { acceptedAt: "desc" }
  });
  const eulaIsCurrent = lastEula?.version === EULA_VERSION;

  const sessionCount = await db.chatSession.count({ where: { userId } });
  const messageCount = await db.chatMessage.count({
    where: { session: { userId } }
  });
  const progressCount = await db.courseProgress.count({ where: { userId } });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link href="/dashboard" className="text-xs text-zinc-400">← Back to chat</Link>
      </header>

      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Your data</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Sessions" value={sessionCount} />
          <Stat label="Messages" value={messageCount} />
          <Stat label="Modules" value={progressCount} />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <ExportButton />
          <p className="text-xs text-zinc-500">
            Export returns JSON containing your profile, sessions, messages, memory bank, and course progress.
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Legal</h2>
        <div className="mt-3 text-sm text-zinc-300">
          EULA: {eulaIsCurrent ? (
            <span className="text-emerald-400">Accepted v{lastEula!.version} on {new Date(lastEula!.acceptedAt).toLocaleDateString()}</span>
          ) : (
            <span className="text-amber-400">Last accepted v{lastEula?.version ?? "never"}; current is v{EULA_VERSION}</span>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            href="/legal/eula"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-300"
          >
            Read full EULA
          </Link>
          {!eulaIsCurrent && <ReAcceptEULA />}
        </div>
      </section>

      <section className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-300">Danger zone</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Deleting your account will permanently remove your profile, chat history, memory bank, and course progress.
          This cannot be undone.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}
