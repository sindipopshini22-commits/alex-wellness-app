// /api/chat/intercept — pre-screens a message for crisis / intervention patterns.
// The dashboard calls this BEFORE /api/chat so the UI can show the right card
// without consuming LLM tokens.
//
// Uses the independent Safety Classifier (D3) with C-SSRS-aligned risk
// assessment, then the Risk Mitigation Controller (D4) for graduated
// responses.

import { NextResponse } from "next/server";
import { evaluateMessagePayload } from "@/lib/safetyInterceptor";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getVerifiedUserId, touchSession } from "@/lib/session";
import { interceptSchema } from "@/lib/validation";

// Safety classifier makes a Groq LLM call — needs more than the 10s default.
export const maxDuration = 60;

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  const id = userId ?? "anon-ip";
  const rl = await enforceRateLimit(id, userId ? "user" : "ip");
  if (!rl.ok) return NextResponse.json({ error: "Slow down." }, { status: 429 });
  
  if (userId) void touchSession(userId);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = interceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }
  
  const result = await evaluateMessagePayload(parsed.data.content ?? "");
  
  if (result.type === "STANDARD") return NextResponse.json({ status: "clear" });
  
  return NextResponse.json({ status: "intercepted", ...result });
}
