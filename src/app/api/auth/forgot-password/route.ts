// /api/auth/forgot-password — generates a password reset token and sends a
// reset link to the user's email (or logs it in development mode).
//
// Security:
// - Always returns 200 even if the email doesn't exist (prevent email enumeration)
// - Token is a random 64-byte hex string (unguessable)
// - Token expires after 1 hour
// - Token is single-use (deleted after successful reset)

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { emailSchema } from "@/lib/validation";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = emailSchema.safeParse(body.email);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const email = parsed.data;

  // Always return 200 to prevent email enumeration attacks.
  // Whether the email exists or not, the user sees the same response.
  try {
    const user = await db.user.findUnique({ where: { email } });

    if (user && !user.isAnonymous) {
      // Generate a secure random token
      const token = randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store the token and expiry on the user record
      await db.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const resetLink = `${APP_URL}/reset-password?token=${token}`;

      // Try to send via Resend if configured
      if (RESEND_API_KEY) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Alex <noreply@yourdomain.com>",
              to: email,
              subject: "Reset your Alex password",
              html: `
                <p>Hi there,</p>
                <p>You requested a password reset for your Alex account.</p>
                <p><a href="${resetLink}">Click here to reset your password</a></p>
                <p>This link expires in 1 hour.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
              `,
            }),
          });
          if (!res.ok) {
            console.error("[forgot-password] Resend API error:", await res.text());
          }
        } catch (e) {
          console.error("[forgot-password] Failed to send email:", e);
        }
      } else {
        // Dev mode: log the reset link to console
        console.log("========================================");
        console.log("  PASSWORD RESET LINK (dev mode)");
        console.log(`  ${resetLink}`);
        console.log("========================================");
      }
    }
  } catch {
    // Swallow errors — don't reveal whether the email exists
  }

  return NextResponse.json({
    ok: true,
    message: "If that email is registered, you'll receive a reset link shortly.",
  });
}
