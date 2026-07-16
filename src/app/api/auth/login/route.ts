// /api/auth/login — verifies email+password and sets the session cookie.
// If the user hasn't completed onboarding, they'll be redirected there.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = fieldErrors.email?.[0] ?? fieldErrors.password?.[0] ?? "Invalid email or password.";
    return NextResponse.json(
      { error: firstError },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  let user;
  try {
    user = await db.user.findUnique({ where: { email } });
  } catch {
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSessionCookie(user.id);

  void writeAuditLog("USER.LOGIN", user.id, { method: "password" });

  return NextResponse.json({ ok: true, userId: user.id, hasCompletedOnboarding: user.hasCompletedOnboarding });
}
