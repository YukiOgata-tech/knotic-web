-- Add faq_questions column to bots
-- Stores up to 5 preset quick-tap question strings for the chat UI.

alter table public.bots
  add column if not exists faq_questions text[] not null default '{}';
