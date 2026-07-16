// /api/sessions/[id]/messages — returns all messages for a session.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  // Verify ownership
  let session;
  try {
    session = await db.chatSession.findUnique({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to verify session." }, { status: 500 });
  }

  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let messages;
  try {
    messages = await db.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        sender: true,
        content: true,
        customType: true,
        payload: true,
        createdAt: true,
        attachments: {
          select: {
            id: true,
            filename: true,
            filepath: true,
            mimeType: true,
            size: true,
          },
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }

  void writeAuditLog("SESSIONS.MESSAGES_READ", userId, { sessionId: id, count: messages.length });

  return NextResponse.json(messages);
}
