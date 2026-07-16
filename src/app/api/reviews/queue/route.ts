// /api/reviews/queue — returns risk assessments pending clinical review.
// Accessible to CLINICIAN and ADMIN roles only.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { hasPermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  // RBAC check: only CLINICIAN and ADMIN can view the review queue
  const canReview = await hasPermission(userId, "review:queue.read");
  if (!canReview) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let assessments;
  try {
    assessments = await db.riskAssessmentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load reviews." }, { status: 500 });
  }

  // Join with ClinicalReview to get review status
  const reviews = await db.clinicalReview.findMany({
    where: {
      riskAssessmentId: { in: assessments.map((a) => a.id) },
    },
  });

  const reviewMap = new Map(reviews.map((r) => [r.riskAssessmentId, r]));

  const items = assessments.map((a) => {
    const review = reviewMap.get(a.id);
    return {
      id: a.id,
      riskAssessmentId: a.id,
      sessionId: a.sessionId,
      overallRisk: a.overallRisk,
      mitigationAction: a.mitigationAction,
      createdAt: a.createdAt.toISOString(),
      reviewedAt: review?.reviewedAt?.toISOString() ?? null,
      reviewerId: review?.reviewerId ?? null,
      reviewNotes: review?.reviewNotes ?? null,
      isAdequate: review?.isAdequate ?? null,
      retrainingSignal: review?.retrainingSignal ?? false,
    };
  });

  void writeAuditLog("SAFETY.CLASSIFIER_RAN", userId, { count: items.length });

  return NextResponse.json(items);
}
