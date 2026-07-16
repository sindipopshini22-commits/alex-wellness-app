// Alex — Shared Zod validation schemas for all API routes.
// Every user-facing input MUST be validated through these schemas before
// reaching Prisma or any business logic.

import { z } from "zod";

// ── Auth ───────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(254, "Email too long");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// ── Profile / Onboarding ──────────────────────────────────────────────

export const usernameSchema = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters")
  .max(30, "Username too long")
  .regex(/^[a-zA-Z0-9_ ]+$/, "Username can only contain letters, numbers, underscores, and spaces");

export const profileSchema = z.object({
  username: usernameSchema.optional().nullable(),
  age: z.number().int().min(13, "Must be at least 13").max(120, "Invalid age").optional(),
  sex: z.string().max(20).optional(),
  primaryFocus: z.string().max(50).optional(),
  // WHO-aligned dimensional fields
  currentExperience: z.string().max(100).optional().nullable(),
  hardestPart: z.string().max(100).optional().nullable(),
  supportSystem: z.string().max(100).optional().nullable(),
  hasProfessionalHelp: z.boolean().optional(),
  hasFeltThisWayBefore: z.boolean().optional(),
});

// ── Journal ────────────────────────────────────────────────────────────

export const MAX_JOURNAL_LENGTH = 10000;
export const MAX_TITLE_LENGTH = 200;

export const journalTitleSchema = z
  .string()
  .trim()
  .max(MAX_TITLE_LENGTH, "Title too long")
  .optional()
  .nullable();

export const journalContentSchema = z
  .string()
  .trim()
  .min(1, "Content cannot be empty")
  .max(MAX_JOURNAL_LENGTH, "Journal entry too long");

export const moodSchema = z
  .string()
  .trim()
  .max(20, "Mood label too long")
  .optional()
  .nullable();

export const createJournalSchema = z.object({
  title: journalTitleSchema,
  content: journalContentSchema,
  mood: moodSchema,
});

export const updateJournalSchema = z.object({
  title: journalTitleSchema,
  content: journalContentSchema.optional(),
  mood: moodSchema,
}).partial();

// ── Chat ───────────────────────────────────────────────────────────────

export const MAX_MESSAGE_LENGTH = 5000;

export const messageSchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(MAX_MESSAGE_LENGTH, "Message too long")
  // Strip null bytes and control characters (XSS prevention)
  .transform((s) => s.replace(/[\0\x08\x0B\x0C\x0E-\x1F]/g, ""));

const attachmentSchema = z.object({
  filename: z.string().max(255),
  filepath: z.string().max(500),
  mimeType: z.string().max(100),
  size: z.number().int().min(0).max(10 * 1024 * 1024),
});

export const chatMessageSchema = z.object({
  content: messageSchema,
  sessionId: z.string().uuid("Invalid session ID"),
  attachments: z.array(attachmentSchema).max(10).optional(),
});

export const interceptSchema = z.object({
  content: z.string().max(MAX_MESSAGE_LENGTH, "Message too long"),
});

// ── Classroom ──────────────────────────────────────────────────────────

export const classroomProgressSchema = z.object({
  moduleId: z.string().max(100),
  inputs: z.any().optional(),
  currentStep: z.number().int().min(0).optional(),
  isCompleted: z.boolean().optional(),
});

// ── Voice ──────────────────────────────────────────────────────────────

export const ttsSchema = z.object({
  text: z.string().trim().min(1).max(2000, "Text too long for TTS"),
});

// ── Report ─────────────────────────────────────────────────────────────

export const reportSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  reason: z.string().max(500).optional().nullable(),
});

// ── Chat Session ───────────────────────────────────────────────────────

export const sessionIdSchema = z.string().uuid("Invalid session ID");
