// /api/auth/google — Google OAuth sign-in handler.
//
// Flow:
// 1. GET with no params → redirects user to Google's OAuth consent screen
// 2. After consent, Google redirects to this same endpoint with ?code=...
// 3. The server exchanges the code for tokens, verifies the ID token,
//    finds or creates the user, sets the alex_uid cookie, and redirects
//    to dashboard or onboarding.
//
// Environment variables required:
//   GOOGLE_CLIENT_ID     — from Google Cloud Console
//   GOOGLE_CLIENT_SECRET — from Google Cloud Console
//   NEXTAUTH_URL         — your app's public URL (e.g. http://localhost:3000)

import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { signSessionToken } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

// Token exchange + DB lookups can exceed the default limit.
export const maxDuration = 60;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/google`;
const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Step 1: No code yet — redirect to Google's consent screen
  if (!code) {
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file." },
        { status: 501 }
      );
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return NextResponse.redirect(authUrl.toString());
  }

  // Step 2: We have a code — exchange it for tokens
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google sign-in is not configured." },
      { status: 501 }
    );
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      return NextResponse.json({ error: "Failed to get ID token from Google." }, { status: 400 });
    }

    // Verify the ID token and extract user info
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Could not retrieve email from Google account." }, { status: 400 });
    }

    // Find or create user by email
    let user = await db.user.findUnique({ where: { email: payload.email } });

    if (user) {
      // Existing user — check if they were anonymous and upgrade
      if (user.isAnonymous) {
        user = await db.user.update({
          where: { id: user.id },
          data: { isAnonymous: false },
        });
      }
    } else {
      // New user — create account
      user = await db.user.create({
        data: {
          email: payload.email,
          isAnonymous: false,
          hasCompletedOnboarding: false,
        },
      });

      // If Google returned a name, create a profile with it
      if (payload.name) {
        await db.userProfile.upsert({
          where: { userId: user.id },
          update: { username: payload.name },
          create: {
            userId: user.id,
            username: payload.name,
            age: 25,
            sex: "",
            primaryFocus: "",
          },
        });
      }
    }

    void writeAuditLog("USER.LOGIN", user.id, { method: "google" });

    // Set the session cookie directly on the redirect response.
    // Using `setSessionCookie()` wouldn't work here because it modifies the
    // current request's response, but NextResponse.redirect() creates a new one.
    const redirectTo = user.hasCompletedOnboarding ? "/dashboard" : "/onboarding";
    const response = NextResponse.redirect(new URL(redirectTo, req.url));
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("alex_uid", signSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax", // Lax allows cookies on OAuth redirects from Google
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;

  } catch (e: any) {
    // Dump the FULL error structure to find where Google's response body is
    console.error('[google-auth] ===== FULL ERROR DUMP =====');
    console.error('  constructor:', e?.constructor?.name);
    console.error('  code:', e?.code);
    console.error('  status:', e?.status);
    console.error('  message:', e?.message);
    console.error('  response keys:', e?.response ? Object.keys(e.response) : 'NO_RESPONSE');
    console.error('  response.status:', e?.response?.status);
    console.error('  response.statusText:', e?.response?.statusText);
    console.error('  response.data type:', typeof e?.response?.data);
    try { console.error('  response.data:', JSON.stringify(e?.response?.data ?? null)); } catch (s) { console.error('  response.data: [circular]'); }
    console.error('  response.body:', e?.response?.body?.toString?.() ?? 'N/A');
    try { console.error('  config:', JSON.stringify(e?.config ?? null)); } catch (s) { console.error('  config: [circular]'); }
    console.error('  errors:', JSON.stringify(e?.errors ?? null));
    // Try to log any enumerable properties
    try { console.error('  all keys:', Object.keys(e)); } catch {}
    console.error('[google-auth] ===== END DUMP =====');

    return NextResponse.json(
      {
        error: 'Google sign-in failed.',
        detail: process.env.NODE_ENV === 'development' ? e?.message : 'Check server logs for details.',
      },
      { status: 500 }
    );
  }
}
