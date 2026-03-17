import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { applyLoginRateLimit, applySignupRateLimit } from "@/lib/auth/auth-rate-limit"

const SCHEMA = z.object({
  action: z.enum(["login", "signup"]),
  honeypot: z.string().optional().default(""),
  startedAt: z.number().int().positive(),
  email: z.string().max(160).optional().default(""),
})

// Minimum elapsed time to distinguish bots from humans
const MIN_ELAPSED_LOGIN_MS = 1000
const MIN_ELAPSED_SIGNUP_MS = 2000
const MAX_ELAPSED_MS = 3 * 60 * 60 * 1000 // 3 hours

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") ?? "unknown"
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = SCHEMA.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const { action, honeypot, startedAt, email } = parsed.data
  const now = Date.now()

  // Honeypot: silently block — don't reveal detection to bots
  if (honeypot.trim() !== "") {
    return NextResponse.json({ ok: true, blocked: true })
  }

  // Timing check: too fast means automated, too old means stale page
  const elapsedMs = now - startedAt
  const minElapsed = action === "login" ? MIN_ELAPSED_LOGIN_MS : MIN_ELAPSED_SIGNUP_MS
  if (elapsedMs < minElapsed || elapsedMs > MAX_ELAPSED_MS) {
    return NextResponse.json({ ok: true, blocked: true })
  }

  const ip = getClientIp(request)

  if (action === "login") {
    const rate = applyLoginRateLimit({ ip })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      )
    }
  } else {
    const rate = applySignupRateLimit({ ip, email })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      )
    }
  }

  return NextResponse.json({ ok: true })
}
