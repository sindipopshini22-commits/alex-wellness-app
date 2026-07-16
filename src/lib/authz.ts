// Alex — Role-Based Access Control (RBAC) authorization.
//
// Implements the Principle of Least Privilege:
// - PATIENT: can only access their own data
// - CLINICIAN: can access assigned reviews + review queue
// - ADMIN: full access to audit logs, reviews, user management

import { db } from "@/lib/db";

// UserRole type matching Prisma enum without direct import dependency
// (Prisma generates this at build time; this reference ensures type safety)
export type UserRole = "PATIENT" | "CLINICIAN" | "ADMIN";
export const UserRoles = {
  PATIENT: "PATIENT" as UserRole,
  CLINICIAN: "CLINICIAN" as UserRole,
  ADMIN: "ADMIN" as UserRole,
} as const;

// ── Permission Checks ─────────────────────────────────────────────────

export type Permission =
  | "user:self.export"
  | "user:self.delete"
  | "user:self.read"
  | "profile:self.upsert"
  | "journal:self.read"
  | "journal:self.create"
  | "journal:self.update"
  | "journal:self.delete"
  | "chat:self.create"
  | "chat:self.read"
  | "chat:self.report"
  | "classroom:self.progress"
  | "legal:self.accept"
  | "voice:self.stt"
  | "voice:self.tts"
  // Clinician permissions
  | "review:queue.read"
  | "review:assigned.read"
  | "review:submit"
  // Admin permissions
  | "audit:log.read"
  | "users:list"
  | "users:manage"
  | "settings:system";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PATIENT: [
    "user:self.export",
    "user:self.delete",
    "user:self.read",
    "profile:self.upsert",
    "journal:self.read",
    "journal:self.create",
    "journal:self.update",
    "journal:self.delete",
    "chat:self.create",
    "chat:self.read",
    "chat:self.report",
    "classroom:self.progress",
    "legal:self.accept",
    "voice:self.stt",
    "voice:self.tts",
  ],
  CLINICIAN: [
    // All patient permissions
    "user:self.export",
    "user:self.delete",
    "user:self.read",
    "profile:self.upsert",
    "journal:self.read",
    "journal:self.create",
    "journal:self.update",
    "journal:self.delete",
    "chat:self.create",
    "chat:self.read",
    "chat:self.report",
    "classroom:self.progress",
    "legal:self.accept",
    "voice:self.stt",
    "voice:self.tts",
    // Clinician-specific permissions
    "review:queue.read",
    "review:assigned.read",
    "review:submit",
  ],
  ADMIN: [
    "user:self.export",
    "user:self.delete",
    "user:self.read",
    "profile:self.upsert",
    "journal:self.read",
    "journal:self.create",
    "journal:self.update",
    "journal:self.delete",
    "chat:self.create",
    "chat:self.read",
    "chat:self.report",
    "classroom:self.progress",
    "legal:self.accept",
    "voice:self.stt",
    "voice:self.tts",
    "review:queue.read",
    "review:assigned.read",
    "review:submit",
    "audit:log.read",
    "users:list",
    "users:manage",
    "settings:system",
  ],
};

/**
 * Check if a user has a specific permission.
 * Fetches the user's role from the database.
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  } catch {
    return false; // Fail closed — deny on error
  }
}

/**
 * Require a specific permission. Throws if not authorized.
 * Use in API routes: `await requirePermission(userId, "journal:self.read")`
 */
export async function requirePermission(
  userId: string,
  permission: Permission
): Promise<void> {
  const allowed = await hasPermission(userId, permission);
  if (!allowed) {
    throw new Error("Forbidden");
  }
}

/**
 * Verify resource ownership. A user can access a resource if:
 * 1. They own it (userId matches resource.creatorId), OR
 * 2. They have a higher-level permission (e.g., CLINICIAN or ADMIN)
 *
 * Returns true if authorized.
 */
export async function verifyOwnership(
  userId: string,
  resourceUserId: string,
  scopedPermission: Permission,
  adminOverride?: Permission
): Promise<boolean> {
  // Direct ownership
  if (userId === resourceUserId) {
    return hasPermission(userId, scopedPermission);
  }

  // Admin/clinician override
  if (adminOverride) {
    return hasPermission(userId, adminOverride);
  }

  return false;
}
