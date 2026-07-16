// /api/classroom/progress — persists module completion + per-slide inputs.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { classroomProgressSchema } from "@/lib/validation";
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

  const parsed = classroomProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid progress data." }, { status: 400 });
  }

  const { moduleId, inputs, currentStep, isCompleted } = parsed.data;

  try {
    await db.courseProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: {
        userInputs: inputs ?? undefined,
        currentStep: currentStep ?? 0,
        isCompleted: !!isCompleted
      },
      create: {
        userId,
        moduleId,
        userInputs: inputs ?? null,
        currentStep: currentStep ?? 0,
        isCompleted: !!isCompleted
      }
    });
  } catch {
    return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
  }

  void writeAuditLog("CLASSROOM.PROGRESS_SAVE", userId, { moduleId, isCompleted: !!isCompleted });

  return NextResponse.json({ ok: true });
}
