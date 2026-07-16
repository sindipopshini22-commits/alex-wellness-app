// /api/journal/[id] — update & delete a single journal entry

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { updateJournalSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/auditLog";

async function getUserId() {
  return getVerifiedUserId();
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateJournalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entry data." }, { status: 400 });
  }

  let existing;
  try {
    existing = await db.journalEntry.findUnique({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { title, content, mood } = parsed.data;

  let entry;
  try {
    entry = await db.journalEntry.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(mood !== undefined ? { mood } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update entry." }, { status: 500 });
  }

  void writeAuditLog("JOURNAL.UPDATE", userId, { entryId: id });

  return NextResponse.json(entry);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  const { id } = await params;

  let existing;
  try {
    existing = await db.journalEntry.findUnique({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await db.journalEntry.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete entry." }, { status: 500 });
  }

  void writeAuditLog("JOURNAL.DELETE", userId, { entryId: id });

  return NextResponse.json({ ok: true });
}
