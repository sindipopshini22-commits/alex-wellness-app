// /api/profile — upserts the UserProfile and flips hasCompletedOnboarding.
// Called by the onboarding wizard on finish.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { profileSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
  }

  const { username, age, sex, primaryFocus, currentExperience, hardestPart, supportSystem, hasProfessionalHelp, hasFeltThisWayBefore } = parsed.data;

  try {
    // Fetch existing profile so we can do partial updates safely
    const existing = await db.userProfile.findUnique({ where: { userId } });

    // Check username uniqueness if provided and changed
    if (username && username !== existing?.username) {
      const taken = await db.userProfile.findFirst({ where: { username } });
      if (taken) {
        return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
      }
    }

    // Only update fields that were actually sent
    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username || null;
    if (age !== undefined) updateData.age = age;
    if (sex !== undefined) updateData.sex = sex ?? "";
    if (primaryFocus !== undefined) updateData.primaryFocus = primaryFocus ?? "";
    if (currentExperience !== undefined) updateData.currentExperience = currentExperience;
    if (hardestPart !== undefined) updateData.hardestPart = hardestPart;
    if (supportSystem !== undefined) updateData.supportSystem = supportSystem;
    if (hasProfessionalHelp !== undefined) updateData.hasProfessionalHelp = hasProfessionalHelp;
    if (hasFeltThisWayBefore !== undefined) updateData.hasFeltThisWayBefore = hasFeltThisWayBefore;

    const createData = {
      userId,
      username: username || null,
      age: age ?? 25,
      sex: sex ?? "",
      primaryFocus: primaryFocus ?? "",
      currentExperience: currentExperience ?? null,
      hardestPart: hardestPart ?? null,
      supportSystem: supportSystem ?? null,
      hasProfessionalHelp: hasProfessionalHelp ?? false,
      hasFeltThisWayBefore: hasFeltThisWayBefore ?? false,
    };

    await db.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    });

    // Only mark onboarding complete if this is a full profile creation
    if (age !== undefined && primaryFocus !== undefined) {
      await db.user.update({
        where: { id: userId },
        data: { hasCompletedOnboarding: true, ageVerified: age >= 18 },
      });
    }
  } catch {
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }

  void writeAuditLog("PROFILE.UPDATE", userId, { hasUsername: !!username });

  return NextResponse.json({ ok: true });
}
