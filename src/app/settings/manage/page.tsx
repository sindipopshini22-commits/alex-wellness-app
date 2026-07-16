import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getVerifiedUserId } from "@/lib/session";
import Link from "next/link";
import EditProfile from "./EditProfile";

export default async function ManageAccountPage() {
  const userId = await getVerifiedUserId();
  if (!userId) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) redirect("/login");
  if (!user.hasCompletedOnboarding) redirect("/onboarding");

  const profile = user.profile;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Account Centre</h1>
        <Link href="/dashboard" className="text-xs text-zinc-400">
          ← Back to dashboard
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-3xl">👤</span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Your Profile</h2>
            <p className="text-xs text-zinc-500">
              Edit your details anytime. All changes are saved immediately.
            </p>
          </div>
        </div>

        {profile ? (
          <EditProfile
            profile={{
              username: profile.username ?? "",
              age: profile.age,
              sex: profile.sex,
              primaryFocus: profile.primaryFocus,
              hasProfessionalHelp: profile.hasProfessionalHelp,
              hasFeltThisWayBefore: profile.hasFeltThisWayBefore,
            }}
          />
        ) : (
          <p className="text-sm text-zinc-500">No profile found.</p>
        )}
      </section>
    </main>
  );
}
