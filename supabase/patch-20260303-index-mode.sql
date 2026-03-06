-- Add index_mode column to indexing_jobs
-- Tracks which indexing pipeline was used for each job.
-- 'raw'  = plain text extraction only (existing default behavior)
-- 'llm'  = LLM-structured content via gpt-4o-mini after text extraction

ALTER TABLE public.indexing_jobs
  ADD COLUMN IF NOT EXISTS index_mode text NOT NULL DEFAULT 'raw';

COMMENT ON COLUMN public.indexing_jobs.index_mode IS
  'Indexing mode: raw (plain text extraction) or llm (LLM-structured content via gpt-4o-mini)';

-- Add index_mode column to sources
-- Reflects the mode used in the most recent successful indexing run.

ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS index_mode text NOT NULL DEFAULT 'raw';

COMMENT ON COLUMN public.sources.index_mode IS
  'Indexing mode last applied: raw or llm';
