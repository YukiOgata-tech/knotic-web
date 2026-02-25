-- Apply after supabase/schema.sql
-- Adds management-console specific tables.

create table if not exists public.tenant_ai_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  default_model text not null default 'gpt-5-mini',
  fallback_model text,
  allow_model_override boolean not null default false,
  max_output_tokens integer not null default 1200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_last4 text not null,
  key_hash text not null unique,
  scopes text[] not null default '{"chat:invoke"}',
  is_active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.indexing_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid references public.bots(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  status text not null default 'queued',
  job_type text not null default 'manual',
  requested_by uuid references auth.users(id),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  pages_discovered integer not null default 0,
  pages_indexed integer not null default 0,
  error_message text
);

create index if not exists idx_tenant_api_keys_tenant_id on public.tenant_api_keys(tenant_id);
create index if not exists idx_indexing_jobs_tenant_requested on public.indexing_jobs(tenant_id, requested_at desc);

create trigger set_tenant_ai_settings_updated_at
before update on public.tenant_ai_settings
for each row execute procedure app.set_updated_at();

create trigger set_tenant_api_keys_updated_at
before update on public.tenant_api_keys
for each row execute procedure app.set_updated_at();

alter table public.tenant_ai_settings enable row level security;
alter table public.tenant_api_keys enable row level security;
alter table public.indexing_jobs enable row level security;

create policy "tenant_ai_settings_select_member"
on public.tenant_ai_settings for select
using (app.can_read_tenant(tenant_id));

create policy "tenant_ai_settings_write_editor"
on public.tenant_ai_settings for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));

create policy "tenant_api_keys_select_member"
on public.tenant_api_keys for select
using (app.can_read_tenant(tenant_id));

create policy "tenant_api_keys_write_editor"
on public.tenant_api_keys for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));

create policy "indexing_jobs_select_member"
on public.indexing_jobs for select
using (app.can_read_tenant(tenant_id));

create policy "indexing_jobs_write_editor"
on public.indexing_jobs for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));
