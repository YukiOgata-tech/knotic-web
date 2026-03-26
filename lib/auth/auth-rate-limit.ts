import crypto from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { dbCheckAndIncrement, type RateLimitResult } from "@/lib/rate-limit/db"

export type { RateLimitResult }

function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex")
}

// Login: 10 attempts/min per IP, 40 attempts/hour per IP
export async function applyLoginRateLimit(input: { ip: string }): Promise<RateLimitResult> {
  const perMin = await dbCheckAndIncrement(`login:ip:min:${input.ip}`, 10, 60)
  if (!perMin.allowed) return perMin
  return dbCheckAndIncrement(`login:ip:hr:${input.ip}`, 40, 3600)
}

// Signup: 5 attempts/hour per IP, 3 attempts/hour per email
export async function applySignupRateLimit(input: { ip: string; email: string }): Promise<RateLimitResult> {
  const ipResult = await dbCheckAndIncrement(`signup:ip:hr:${input.ip}`, 5, 3600)
  if (!ipResult.allowed) return ipResult
  if (input.email) {
    return dbCheckAndIncrement(`signup:email:hr:${hashEmail(input.email)}`, 3, 3600)
  }
  return { allowed: true, retryAfterSec: 0 }
}

// Check whether an email is currently locked out
export async function checkLoginLockout(email: string): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("auth_lockouts")
      .select("locked_until")
      .eq("email_hash", hashEmail(email))
      .maybeSingle()

    if (error || !data?.locked_until) return { allowed: true, retryAfterSec: 0 }

    const lockedUntil = new Date(data.locked_until).getTime()
    const now = Date.now()
    if (lockedUntil > now) {
      return { allowed: false, retryAfterSec: Math.ceil((lockedUntil - now) / 1000) }
    }
    return { allowed: true, retryAfterSec: 0 }
  } catch {
    return { allowed: true, retryAfterSec: 0 }
  }
}

// Record a failed login attempt; applies lockout thresholds via DB function
export async function recordLoginFailure(email: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.rpc("auth_record_login_failure", { p_email_hash: hashEmail(email) })
  } catch (err) {
    console.error("[auth-rate-limit] failed to record login failure", err)
  }
}

// Clear lockout on successful login
export async function clearLoginLockout(email: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from("auth_lockouts").delete().eq("email_hash", hashEmail(email))
  } catch {
    // Non-critical: ignore errors
  }
}
