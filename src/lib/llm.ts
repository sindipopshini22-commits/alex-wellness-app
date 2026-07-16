// Provider-agnostic LLM wrapper.
// Uses Groq API (OpenAI-compatible) via the `openai` SDK.
// If GROQ_API_KEY is set, uses the Groq streaming API. Otherwise returns a
// stub response so the rest of the app (crisis interception, interventions,
// classroom, onboarding) can be developed and tested without a real key.
//
// Security: ALL prompts and chat turns are scrubbed of PII before being
// sent to the external API. This ensures email addresses, phone numbers,
// and other identifiers never leave our infrastructure.

import OpenAI from "openai";
import { scrubPii } from "@/lib/pii";

export type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

const apiKey = process.env.GROQ_API_KEY?.trim();
const isLive = !!apiKey && apiKey.length > 10 && apiKey !== "paste-your-key-here-then-restart-dev-server";

const groq = isLive
  ? new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

const MODEL = "llama-3.3-70b-versatile";

/** Strip PII from a string, returning the original if the result isn't a string. */
function stripPii(input: string): string {
  const scrubbed = scrubPii(input);
  return typeof scrubbed === "string" ? scrubbed : input;
}

export async function callLlm(prompt: string, jsonMode = false): Promise<string> {
  if (!groq) {
    return JSON.stringify({ summary: "User is exploring their thoughts in a smoke test.", biography: [] });
  }

  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 600,
    response_format: jsonMode ? { type: "json_object" } : undefined,
    messages: [{ role: "user", content: stripPii(prompt) }],
  });
  return res.choices[0].message.content ?? "";
}

// Minimal async-iterable shape compatible with our stream consumer.
type StreamChunk = { choices: { delta: { content?: string } }[] };

export function streamChatCompletion(turns: ChatTurn[]): AsyncIterable<StreamChunk> {
  if (!groq) {
    const text =
      "Hey. I'm Alex — and right now I'm running in offline stub mode, so what you see is canned text, not a real reply. " +
      "Drop a real GROQ_API_KEY into .env.local and restart the server, and I'll actually be useful. " +
      "For now, the safety net, the intervention cards, the classroom, and the account deletion are all real.";
    return (async function* () {
      for (const word of text.split(/(\s+)/)) {
        await new Promise((r) => setTimeout(r, 25));
        yield { choices: [{ delta: { content: word } }] };
      }
    })();
  }

  return (async function* () {
    // Strip PII from all turns before sending to external API
    const safeTurns = turns.map(t => ({
      ...t,
      content: stripPii(t.content),
    }));

    const stream = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      max_tokens: 700,
      stream: true,
      messages: safeTurns,
    });
    for await (const chunk of stream) {
      yield chunk as unknown as StreamChunk;
    }
  })();
}
