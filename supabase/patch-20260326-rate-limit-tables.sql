-- Rate limiting tables (Supabase-backed, shared across all serverless instances)
-- Applied: 2026-03-26

-- ============================================================
-- 1. Tables
-- ============================================================

-- Generic sliding-window counter for IP / email rate limits
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key          TEXT        PRIMARY KEY,
  count        INTEGER     NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL
);

-- Consecutive login failure tracker for per-email lockout
CREATE TABLE IF NOT EXISTS auth_lockouts (
  email_hash   TEXT        PRIMARY KEY,
  fail_count   INTEGER     NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_fail_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service role bypasses RLS; no user-level policies needed
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_lockouts      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Functions
-- ============================================================

-- Atomically increments the counter for p_key within the window.
-- Returns the count after increment; caller compares against its limit.
-- If the window has expired the counter resets to 1.
CREATE OR REPLACE FUNCTION rate_limit_check(
  p_key            TEXT,
  p_window_seconds INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count  INTEGER;
  v_now    TIMESTAMPTZ := now();
  v_expiry TIMESTAMPTZ := v_now + (p_window_seconds || ' seconds')::INTERVAL;
BEGIN
  INSERT INTO rate_limit_buckets (key, count, window_start, expires_at)
  VALUES (p_key, 1, v_now, v_expiry)
  ON CONFLICT (key) DO UPDATE
    SET
      count        = CASE WHEN rate_limit_buckets.expires_at < v_now
                          THEN 1
                          ELSE rate_limit_buckets.count + 1 END,
      window_start = CASE WHEN rate_limit_buckets.expires_at < v_now
                          THEN v_now
                          ELSE rate_limit_buckets.window_start END,
      expires_at   = CASE WHEN rate_limit_buckets.expires_at < v_now
                          THEN v_expiry
                          ELSE rate_limit_buckets.expires_at END
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;

-- Records a failed login attempt for an email hash.
-- Applies lockout thresholds: 10 failures → 15 min, 20 failures → 60 min.
-- An expired lock is reset before counting the new failure.
-- Returns: { fail_count, locked_until }
CREATE OR REPLACE FUNCTION auth_record_login_failure(p_email_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_count    INTEGER;
  v_locked_until TIMESTAMPTZ;
  v_now          TIMESTAMPTZ := now();
BEGIN
  INSERT INTO auth_lockouts (email_hash, fail_count, locked_until, last_fail_at)
  VALUES (p_email_hash, 0, NULL, v_now)
  ON CONFLICT (email_hash) DO NOTHING;

  SELECT fail_count, locked_until
  INTO   v_new_count, v_locked_until
  FROM   auth_lockouts
  WHERE  email_hash = p_email_hash
  FOR UPDATE;

  -- Reset if the previous lock has expired
  IF v_locked_until IS NOT NULL AND v_locked_until < v_now THEN
    v_new_count    := 0;
    v_locked_until := NULL;
  END IF;

  v_new_count := v_new_count + 1;

  -- Apply lockout thresholds (only when not already locked)
  IF v_locked_until IS NULL THEN
    IF v_new_count >= 20 THEN
      v_locked_until := v_now + INTERVAL '60 minutes';
    ELSIF v_new_count >= 10 THEN
      v_locked_until := v_now + INTERVAL '15 minutes';
    END IF;
  END IF;

  UPDATE auth_lockouts
  SET    fail_count   = v_new_count,
         locked_until = v_locked_until,
         last_fail_at = v_now
  WHERE  email_hash = p_email_hash;

  RETURN jsonb_build_object('fail_count', v_new_count, 'locked_until', v_locked_until);
END;
$$;

-- ============================================================
-- 3. pg_cron cleanup jobs
-- ============================================================

-- Remove expired rate limit buckets every day at 04:00 UTC
SELECT cron.schedule(
  'rate-limit-bucket-cleanup',
  '0 4 * * *',
  $$DELETE FROM rate_limit_buckets WHERE expires_at < now()$$
);

-- Remove lockout entries inactive for 100+ hours every day at 04:00 UTC
SELECT cron.schedule(
  'auth-lockout-cleanup',
  '0 4 * * *',
  $$DELETE FROM auth_lockouts WHERE last_fail_at < now() - INTERVAL '100 hours'$$
);
