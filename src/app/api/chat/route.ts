// /api/chat — streaming orchestrator.
//
// Architecture (matched to research-backed design):
// 1. Pre-screens the message via the independent safety classifier.
// 2. If intercepted, returns mitigation payload + writes audit row.
// 3. Otherwise loads context, retrieves RAG knowledge, builds persona.
// 4. Persists user message, streams LLM reply, writes assistant text.
// Security: Zod validates input, touchSession extends sliding window.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerifiedUserId } from "@/lib/session";
import { evaluateMessagePayload } from "@/lib/safetyInterceptor";
import { buildRagContext } from "@/lib/rag";
import { streamChatCompletion, ChatTurn } from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/persona";
import { compactChatContextWindow } from "@/lib/memoryCompactor";
import { touchSession } from "@/lib/session";
import { chatMessageSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });

  void touchSession(userId);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const { content, sessionId, attachments } = parsed.data;

  // ── Step 1: Verify session ownership ──
  try {
    const session = await db.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to verify session." }, { status: 500 });
  }

  // ── Step 2: Pre-screen via independent safety classifier (D3) ──
  const gate = await evaluateMessagePayload(content, { skipInterventionCards: true });

  if (gate.type === "CRISIS_ALERT" || gate.type === "HUMAN_ESCALATION" || gate.type === "CRISIS_RESOURCES") {
    await db.chatMessage.create({
      data: {
        sessionId,
        sender: "BOT",
        content: gate.payload.message ?? "Your safety comes first.",
        customType: gate.type,
        payload: gate as any
      }
    });
    return NextResponse.json({ status: "intercepted", ...gate });
  }

  // ── Step 3: Load context ──
  let profile, memory, recent;
  try {
    [profile, memory, recent] = await Promise.all([
      db.userProfile.findUnique({ where: { userId } }),
      db.longTermMemoryBank.findUnique({ where: { sessionId } }),
      db.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);
  } catch {
    return NextResponse.json({ error: "Failed to load context." }, { status: 500 });
  }

  const rollingStream = recent
    .reverse()
    .map(m => `${m.sender === "USER" ? "User" : "Alex"}: ${m.content}`)
    .join("\n");

  // ── Step 4: RAG retrieval for clinical knowledge (D5) ──
  const ragContext = buildRagContext(content, 2);
  const ragBlock = ragContext.contextBlock;

  let constraintDirectives = "";
  if (gate.type === "CONSTRAINED") {
    constraintDirectives = [
      "\n\n--- MITIGATION CONSTRAINTS ---",
      "A risk signal was detected. Apply these constraints:",
      "- Do NOT explore or probe for more details about the risk-related content.",
      "- Keep responses brief, grounded, and supportive.",
      "- Do NOT attempt to diagnose or label what the user is experiencing.",
      "- If the user mentions medications, do NOT suggest changes.",
      gate.payload?.message ? `\nGentle check-in: ${gate.payload.message}` : "",
    ].filter(Boolean).join("\n");

    void db.riskAssessmentLog.create({
      data: {
        sessionId,
        overallRisk: "moderate",
        riskDetails: { source: "evaluateMessagePayload", gateType: gate.type },
        mitigationAction: "CONSTRAINED_RESPONSE",
      }
    }).catch(() => {});
  }

  const basePrompt = buildSystemPrompt({ profile, memory, rollingStream });
  const systemPrompt = [basePrompt, ragBlock, constraintDirectives]
    .filter(Boolean)
    .join("\n\n");

  const userMessage = await db.chatMessage.create({
    data: {
      sessionId,
      sender: "USER",
      content,
      attachments: attachments?.length
        ? { create: attachments.map((a: any) => ({
            filename: a.filename,
            filepath: a.filepath,
            mimeType: a.mimeType,
            size: a.size,
          })) }
        : undefined,
    },
    include: attachments?.length ? { attachments: true } : undefined,
  }).catch(() => {
    throw new Error("Failed to persist message");
  });

  const turns: ChatTurn[] = [
    { role: "system", content: systemPrompt },
    ...recent.reverse().map(m => ({
      role: (m.sender === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content
    })),
    { role: "user", content }
  ];

  const encoder = new TextEncoder();
  let assistantText = "";
  const stream = streamChatCompletion(turns);

  const transformed = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            assistantText += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
        await db.chatMessage.create({
          data: { sessionId, sender: "BOT", content: assistantText, customType: "STANDARD" }
        });
        controller.close();
        void compactChatContextWindow(sessionId);
      } catch (e) {
        controller.error(e);
      }
    }
  });

  return new Response(transformed, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
