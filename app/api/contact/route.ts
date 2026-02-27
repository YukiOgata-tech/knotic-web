import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { applyContactRateLimit } from "@/lib/email/contact-rate-limit"
import { sendContactMail } from "@/lib/email/resend"

const CONTACT_SCHEMA = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  company: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(20).max(4000),
  honeypot: z.string().optional().default(""),
  startedAt: z.number().int().positive(),
  pageUrl: z.string().url().max(500).optional(),
})

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}

function sameOriginAllowed(request: NextRequest) {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const host = request.headers.get("host")
  if (!host) return false

  const allowedOrigin = `https://${host}`
  const allowedOriginHttp = `http://${host}`

  const originOk = !origin || origin === allowedOrigin || origin === allowedOriginHttp
  const refererOk = !referer || referer.startsWith(allowedOrigin) || referer.startsWith(allowedOriginHttp)
  return originOk && refererOk
}

function looksSpamMessage(message: string) {
  const lower = message.toLowerCase()
  const urlMatches = lower.match(/https?:\/\//g)
  const urlCount = urlMatches?.length ?? 0
  const repeated = /(.)\1{6,}/.test(lower)
  return urlCount > 5 || repeated
}

export async function POST(request: NextRequest) {
  if (!sameOriginAllowed(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = CONTACT_SCHEMA.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const input = parsed.data
  const now = Date.now()

  if (input.honeypot.trim() !== "") {
    return NextResponse.json({ ok: true })
  }

  const elapsedMs = now - input.startedAt
  if (elapsedMs < 3000 || elapsedMs > 2 * 60 * 60 * 1000) {
    return NextResponse.json({ ok: true })
  }

  if (looksSpamMessage(input.message)) {
    return NextResponse.json({ ok: true })
  }

  const ip = getClientIp(request)
  const rate = applyContactRateLimit({ ip, email: input.email })
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSec),
        },
      }
    )
  }

  const userAgent = request.headers.get("user-agent") ?? "unknown"

  try {
    await sendContactMail({
      fromName: input.name,
      fromEmail: input.email,
      company: input.company,
      message: input.message,
      ip,
      userAgent,
      pageUrl: input.pageUrl,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[contact] send failed", error)
    return NextResponse.json({ error: "send_failed" }, { status: 500 })
  }
}
