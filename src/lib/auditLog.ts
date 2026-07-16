// Alex — Immutable audit log.
//
// Tracks who accessed what data and when. Log entries are append-only:
// we never update or delete them. They have their own database connection
// (via the same Prisma client but a separate table) to keep them
// independent of application data deletion.
//
// The audit log is used for:
//   - Security incident investigation
//   - Regulatory compliance (GDPR Art. 5(2) accountability)
//   - Clinical review sampling transparency
//   - Break-glass access tracking

import { db } from "@/lib/db";

export type AuditAction =
  // Data access
  | "USER.EXPORT"
  | "USER.LOGIN"
  | "USER.REGISTER"
  | "USER.DELETE"
  | "USER.ANON_CREATE"
  // Profile
  | "PROFILE.CREATE"
  | "PROFILE.UPDATE"
  // Journal
  | "JOURNAL.CREATE"
  | "JOURNAL.READ"
  | "JOURNAL.UPDATE"
  | "JOURNAL.DELETE"
  // Chat
  | "CHAT.MESSAGE_SENT"
  | "CHAT.SESSION_CREATED"
  | "CHAT.HISTORY_READ"
  | "CHAT.REPORT"
  // Sessions
  | "SESSIONS.LIST"
  | "SESSIONS.MESSAGES_READ"
  // Safety
  | "SAFETY.CLASSIFIER_RAN"
  | "SAFETY.RISK_DETECTED"
  | "SAFETY.ESCALATION"
  // Legal
  | "LEGAL.EULA_ACCEPT"
  | "LEGAL.EULA_CHECK"
  // Classroom
  | "CLASSROOM.PROGRESS_SAVE"
  // Settings
  | "SETTINGS.PROFILE_UPDATE"
  // Crisis
  | "CRISIS.INTERCEPT"
  | "CRISIS.HUMAN_ESCALATION"
  // Voice
  | "VOICE.STT"
  | "VOICE.TTS";

/**
 * Write an immutable audit log entry.
 *
 * Design decisions:
 * - Entries are never updated or deleted (append-only).
 * - The table is separate from application data so user deletion doesn't
 *   wipe the audit trail.
 * - `actorId` is the authenticated user ID, or "system" for automated actions.
 * - `targetId` is the resource being accessed (optional).
 * - `metadata` stores action-specific details as JSON.
 *
 * This function is fire-and-forget safe — failures are logged to stderr
 * but never throw, so a broken audit log never breaks the application.
 */
export async function writeAuditLog(
  action: AuditAction,
  actorId: string,
  metadata: Record<string, unknown> = {},
  targetId?: string
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId,
        action,
        targetId: targetId ?? null,
        metadata: metadata as any,
        ipAddress: (metadata.ipAddress as string) ?? null,
      },
    });
  } catch (e) {
    // Audit logging must never break the application.
    // In production, this should also go to a remote logging service.
    console.error("[audit] Failed to write audit log:", e);
  }
}

/**
 * Query the audit log for a specific actor or action.
 * Returns the most recent entries first.
 *
 * Only callable from server-side admin/clinical review code.
 */
export async function queryAuditLog(opts: {
  actorId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  if (opts.actorId) where.actorId = opts.actorId;
  if (opts.action) where.action = opts.action;

  return db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    skip: opts.offset ?? 0,
  });
}
