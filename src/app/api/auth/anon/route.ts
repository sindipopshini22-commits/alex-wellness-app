// /api/auth/anon — mints an anonymous user and stores their id in a cookie.

import { NextResponse } from "next/server";
import { ensureAnonymousUser, setSessionCookie } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  // Rate limit anonymous session creation per IP to prevent cycling attacks.
  // An attacker could otherwise create unlimited sessions to bypass
  // per-user rate limits on other endpoints.
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anon-create";
  const rl = await enforceRateLimit(`anon-create:${ip}`, "ip");
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  let user;
  try {
    user = await ensureAnonymousUser();
  } catch {
    return NextResponse.json({ error: "Session creation failed." }, { status: 500 });
  }

  // Anonymous sessions: 24-hour expiry (users can't re-authenticate)
  await setSessionCookie(user.id, true);

  void writeAuditLog("USER.ANON_CREATE", user.id);

  return NextResponse.json({ ok: true, userId: user.id });
}
