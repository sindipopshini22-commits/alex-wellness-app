/**
 * Shared types for Alex Wellness Platform
 */

// ── Auth ───────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  userId: string;
  hasCompletedOnboarding: boolean;
}

export interface ApiError {
  error: string;
}

// ── Chat ───────────────────────────────────────────────────────────────

export interface ChatRequest {
  content: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
}

// ── Profile / Onboarding ──────────────────────────────────────────────

export interface ProfileRequest {
  username?: string | null;
  age?: number;
  sex?: string;
  primaryFocus?: string;
  currentExperience?: string | null;
  hardestPart?: string | null;
  supportSystem?: string | null;
  hasProfessionalHelp?: boolean;
  hasFeltThisWayBefore?: boolean;
}

export interface ProfileResponse {
  ok: boolean;
}

// ── Session ────────────────────────────────────────────────────────────

export interface SessionResponse {
  id: string;
  createdAt: string;
}
