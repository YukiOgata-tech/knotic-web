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

// Login: 10 attempts/min per IP, 40 attempts/hour per IP
const LOGIN_PER_MINUTE_IP = 10
const LOGIN_PER_HOUR_IP = 40

// Signup: 5 attempts/hour per IP, 3 attempts/hour per email
const SIGNUP_PER_HOUR_IP = 5
const SIGNUP_PER_HOUR_EMAIL = 3

const store = globalThis as typeof globalThis & {
  __knoticAuthRateLimit?: Map<string, Bucket>
}

const rateLimitMap = store.__knoticAuthRateLimit ?? new Map<string, Bucket>()
store.__knoticAuthRateLimit = rateLimitMap

function cleanupBucket(bucket: Bucket, now: number) {
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts <= WINDOW_HOUR_MS)
}

function fingerprint(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function checkAndConsume(key: string, max: number, windowMs: number, now: number): RateLimitResult {
  const bucket = rateLimitMap.get(key) ?? { timestamps: [] }
  cleanupBucket(bucket, now)

  const within = bucket.timestamps.filter((ts) => now - ts <= windowMs)
  if (within.length >= max) {
    const oldest = within[0] ?? now
    const retryAfterMs = windowMs - (now - oldest)
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
  }

  bucket.timestamps.push(now)
  rateLimitMap.set(key, bucket)
  return { allowed: true, retryAfterSec: 0 }
}

export function applyLoginRateLimit(input: { ip: string }): RateLimitResult {
  const now = Date.now()

  const perMinResult = checkAndConsume(`login:ip:min:${input.ip}`, LOGIN_PER_MINUTE_IP, WINDOW_MINUTE_MS, now)
  if (!perMinResult.allowed) return perMinResult

  return checkAndConsume(`login:ip:hr:${input.ip}`, LOGIN_PER_HOUR_IP, WINDOW_HOUR_MS, now)
}

export function applySignupRateLimit(input: { ip: string; email: string }): RateLimitResult {
  const now = Date.now()

  const ipResult = checkAndConsume(`signup:ip:hr:${input.ip}`, SIGNUP_PER_HOUR_IP, WINDOW_HOUR_MS, now)
  if (!ipResult.allowed) return ipResult

  if (input.email) {
    const emailKey = `signup:email:hr:${fingerprint(input.email.toLowerCase())}`
    return checkAndConsume(emailKey, SIGNUP_PER_HOUR_EMAIL, WINDOW_HOUR_MS, now)
  }

  return { allowed: true, retryAfterSec: 0 }
}
