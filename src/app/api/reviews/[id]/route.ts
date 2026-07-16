// /api/reviews/[id] — submit a clinical review for a risk assessment.
// Accessible to CLINICIAN and ADMIN roles only.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { hasPermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  // RBAC check
  const canReview = await hasPermission(userId, "review:submit");
  if (!canReview) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { isAdequate, reviewNotes, retrainingSignal } = body;

  if (typeof isAdequate !== "boolean") {
    return NextResponse.json({ error: "isAdequate is required." }, { status: 400 });
  }

  try {
    // Verify the risk assessment exists
    const riskAssess = await db.riskAssessmentLog.findUnique({
      where: { id },
    });
    if (!riskAssess) {
      return NextResponse.json({ error: "Risk assessment not found." }, { status: 404 });
    }

    await db.clinicalReview.upsert({
      where: { riskAssessmentId: id },
      update: {
        reviewerId: userId,
        reviewNotes: reviewNotes ?? null,
        isAdequate,
        retrainingSignal: retrainingSignal ?? false,
        reviewedAt: new Date(),
      },
      create: {
        riskAssessmentId: id,
        reviewerId: userId,
        reviewNotes: reviewNotes ?? null,
        isAdequate,
        retrainingSignal: retrainingSignal ?? false,
        reviewedAt: new Date(),
      },
    });

    // Also update the risk assessment log with review info
    await db.riskAssessmentLog.update({
      where: { id },
      data: {
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    await writeAuditLog("SAFETY.ESCALATION", userId, {
      riskAssessmentId: id,
      isAdequate,
      retrainingSignal,
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
