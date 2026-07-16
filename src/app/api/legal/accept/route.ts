// /api/legal/accept — records the user's acceptance of the current EULA.
// Auditable trail per Apple Guideline 5.1.1.

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { EULA_VERSION } from "@/lib/eula";
import { getVerifiedUserId, touchSession } from "@/lib/session";

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);

  await db.legalAcceptance.create({
    data: {
      userId,
      documentType: "EULA",
      version: EULA_VERSION,
      ipHash
    }
  });

  return NextResponse.json({ ok: true, version: EULA_VERSION });
}

export async function GET() {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  const acceptance = await db.legalAcceptance.findFirst({
    where: { userId, documentType: "EULA" },
    orderBy: { acceptedAt: "desc" }
  });

  return NextResponse.json({
    currentVersion: EULA_VERSION,
    hasAcceptedCurrent: acceptance?.version === EULA_VERSION,
    lastAcceptedVersion: acceptance?.version ?? null,
    lastAcceptedAt: acceptance?.acceptedAt ?? null
  });
}
