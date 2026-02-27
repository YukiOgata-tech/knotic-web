import crypto from "node:crypto"

type Bucket = {
  timestamps: number[]
}

type RateLimitResult = {
  allowed: boolean
  retryAfterSec: number
}

const WINDOW_MINUTE_MS = 60 * 1000
const WINDOW_HOUR_MS = 60 * 60 * 1000
const MAX_PER_MINUTE = 2
const MAX_PER_HOUR = 5

const store = globalThis as typeof globalThis & {
  __knoticContactRateLimit?: Map<string, Bucket>
}

const rateLimitMap = store.__knoticContactRateLimit ?? new Map<string, Bucket>()
store.__knoticContactRateLimit = rateLimitMap

function cleanupBucket(bucket: Bucket, now: number) {
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts <= WINDOW_HOUR_MS)
}

function fingerprint(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function checkAndConsume(key: string, now: number): RateLimitResult {
  const bucket = rateLimitMap.get(key) ?? { timestamps: [] }
  cleanupBucket(bucket, now)

  const minuteCount = bucket.timestamps.filter((ts) => now - ts <= WINDOW_MINUTE_MS).length
  const hourCount = bucket.timestamps.length

  if (minuteCount >= MAX_PER_MINUTE) {
    const last = bucket.timestamps[bucket.timestamps.length - 1] ?? now
    const retryAfterMs = WINDOW_MINUTE_MS - (now - last)
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
  }

  if (hourCount >= MAX_PER_HOUR) {
    const oldestWithinHour = bucket.timestamps[0] ?? now
    const retryAfterMs = WINDOW_HOUR_MS - (now - oldestWithinHour)
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
  }

  bucket.timestamps.push(now)
  rateLimitMap.set(key, bucket)
  return { allowed: true, retryAfterSec: 0 }
}

export function applyContactRateLimit(input: { ip: string; email: string }) {
  const now = Date.now()
  const ipKey = `ip:${input.ip}`
  const emailKey = `email:${fingerprint(input.email.toLowerCase())}`

  const ipResult = checkAndConsume(ipKey, now)
  if (!ipResult.allowed) return ipResult

  const emailResult = checkAndConsume(emailKey, now)
  if (!emailResult.allowed) return emailResult

  return { allowed: true, retryAfterSec: 0 }
}
