// /api/chat/report — Apple Guideline 1.2 UGC reporting endpoint.
// Receives a messageId and optional reason, writes a ReportedMessage record,
// and flags the original ChatMessage as reported.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/auditLog";
import { getVerifiedUserId } from "@/lib/session";

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report data." }, { status: 400 });
  }

  const { messageId, reason } = parsed.data;

  let message;
  try {
    message = await db.chatMessage.findUnique({
      where: { id: messageId },
      include: { session: { select: { userId: true } } }
    });
  } catch {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (message.session.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await db.$transaction([
      db.chatMessage.update({
        where: { id: messageId },
        data: { isReported: true }
      }),
      db.reportedMessage.upsert({
        where: { messageId },
        update: { reason: reason ?? null },
        create: { messageId, reason: reason ?? null }
      })
    ]);
  } catch {
    return NextResponse.json({ error: "Report failed." }, { status: 500 });
  }

  void writeAuditLog("CHAT.REPORT", userId, { messageId });

  return NextResponse.json({ ok: true });
}
