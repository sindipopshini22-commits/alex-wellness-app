import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getVerifiedUserId } from "@/lib/session";
import Wizard from "@/components/onboarding/Wizard";

export default async function OnboardingPage() {
  const userId = await getVerifiedUserId();
  if (!userId) redirect("/login");

  // Safety net: returning users who already completed onboarding should not see the wizard again
  const user = await db.user.findUnique({ where: { id: userId }, select: { hasCompletedOnboarding: true } });
  if (user?.hasCompletedOnboarding) redirect("/dashboard");

  return <Wizard />;
}
