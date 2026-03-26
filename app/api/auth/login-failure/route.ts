import { NextRequest, NextResponse } from "next/server"

import { recordLoginFailure } from "@/lib/auth/auth-rate-limit"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim() : ""
  if (!email) {
    return NextResponse.json({ ok: true })
  }

  await recordLoginFailure(email)
  return NextResponse.json({ ok: true })
}
