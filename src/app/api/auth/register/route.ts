// /api/auth/register — creates an email+password user.
// Returns the session cookie so the user is immediately logged in.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/session";
import { registerSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const err = parsed.error.flatten();
    return NextResponse.json({ error: err.fieldErrors.email?.[0] ?? err.fieldErrors.password?.[0] ?? "Invalid input." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  let existing;
  try {
    existing = await db.user.findUnique({ where: { email } });
  } catch {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  let user;
  try {
    user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        isAnonymous: false,
        hasCompletedOnboarding: false
      }
    });
  } catch {
    return NextResponse.json({ error: "Account creation failed." }, { status: 500 });
  }

  await setSessionCookie(user.id);

  void writeAuditLog("USER.REGISTER", user.id, { method: "password" });

  return NextResponse.json({ ok: true, userId: user.id });
}
