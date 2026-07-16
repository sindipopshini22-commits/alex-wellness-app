// /api/auth/reset-password — verifies a reset token and updates the user's password.
//
// Security:
// - Token must exist and not be expired (1 hour window)
// - Token is single-use (deleted after successful reset)
// - New password must pass Zod validation (min 8 chars)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/session";
import { passwordSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, password } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid reset token." }, { status: 400 });
  }

  // Validate password format
  const parsedPw = passwordSchema.safeParse(password);
  if (!parsedPw.success) {
    const err = parsedPw.error.flatten().formErrors[0] ?? "Password must be at least 8 characters.";
    return NextResponse.json({ error: err }, { status: 400 });
  }

  try {
    // Find user by reset token
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update password and clear the reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(parsedPw.data),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    void writeAuditLog("USER.LOGIN", user.id, { method: "password-reset" });

    return NextResponse.json({
      ok: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch {
    return NextResponse.json({ error: "Password reset failed. Please try again." }, { status: 500 });
  }
}
