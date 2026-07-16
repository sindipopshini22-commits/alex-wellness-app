// /api/user/delete — Apple 5.1.1 + GDPR Art. 17 purge.
// Single transaction; cascade clears Profile, ChatSession, ChatMessage,
// LongTermMemoryBank, and CourseProgress.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function DELETE() {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  try {
    await db.user.delete({ where: { id: userId } });
    // Need a fresh cookie store to delete the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("alex_uid");
  } catch {
    return NextResponse.json({ error: "Account deletion failed." }, { status: 500 });
  }

  void writeAuditLog("USER.DELETE", userId);

  return NextResponse.json({ message: "Account data footprint purged completely." });
}
