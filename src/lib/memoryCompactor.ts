// Alex — long-term memory compactor.
// When a session crosses 15 messages, summarize the oldest slice and persist
// the running summary + biographical facts into LongTermMemoryBank. Then
// delete the compacted messages from the audit log to keep the working set
// small.

import { db } from "@/lib/db";
import { callLlm } from "@/lib/llm";

export async function compactChatContextWindow(sessionId: string) {
  try {
    const totalMessages = await db.chatMessage.count({ where: { sessionId } });
    if (totalMessages < 15) return;

    const allMessages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" }
    });

    const messagesToCompact = allMessages.slice(0, allMessages.length - 4);
    const transcript = messagesToCompact
      .map(m => `${m.sender}: ${m.content}`)
      .join("\n");

    const compressionPrompt = `Analyze the transcript between a user and their AI wellness companion.
Return strict JSON: {"summary": string, "biography": string[]}.
- "summary" <= 3 sentences tracking core emotional themes and persistent issues.
- "biography" is an array of short biographical facts mentioned (hobbies, names, pets, jobs, etc). Deduplicate against any facts you already know.

Transcript:
${transcript}`;

    const raw = await callLlm(compressionPrompt, true);
    let parsed: { summary?: string; biography?: string[] } = {};
    try { parsed = JSON.parse(raw); } catch { /* stub returned non-JSON */ }
    const newFacts: string[] = Array.isArray(parsed.biography) ? parsed.biography : [];

    const existing = await db.longTermMemoryBank.findUnique({ where: { sessionId } });
    const mergedFacts = Array.from(new Set([...(existing?.extractedFacts ?? []), ...newFacts]));

    await db.longTermMemoryBank.upsert({
      where: { sessionId },
      update: {
        runningSummary: parsed.summary ?? existing?.runningSummary ?? "",
        extractedFacts: mergedFacts
      },
      create: {
        sessionId,
        runningSummary: parsed.summary ?? "",
        extractedFacts: mergedFacts
      }
    });

    const ids = messagesToCompact.map(m => m.id);
    await db.chatMessage.deleteMany({ where: { id: { in: ids } } });
  } catch (e) {
    // Compaction is best-effort. Never break a chat over it.
    console.error("[memory] compaction failed", e);
  }
}
