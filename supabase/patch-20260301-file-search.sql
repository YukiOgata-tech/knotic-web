-- File Search migration patch (2026-03-01)
-- Apply this to existing Supabase projects to enable OpenAI File Search backend.

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
