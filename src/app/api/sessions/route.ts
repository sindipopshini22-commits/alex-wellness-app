// /api/sessions — returns the user's chat sessions with previews.
// Used by the chat history sidebar.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

// POST /api/sessions — creates a new chat session.
// Used by the SPA dashboard to start a fresh conversation.
export async function POST() {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  let session;
  try {
    session = await db.chatSession.create({ data: { userId } });
  } catch {
    return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
  }

  void writeAuditLog("CHAT.SESSION_CREATED", userId, { sessionId: session.id });

  return NextResponse.json({ id: session.id, createdAt: session.createdAt.toISOString() }, { status: 201 });
}

export async function GET() {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  let sessions;
  try {
    sessions = await db.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
          where: { sender: "USER" },
        },
        _count: { select: { messages: true } },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load sessions." }, { status: 500 });
  }

  const result = sessions.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    preview: s.messages[0]?.content?.slice(0, 80) ?? "Empty session",
    messageCount: s._count.messages,
  }));

  void writeAuditLog("SESSIONS.LIST", userId, { count: result.length });

  return NextResponse.json(result);
}
