-- 2026-03 consolidated patch
-- Combines all March 2026 incremental patches into one file.
-- Safe to re-run (idempotent).

-- ── 01: OpenAI File Search support ────────────────────────────────────────────
-- Add file_search columns to bots and sources.

alter table public.bots
  add column if not exists file_search_provider text,
  add column if not exists file_search_vector_store_id text;

alter table public.sources
  add column if not exists file_search_provider text,
  add column if not exists file_search_file_id text,
  add column if not exists file_search_last_synced_at timestamptz,
  add column if not exists file_search_error text;

create index if not exists idx_bots_file_search_vector_store_id
  on public.bots(file_search_vector_store_id);

create index if not exists idx_sources_file_search_file_id
  on public.sources(file_search_file_id);

-- ── 02: Drop legacy vector-RAG objects ────────────────────────────────────────
-- File Search is now the only RAG backend. Legacy tables removed.

drop function if exists app.match_chunks(vector, uuid, uuid, integer);
drop table if exists public.embeddings cascade;
drop table if exists public.chunks cascade;
drop table if exists public.documents cascade;

do $$
declare
  vector_col_count integer;
begin
  select count(*) into vector_col_count
  from information_schema.columns
  where udt_name = 'vector';

  if vector_col_count = 0 then
    begin
      execute 'drop extension if exists vector';
    exception when others then
      null;
    end;
  end if;
end
$$;

-- ── 03: index_mode column ─────────────────────────────────────────────────────
-- Tracks which indexing pipeline was used for each job/source.
-- 'raw' = plain text extraction only
-- 'llm' = AI-structured content after text extraction

alter table public.indexing_jobs
  add column if not exists index_mode text not null default 'raw';

comment on column public.indexing_jobs.index_mode is
  'Indexing mode: raw (plain text extraction) or llm (AI-structured content)';

alter table public.sources
  add column if not exists index_mode text not null default 'raw';

comment on column public.sources.index_mode is
  'Indexing mode last applied: raw or llm';

-- ── 04: Remove 4o/4o-mini from allowed AI model values ────────────────────────
-- 5-series is cheaper and more capable; 4o series is no longer offered.

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'bots_ai_model_ck') then
    alter table bots drop constraint bots_ai_model_ck;
  end if;
  if exists (select 1 from pg_constraint where conname = 'bots_ai_fallback_model_ck') then
    alter table bots drop constraint bots_ai_fallback_model_ck;
  end if;

  alter table bots
    add constraint bots_ai_model_ck
    check (ai_model in ('5-nano', '5-mini', '5'));

  alter table bots
    add constraint bots_ai_fallback_model_ck
    check (ai_fallback_model is null or ai_fallback_model in ('5-nano', '5-mini', '5'));
end $$;
