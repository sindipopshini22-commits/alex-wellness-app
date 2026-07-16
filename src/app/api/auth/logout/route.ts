// /api/auth/logout — clears the session cookie and redirects to the landing page.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("alex_uid");

  return NextResponse.json({ ok: true });
}
