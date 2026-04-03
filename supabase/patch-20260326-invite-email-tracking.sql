-- Add email send tracking columns to tenant_member_invites
-- Applied: 2026-03-26

ALTER TABLE tenant_member_invites
  ADD COLUMN IF NOT EXISTS email_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_send_count INTEGER NOT NULL DEFAULT 0;
