-- knotic initial production-oriented schema
-- Apply in Supabase SQL Editor

create extension if not exists pgcrypto;
create extension if not exists vector;

create schema if not exists app;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'membership_role') then
    create type membership_role as enum ('editor', 'reader');
  end if;

  if not exists (select 1 from pg_type where typname = 'bot_status') then
    create type bot_status as enum ('draft', 'queued', 'running', 'ready', 'failed', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'source_type') then
    create type source_type as enum ('url', 'pdf', 'file');
  end if;

  if not exists (select 1 from pg_type where typname = 'source_status') then
    create type source_status as enum ('queued', 'running', 'ready', 'failed', 'deleted');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type subscription_status as enum (
      'incomplete',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_provider') then
    create type billing_provider as enum ('stripe');
  end if;
end
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  default_tenant_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  owner_user_id uuid not null references auth.users(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_default_tenant_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_default_tenant_id_fkey
      foreign key (default_tenant_id) references public.tenants(id) on delete set null;
  end if;
end
$$;

create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role membership_role not null default 'reader',
  is_active boolean not null default true,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.plans (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  monthly_price_jpy integer not null,
  max_bots integer not null,
  max_monthly_messages integer not null,
  max_storage_mb integer not null,
  has_api boolean not null default false,
  has_hosted_page boolean not null default false,
  has_widget boolean not null default true,
  allow_model_selection boolean not null default false,
  is_bot_limit_display_unlimited boolean not null default false,
  internal_max_bots_cap integer not null default 50,
  has_line boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plans (
  code,
  name,
  monthly_price_jpy,
  max_bots,
  max_monthly_messages,
  max_storage_mb,
  has_api,
  has_hosted_page,
  has_widget,
  allow_model_selection,
  is_bot_limit_display_unlimited,
  internal_max_bots_cap,
  has_line
)
values
  ('lite', 'Lite', 10000, 1, 1000, 100, false, false, true, false, false, 50, false),
  ('standard', 'Standard', 24800, 1, 5000, 1024, true, true, true, true, false, 50, false),
  ('pro', 'Pro', 100000, 50, 20000, 10240, true, true, true, true, true, 50, false)
on conflict (code) do update
set
  name = excluded.name,
  monthly_price_jpy = excluded.monthly_price_jpy,
  max_bots = excluded.max_bots,
  max_monthly_messages = excluded.max_monthly_messages,
  max_storage_mb = excluded.max_storage_mb,
  has_api = excluded.has_api,
  has_hosted_page = excluded.has_hosted_page,
  has_widget = excluded.has_widget,
  allow_model_selection = excluded.allow_model_selection,
  is_bot_limit_display_unlimited = excluded.is_bot_limit_display_unlimited,
  internal_max_bots_cap = excluded.internal_max_bots_cap,
  has_line = excluded.has_line,
  is_active = true;

create table if not exists public.plan_entitlements (
  plan_id bigint primary key references public.plans(id) on delete cascade,
  max_api_keys integer not null default 0,
  max_hosted_pages integer not null default 0,
  max_allowed_origins integer,
  internal_max_allowed_origins_cap integer not null default 200,
  api_rpm_limit integer not null default 60,
  overage_notify_threshold_percent integer not null default 80,
  spam_protection_profile text not null default 'standard',
  support_level text not null default 'documentation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plan_entitlements (
  plan_id,
  max_api_keys,
  max_hosted_pages,
  max_allowed_origins,
  internal_max_allowed_origins_cap,
  api_rpm_limit,
  overage_notify_threshold_percent,
  spam_protection_profile,
  support_level
)
select
  p.id as plan_id,
  case p.code when 'lite' then 0 when 'standard' then 2 when 'pro' then 10 else 0 end as max_api_keys,
  case p.code when 'lite' then 0 when 'standard' then 5 when 'pro' then 50 else 0 end as max_hosted_pages,
  null::integer as max_allowed_origins, -- plan上は無制限、内部CAPで制御
  200 as internal_max_allowed_origins_cap,
  case p.code when 'lite' then 30 when 'standard' then 120 when 'pro' then 300 else 60 end as api_rpm_limit,
  80 as overage_notify_threshold_percent,
  'standard' as spam_protection_profile,
  'documentation' as support_level
from public.plans p
on conflict (plan_id) do update
set
  max_api_keys = excluded.max_api_keys,
  max_hosted_pages = excluded.max_hosted_pages,
  max_allowed_origins = excluded.max_allowed_origins,
  internal_max_allowed_origins_cap = excluded.internal_max_allowed_origins_cap,
  api_rpm_limit = excluded.api_rpm_limit,
  overage_notify_threshold_percent = excluded.overage_notify_threshold_percent,
  spam_protection_profile = excluded.spam_protection_profile,
  support_level = excluded.support_level;

create table if not exists public.billing_customers (
  id bigserial primary key,
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  provider billing_provider not null default 'stripe',
  provider_customer_id text not null unique,
  billing_email text,
  country_code text,
  tax_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id bigint not null references public.plans(id),
  provider billing_provider not null default 'stripe',
  provider_subscription_id text unique,
  status subscription_status not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_subscriptions_single_effective_per_tenant
on public.subscriptions (tenant_id)
where status in ('trialing', 'active', 'past_due');

create table if not exists public.billing_events (
  id bigserial primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  provider billing_provider not null default 'stripe',
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  public_id text not null unique,
  name text not null,
  description text,
  status bot_status not null default 'draft',
  is_public boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_public_tokens (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  public_token_hash text not null unique,
  allowed_origins text[] not null default '{}',
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  type source_type not null,
  status source_status not null default 'queued',
  url text,
  file_path text,
  file_name text,
  content_hash text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sources_required_fields_by_type_ck'
  ) then
    alter table public.sources
      add constraint sources_required_fields_by_type_ck
      check (
        (type = 'url' and url is not null and file_path is null)
        or
        (type in ('pdf', 'file') and file_path is not null)
      );
  end if;
end
$$;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  version integer not null default 1,
  title text,
  raw_path text,
  text_path text,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_id, version)
);

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  text text not null,
  token_count integer,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table if not exists public.embeddings (
  chunk_id uuid primary key references public.chunks(id) on delete cascade,
  model text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_logs (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  user_anon_id text,
  question text not null,
  answer text not null,
  token_usage_in integer not null default 0,
  token_usage_out integer not null default 0,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_daily (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid references public.bots(id) on delete cascade,
  usage_date date not null,
  messages_count integer not null default 0,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, bot_id, usage_date)
);

create table if not exists public.response_cache (
  id bigserial primary key,
  bot_id uuid not null references public.bots(id) on delete cascade,
  cache_key_hash text not null,
  answer text not null,
  retrieved_chunks jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (bot_id, cache_key_hash)
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure app.set_updated_at();

create trigger set_tenants_updated_at
before update on public.tenants
for each row execute procedure app.set_updated_at();

create trigger set_tenant_memberships_updated_at
before update on public.tenant_memberships
for each row execute procedure app.set_updated_at();

create trigger set_plans_updated_at
before update on public.plans
for each row execute procedure app.set_updated_at();

create trigger set_plan_entitlements_updated_at
before update on public.plan_entitlements
for each row execute procedure app.set_updated_at();

create trigger set_billing_customers_updated_at
before update on public.billing_customers
for each row execute procedure app.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure app.set_updated_at();

create trigger set_bots_updated_at
before update on public.bots
for each row execute procedure app.set_updated_at();

create trigger set_sources_updated_at
before update on public.sources
for each row execute procedure app.set_updated_at();

create index if not exists idx_memberships_user_id on public.tenant_memberships(user_id);
create index if not exists idx_bots_tenant_id on public.bots(tenant_id);
create index if not exists idx_sources_bot_id on public.sources(bot_id);
create index if not exists idx_documents_source_id on public.documents(source_id);
create index if not exists idx_chunks_document_id on public.chunks(document_id);
create index if not exists idx_chat_logs_tenant_created on public.chat_logs(tenant_id, created_at desc);
create index if not exists idx_usage_daily_tenant_date on public.usage_daily(tenant_id, usage_date desc);
create index if not exists idx_response_cache_bot_expires on public.response_cache(bot_id, expires_at);

create or replace function app.current_user_tenant_ids()
returns setof uuid
language sql
stable
as $$
  select tenant_id
  from public.tenant_memberships
  where user_id = auth.uid() and is_active = true
$$;

create or replace function app.can_read_tenant(target_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.tenant_memberships
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and is_active = true
  )
$$;

create or replace function app.can_write_tenant(target_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.tenant_memberships
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and role = 'editor'
      and is_active = true
  )
$$;

create or replace function app.is_tenant_owner_user(target_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.tenants t
    where t.id = target_tenant_id
      and t.owner_user_id = auth.uid()
      and t.active = true
  )
$$;

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.bots enable row level security;
alter table public.bot_public_tokens enable row level security;
alter table public.sources enable row level security;
alter table public.documents enable row level security;
alter table public.chunks enable row level security;
alter table public.embeddings enable row level security;
alter table public.chat_logs enable row level security;
alter table public.usage_daily enable row level security;
alter table public.response_cache enable row level security;
alter table public.plans enable row level security;
alter table public.plan_entitlements enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (user_id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "tenants_select_member"
on public.tenants for select
using (id in (select app.current_user_tenant_ids()));

create policy "tenants_update_editor"
on public.tenants for update
using (app.can_write_tenant(id))
with check (app.can_write_tenant(id));

create policy "memberships_select_member"
on public.tenant_memberships for select
using (tenant_id in (select app.current_user_tenant_ids()));

create policy "memberships_insert_manager"
on public.tenant_memberships for insert
with check (app.is_tenant_owner_user(tenant_id));

create policy "memberships_update_manager"
on public.tenant_memberships for update
using (app.is_tenant_owner_user(tenant_id))
with check (app.is_tenant_owner_user(tenant_id));

create policy "memberships_delete_manager"
on public.tenant_memberships for delete
using (app.is_tenant_owner_user(tenant_id));

create policy "plans_select_all"
on public.plans for select
using (true);

create policy "plan_entitlements_select_all"
on public.plan_entitlements for select
using (true);

create policy "billing_customers_select_member"
on public.billing_customers for select
using (tenant_id in (select app.current_user_tenant_ids()));

create policy "subscriptions_select_member"
on public.subscriptions for select
using (tenant_id in (select app.current_user_tenant_ids()));

create policy "billing_events_select_owner"
on public.billing_events for select
using (app.is_tenant_owner_user(tenant_id));

create policy "bots_select_member"
on public.bots for select
using (app.can_read_tenant(tenant_id));
create policy "bots_write_editor"
on public.bots for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));

create policy "bot_tokens_select_member"
on public.bot_public_tokens for select
using (bot_id in (select id from public.bots where tenant_id in (select app.current_user_tenant_ids())))
;
create policy "bot_tokens_write_editor"
on public.bot_public_tokens for all
using (bot_id in (select id from public.bots where app.can_write_tenant(tenant_id)))
with check (bot_id in (select id from public.bots where app.can_write_tenant(tenant_id)));

create policy "sources_select_member"
on public.sources for select
using (
  bot_id in (
    select id from public.bots where app.can_read_tenant(tenant_id)
  )
)
;
create policy "sources_write_editor"
on public.sources for all
using (
  bot_id in (
    select id from public.bots where app.can_write_tenant(tenant_id)
  )
)
with check (
  bot_id in (
    select id from public.bots where app.can_write_tenant(tenant_id)
  )
);

create policy "documents_select_member"
on public.documents for select
using (
  source_id in (
    select s.id
    from public.sources s
    join public.bots b on b.id = s.bot_id
    where app.can_read_tenant(b.tenant_id)
  )
)
;
create policy "documents_write_editor"
on public.documents for all
using (
  source_id in (
    select s.id
    from public.sources s
    join public.bots b on b.id = s.bot_id
    where app.can_write_tenant(b.tenant_id)
  )
)
with check (
  source_id in (
    select s.id
    from public.sources s
    join public.bots b on b.id = s.bot_id
    where app.can_write_tenant(b.tenant_id)
  )
);

create policy "chunks_select_member"
on public.chunks for select
using (
  document_id in (
    select d.id
    from public.documents d
    join public.sources s on s.id = d.source_id
    join public.bots b on b.id = s.bot_id
    where app.can_read_tenant(b.tenant_id)
  )
)
;
create policy "chunks_write_editor"
on public.chunks for all
using (
  document_id in (
    select d.id
    from public.documents d
    join public.sources s on s.id = d.source_id
    join public.bots b on b.id = s.bot_id
    where app.can_write_tenant(b.tenant_id)
  )
)
with check (
  document_id in (
    select d.id
    from public.documents d
    join public.sources s on s.id = d.source_id
    join public.bots b on b.id = s.bot_id
    where app.can_write_tenant(b.tenant_id)
  )
);

create policy "embeddings_select_member"
on public.embeddings for select
using (
  chunk_id in (
    select c.id
    from public.chunks c
    join public.documents d on d.id = c.document_id
    join public.sources s on s.id = d.source_id
    join public.bots b on b.id = s.bot_id
    where app.can_read_tenant(b.tenant_id)
  )
)
;
create policy "embeddings_write_editor"
on public.embeddings for all
using (
  chunk_id in (
    select c.id
    from public.chunks c
    join public.documents d on d.id = c.document_id
    join public.sources s on s.id = d.source_id
    join public.bots b on b.id = s.bot_id
    where app.can_write_tenant(b.tenant_id)
  )
)
with check (
  chunk_id in (
    select c.id
    from public.chunks c
    join public.documents d on d.id = c.document_id
    join public.sources s on s.id = d.source_id
    join public.bots b on b.id = s.bot_id
    where app.can_write_tenant(b.tenant_id)
  )
);

create policy "chat_logs_select_member"
on public.chat_logs for select
using (app.can_read_tenant(tenant_id));
create policy "chat_logs_write_editor"
on public.chat_logs for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));

create policy "usage_daily_select_member"
on public.usage_daily for select
using (app.can_read_tenant(tenant_id));
create policy "usage_daily_write_editor"
on public.usage_daily for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));

create policy "response_cache_select_member"
on public.response_cache for select
using (
  bot_id in (
    select id from public.bots where app.can_read_tenant(tenant_id)
  )
)
;
create policy "response_cache_write_editor"
on public.response_cache for all
using (
  bot_id in (
    select id from public.bots where app.can_write_tenant(tenant_id)
  )
)
with check (
  bot_id in (
    select id from public.bots where app.can_write_tenant(tenant_id)
  )
);

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  tenant_name text;
  tenant_slug text;
begin
  tenant_name := coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email, '@', 1), 'New Tenant');
  tenant_slug := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  tenant_slug := trim(both '-' from tenant_slug);
  if tenant_slug = '' then
    tenant_slug := 'tenant';
  end if;
  tenant_slug := tenant_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.tenants (slug, display_name, owner_user_id)
  values (tenant_slug, tenant_name, new.id)
  returning id into new_tenant_id;

  insert into public.profiles (user_id, full_name, default_tenant_id)
  values (new.id, new.raw_user_meta_data->>'full_name', new_tenant_id);

  insert into public.tenant_memberships (tenant_id, user_id, role, is_active)
  values (new_tenant_id, new.id, 'editor', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure app.handle_new_user();
