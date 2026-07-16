// /api/journal — list & create journal entries

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { createJournalSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/auditLog";

async function getUserId() {
  return getVerifiedUserId();
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  let entries;
  try {
    entries = await db.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load entries." }, { status: 500 });
  }

  void writeAuditLog("JOURNAL.READ", userId, { count: entries.length });

  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createJournalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entry." }, { status: 400 });
  }

  const { title, content, mood } = parsed.data;

  let entry;
  try {
    entry = await db.journalEntry.create({
      data: {
        userId,
        title,
        content,
        mood,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to create entry." }, { status: 500 });
  }

  void writeAuditLog("JOURNAL.CREATE", userId, { entryId: entry.id, titleLength: title?.length ?? 0 });

  return NextResponse.json(entry, { status: 201 });
}
