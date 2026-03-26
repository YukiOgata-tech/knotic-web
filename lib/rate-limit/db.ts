/**
 * Supabase-backed rate limiting utilities.
 * State is stored in `rate_limit_buckets` and `auth_lockouts` tables,
 * ensuring consistency across all serverless instances.
 */
import { createAdminClient } from "@/lib/supabase/admin"

export type RateLimitResult = {
  allowed: boolean
  retryAfterSec: number
}

/**
 * Atomically increments the counter for `key` and checks it against `maxCount`
 * within a sliding window of `windowSeconds`.
 *
 * Fails open on DB errors (returns allowed: true) to avoid blocking
 * legitimate users when the database is temporarily unavailable.
 */
export async function dbCheckAndIncrement(
  key: string,
  maxCount: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("rate_limit_check", {
      p_key: key,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      console.error("[rate-limit] DB error in rate_limit_check", { key, error: error.message })
      return { allowed: true, retryAfterSec: 0 }
    }

    const count = data as number
    if (count > maxCount) {
      return { allowed: false, retryAfterSec: windowSeconds }
    }
    return { allowed: true, retryAfterSec: 0 }
  } catch (err) {
    console.error("[rate-limit] unexpected error", err)
    return { allowed: true, retryAfterSec: 0 }
  }
}
