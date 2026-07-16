// /api/voice/stt — receives an audio blob, transcribes via Deepgram if configured,
// otherwise returns an error so the client falls back to browser SpeechRecognition.
// Audio is never stored.

import { NextResponse } from "next/server";
import { transcribeAudioServer, sttEnabled } from "@/lib/voice";
import { evaluateMessagePayload } from "@/lib/safetyInterceptor";
import { getVerifiedUserId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });

  if (!sttEnabled) {
    return NextResponse.json({
      error: "Server STT not configured. Use browser SpeechRecognition fallback.",
      fallback: "browser"
    }, { status: 501 });
  }

  try {
    const form = await req.formData();
    const file = form.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "No audio" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const transcript = await transcribeAudioServer(buf, file.type);

    // Pre-screen the transcript through the same safety net
    const gate = await evaluateMessagePayload(transcript);

    return NextResponse.json({
      transcript,
      intercepted: gate.type !== "STANDARD" ? gate : null
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "STT failed" }, { status: 500 });
  }
}
