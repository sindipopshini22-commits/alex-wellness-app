// Voice: provider-agnostic STT + TTS.
// If DEEPGRAM_API_KEY / ELEVENLABS_API_KEY are present, uses those.
// Otherwise exposes browser-SpeechRecognition fallback on the client.

const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY?.trim();
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY?.trim();
const ELEVENLABS_VOICE = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

export const sttEnabled = !!DEEPGRAM_KEY && DEEPGRAM_KEY.length > 20;
export const ttsEnabled = !!ELEVENLABS_KEY && ELEVENLABS_KEY.length > 20;

export async function transcribeAudioServer(audio: Buffer, mimeType = "audio/webm"): Promise<string> {
  if (!sttEnabled) throw new Error("DEEPGRAM_API_KEY not configured");
  // Minimal Deepgram REST call. Audio is processed but not stored.
  const { DeepgramClient } = await import("@deepgram/sdk");
  const client = new DeepgramClient({ apiKey: DEEPGRAM_KEY! });
  // @ts-expect-error — Deepgram v5 SDK types don't expose the full listen.v1.media.transcribeFile signature; use snake_case options.
  const { result, error } = await client.listen.v1.media.transcribeFile(audio, {
    model: "nova-2",
    smart_format: true
  });
  if (error) throw new Error(error.message);
  return result.results.channels[0].alternatives[0].transcript ?? "";
}

export async function synthesizeSpeechServer(text: string): Promise<Buffer> {
  if (!ttsEnabled) throw new Error("ELEVENLABS_API_KEY not configured");
  // ElevenLabs REST TTS. Audio is generated, streamed to client, never stored.
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_KEY!,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    })
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
