// /api/chat/upload — accepts file attachments for chat messages.
//
// Accepts multipart/form-data with:
//   - sessionId: string (UUID)
//   - file: File (image/*, max 10MB)
//
// Returns:
//   { url: string, filename: string, mimeType: string, size: number, attachmentId: string }
//
// Files are stored in public/uploads/{sessionId}/ and served statically.

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { getVerifiedUserId, touchSession } from "@/lib/session";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "application/pdf",
  "text/plain",
];

export async function POST(req: Request) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });
  void touchSession(userId);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const sessionId = form.get("sessionId") as string | null;
  const file = form.get("file") as File | null;

  if (!sessionId || !file) {
    return NextResponse.json({ error: "Missing sessionId or file" }, { status: 400 });
  }

  // Validate session ownership
  try {
    const session = await db.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type ${file.type} is not supported. Allowed: images, PDF, text.` },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 400 }
    );
  }

  // Validate filename (prevent path traversal)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${randomUUID()}-${safeName}`;
  const sessionDir = join(process.cwd(), "public", "uploads", sessionId);
  const filePath = join(sessionDir, uniqueName);
  const publicPath = `/uploads/${sessionId}/${uniqueName}`;

  try {
    await mkdir(sessionDir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);
  } catch (e) {
    console.error("[upload] Failed to save file:", e);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }

  return NextResponse.json({
    url: publicPath,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  });
}
