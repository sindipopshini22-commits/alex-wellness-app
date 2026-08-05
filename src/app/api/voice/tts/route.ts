// /api/voice/tts — receives text, returns audio/mpeg from ElevenLabs if configured.
// Returns 501 with fallback flag otherwise so the client can use the browser TTS.

import { NextResponse } from "next/server";
import { synthesizeSpeechServer, ttsEnabled } from "@/lib/voice";
import { ttsSchema } from "@/lib/validation";
import { getVerifiedUserId, touchSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  if (!ttsEnabled) {
    return NextResponse.json({
      error: "Server TTS not configured. Use browser speechSynthesis fallback.",
      fallback: "browser"
    }, { status: 501 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = ttsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid text." }, { status: 400 });
  }

  try {
    const audio = await synthesizeSpeechServer(parsed.data.text);
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "TTS failed." }, { status: 500 });
  }
}
