-- Apply after:
-- 1) supabase/schema.sql
-- 2) supabase/patch-20260224-console-management.sql
--
-- Adds crawl/page artifacts and vector search helpers for indexing pipeline.

create table if not exists public.source_pages (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  canonical_url text not null,
  title text,
  status_code integer,
  content_hash text,
  raw_path text,
  text_path text,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, canonical_url)
);

create index if not exists idx_source_pages_source_id on public.source_pages(source_id);
create index if not exists idx_source_pages_tenant_bot on public.source_pages(tenant_id, bot_id);
create index if not exists idx_source_pages_fetched_at on public.source_pages(fetched_at desc);

create trigger set_source_pages_updated_at
before update on public.source_pages
for each row execute procedure app.set_updated_at();

alter table public.source_pages enable row level security;

create policy "source_pages_select_member"
on public.source_pages for select
using (app.can_read_tenant(tenant_id));

create policy "source_pages_write_editor"
on public.source_pages for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));

alter table public.indexing_jobs
  add column if not exists options jsonb not null default '{}'::jsonb,
  add column if not exists embedding_model text not null default 'text-embedding-3-small',
  add column if not exists chunks_created integer not null default 0,
  add column if not exists tokens_embedded integer not null default 0,
  add column if not exists lock_expires_at timestamptz,
  add column if not exists worker_id text;

create index if not exists idx_indexing_jobs_status_requested
  on public.indexing_jobs(status, requested_at);

create index if not exists idx_embeddings_vector
  on public.embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function app.match_chunks(
  query_embedding vector(1536),
  target_tenant_id uuid,
  target_bot_id uuid default null,
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  document_id uuid,
  source_id uuid,
  bot_id uuid,
  score double precision,
  text text,
  meta jsonb
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.source_id,
    s.bot_id,
    (1 - (e.embedding <=> query_embedding))::double precision as score,
    c.text,
    c.meta
  from public.embeddings e
  join public.chunks c on c.id = e.chunk_id
  join public.documents d on d.id = c.document_id
  join public.sources s on s.id = d.source_id
  join public.bots b on b.id = s.bot_id
  where b.tenant_id = target_tenant_id
    and (target_bot_id is null or s.bot_id = target_bot_id)
  order by e.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

