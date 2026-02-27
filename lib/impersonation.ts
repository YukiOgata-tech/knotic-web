import crypto from "node:crypto"

import { getSupabaseServerKey } from "@/lib/env"

export const IMPERSONATION_COOKIE_NAME = "knotic_impersonation"

type ImpersonationPayload = {
  tenantId: string
  actorUserId: string
  exp: number
}

function base64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url")
}

function unbase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8")
}

function sign(body: string) {
  return crypto
    .createHmac("sha256", getSupabaseServerKey())
    .update(body)
    .digest("base64url")
}

export function createImpersonationToken(payload: ImpersonationPayload) {
  const body = base64url(JSON.stringify(payload))
  const signature = sign(body)
  return `${body}.${signature}`
}

export function parseImpersonationToken(token: string | null | undefined): ImpersonationPayload | null {
  if (!token) return null
  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  const expected = sign(body)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null
  }

  try {
    const parsed = JSON.parse(unbase64url(body)) as ImpersonationPayload
    if (!parsed?.tenantId || !parsed?.actorUserId || !parsed?.exp) return null
    if (Date.now() >= parsed.exp * 1000) return null
    return parsed
  } catch {
    return null
  }
}
