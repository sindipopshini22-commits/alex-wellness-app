// /api/user/export — GDPR Art. 20 data export.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET() {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  let user, profile, sessions, progress;
  try {
    [user, profile, sessions, progress] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.userProfile.findUnique({ where: { userId } }),
      db.chatSession.findMany({ where: { userId }, include: { messages: true, memoryBank: true } }),
      db.courseProgress.findMany({ where: { userId } })
    ]);
  } catch {
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }

  void writeAuditLog("USER.EXPORT", userId, { sessionCount: sessions?.length ?? 0 });

  return NextResponse.json({ user, profile, sessions, progress, exportedAt: new Date() });
}
