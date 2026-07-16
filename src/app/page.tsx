import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getVerifiedUserId } from "@/lib/session";
import Link from "next/link";

export default async function Home() {
  const userId = await getVerifiedUserId();
  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      if (!user.hasCompletedOnboarding) redirect("/onboarding");
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Alex</h1>
      <p className="mt-3 text-zinc-400">
        A brutally honest, deeply empathetic best friend in your pocket.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950"
        >
          Sign in
        </Link>
        <Link
          href="/login?anon=1"
          className="rounded-xl border border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-200"
        >
          Continue anonymously
        </Link>
      </div>
      <p className="mt-12 text-xs text-zinc-600">
        Not a substitute for therapy. In crisis, dial 988.
      </p>
    </main>
  );
}
