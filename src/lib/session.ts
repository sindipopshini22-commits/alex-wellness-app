// Session helpers: anonymous minting, password hashing, cookie setting.
//
// SECURITY: HMAC-Signed Session Tokens
// Instead of storing raw user UUIDs in cookies (which allows impersonation if
// a UUID is leaked), we store userId.HMAC(userId, SESSION_SECRET). On every
// request, the signature is verified before the userId is trusted.
//
// Using timingSafeEqual for HMAC comparison to prevent timing attacks.
// Using createHmac("sha256") — standard, fast, well-vetted.

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
// Using a generic duck-typed interface instead of the Next.js internal type
// to avoid breakage across Next.js versions.
interface CookieReader {
  get: (name: string) => { value?: string } | undefined;
}

// ── Session Secret ────────────────────────────────────────────────────
// In production, SESSION_SECRET must be set to a long, random string.
// Development fallback is acceptable because dev databases are local.
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production-must-be-at-least-32-chars";

// ── Token Signing & Verification ──────────────────────────────────────

/**
 * Sign a userId into a session token: userId.HMAC(userId, secret)
 * The HMAC prevents an attacker who obtains a raw UUID from forging a session.
 */
export function signSessionToken(userId: string): string {
  const hmac = createHmac("sha256", SESSION_SECRET)
    .update(userId)
    .digest("hex");
  return `${userId}.${hmac}`;
}

/**
 * Verify a signed session token and extract the userId.
 * Returns null if the token is invalid, tampered with, or malformed.
 * Uses timingSafeEqual to prevent timing side-channel attacks on HMAC comparison.
 */
function verifySessionToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const userId = token.slice(0, lastDot);
  const hmac = token.slice(lastDot + 1);
  if (!userId || !hmac) return null;

  const expected = createHmac("sha256", SESSION_SECRET)
    .update(userId)
    .digest("hex");

  try {
    // timingSafeEqual requires equal-length buffers
    const actualBuf = Buffer.from(hmac);
    const expectedBuf = Buffer.from(expected);
    if (actualBuf.length !== expectedBuf.length) return null;
    return timingSafeEqual(actualBuf, expectedBuf) ? userId : null;
  } catch {
    return null;
  }
}

/**
 * Read the session cookie, verify the HMAC signature, and return the userId.
 * This is the ONLY way routes should obtain the authenticated userId.
 * Replaces the pattern: cookieStore.get("alex_uid")?.value
 */
export async function getVerifiedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("alex_uid")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Verify a session token from a RequestCookies object (used in Edge middleware/proxy).
 */
export function verifySessionFromCookies(
  requestCookies: CookieReader
): string | null {
  const token = requestCookies.get("alex_uid")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// ── Anonymous Minting ─────────────────────────────────────────────────

export function mintAnonymousId() {
  return "anon_" + randomBytes(12).toString("hex");
}

export async function ensureAnonymousUser() {
  const id = mintAnonymousId();
  return db.user.create({
    data: { id, isAnonymous: true, hasCompletedOnboarding: false }
  });
}

// ── Password hashing (uses Node built-in scrypt) ──────────────────────────

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(derived, Buffer.from(hash, "hex"));
}

// ── Cookie setter (shared by anon + credential auth) ──────────────────────
//
// Security hardening:
// - HttpOnly: prevents JavaScript access (XSS mitigation)
// - SameSite=Strict: prevents CSRF attacks
// - Secure: only sent over HTTPS in production
// - maxAge=15min inactivity + 30d persistent (refresh on each page load via /api/auth/session)
// - path=/ ensures coverage across the app
// - HMAC-signed value: prevents UUID theft impersonation
export async function setSessionCookie(userId: string, remember = false) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const signed = signSessionToken(userId);
  cookieStore.set("alex_uid", signed, {
    httpOnly: true,
    sameSite: "strict",
    secure: isProd,
    path: "/",
    maxAge: remember
      ? 60 * 60 * 24 * 30  // 30 days with "remember me"
      : 60 * 15,            // 15 minutes session timeout
  });
}

/**
 * Extend the session on each authenticated request.
 * Call this at the top of every API route that requires auth.
 */
export async function touchSession(userId: string) {
  const cookieStore = await cookies();
  const existing = cookieStore.get("alex_uid");
  if (!existing) return;
  // Re-set the cookie with a fresh signature to extend the expiry
  const isProd = process.env.NODE_ENV === "production";
  const signed = signSessionToken(userId);
  cookieStore.set("alex_uid", signed, {
    httpOnly: true,
    sameSite: "strict",
    secure: isProd,
    path: "/",
    maxAge: 60 * 15, // 15 minutes sliding window
  });
}
