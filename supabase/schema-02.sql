-- knotic initial production-oriented schema
-- Apply in Supabase SQL Editor

create extension if not exists pgcrypto;

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
  force_stopped boolean not null default false,
  force_stop_reason text,
  force_stopped_at timestamptz,
  force_stopped_by uuid references auth.users(id) on delete set null,
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
  max_api_keys integer not null default 0,
  max_hosted_pages integer not null default 0,
  max_allowed_origins integer,
  internal_max_allowed_origins_cap integer not null default 200,
  api_rpm_limit integer not null default 60,
  overage_notify_threshold_percent integer not null default 80,
  spam_protection_profile text not null default 'standard',
  support_level text not null default 'documentation',
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
  max_api_keys,
  max_hosted_pages,
  max_allowed_origins,
  internal_max_allowed_origins_cap,
  api_rpm_limit,
  overage_notify_threshold_percent,
  spam_protection_profile,
  support_level,
  has_line
)
values
  ('starter', 'Starter', 4900, 1, 300, 75, false, false, true, false, false, 50, 0, 0, null, 200, 30, 80, 'standard', 'documentation', false),
  ('lite', 'Lite', 9800, 1, 1000, 100, false, false, true, false, false, 50, 0, 0, null, 200, 30, 80, 'standard', 'documentation', false),
  ('standard', 'Standard', 24800, 2, 5000, 1024, true, true, true, true, false, 50, 2, 2, null, 200, 120, 80, 'standard', 'documentation', false),
  ('pro', 'Pro', 100000, 50, 20000, 10240, true, true, true, true, true, 50, 10, 50, null, 200, 300, 80, 'standard', 'documentation', false)
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
  max_api_keys = excluded.max_api_keys,
  max_hosted_pages = excluded.max_hosted_pages,
  max_allowed_origins = excluded.max_allowed_origins,
  internal_max_allowed_origins_cap = excluded.internal_max_allowed_origins_cap,
  api_rpm_limit = excluded.api_rpm_limit,
  overage_notify_threshold_percent = excluded.overage_notify_threshold_percent,
  spam_protection_profile = excluded.spam_protection_profile,
  support_level = excluded.support_level,
  has_line = excluded.has_line,
  is_active = true;

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
  processing_error text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
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
  chat_purpose text not null default 'customer_support',
  access_mode text not null default 'public',
  display_name text,
  welcome_message text,
  placeholder_text text,
  disclaimer_text text,
  show_citations boolean not null default true,
  history_turn_limit integer not null default 8,
  file_search_provider text,
  file_search_vector_store_id text,
  require_auth_for_hosted boolean not null default false,
  ui_header_bg_color text not null default '#0f172a',
  ui_header_text_color text not null default '#f8fafc',
  ui_footer_bg_color text not null default '#f8fafc',
  ui_footer_text_color text not null default '#0f172a',
  widget_enabled boolean not null default true,
  widget_mode text not null default 'overlay',
  widget_position text not null default 'right-bottom',
  widget_launcher_label text not null default 'チャット',
  widget_policy_text text not null default 'このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。',
  widget_redirect_new_tab boolean not null default false,
  force_stopped boolean not null default false,
  force_stop_reason text,
  force_stopped_at timestamptz,
  force_stopped_by uuid references auth.users(id) on delete set null,
  ai_model text not null default 'gpt-5-mini',
  ai_fallback_model text,
  ai_max_output_tokens integer not null default 1200,
  faq_questions text[] not null default '{}',
  bot_logo_url text,
  launcher_show_label boolean not null default true,
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
  file_size_bytes bigint not null default 0,
  file_search_provider text,
  file_search_file_id text,
  file_search_last_synced_at timestamptz,
  file_search_error text,
  index_mode text not null default 'raw',
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
alter table public.chat_logs enable row level security;
alter table public.usage_daily enable row level security;
alter table public.response_cache enable row level security;
alter table public.plans enable row level security;

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

-- ------------------------------------------------------------
-- consolidated from patch files (2026-02-24 / 2026-02-25)
-- this block keeps schema.sql as single source of truth for fresh setup.
-- ------------------------------------------------------------

-- A) management tables
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
  options jsonb not null default '{}'::jsonb,
  embedding_model text not null default 'text-embedding-3-small',
  chunks_created integer not null default 0,
  tokens_embedded integer not null default 0,
  lock_expires_at timestamptz,
  worker_id text,
  index_mode text not null default 'raw',
  requested_by uuid references auth.users(id),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  pages_discovered integer not null default 0,
  pages_indexed integer not null default 0,
  error_message text
);

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
  raw_bytes bigint not null default 0,
  text_path text,
  text_bytes bigint not null default 0,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, canonical_url)
);

create table if not exists public.tenant_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  level text not null check (level in ('info', 'warning', 'critical')),
  kind text not null,
  title text not null,
  message text not null,
  dedupe_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- B) consolidated columns (from table-consolidation + ui-colors patches)
alter table public.tenants
  drop column if exists ai_default_model,
  drop column if exists ai_fallback_model,
  drop column if exists ai_allow_model_override,
  drop column if exists ai_max_output_tokens;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bots_chat_purpose_ck') then
    alter table public.bots
      add constraint bots_chat_purpose_ck
      check (chat_purpose in ('customer_support', 'lead_gen', 'internal_kb', 'onboarding', 'custom'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bots_access_mode_ck') then
    alter table public.bots
      add constraint bots_access_mode_ck
      check (access_mode in ('public', 'internal'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bots_history_turn_limit_ck') then
    alter table public.bots
      add constraint bots_history_turn_limit_ck
      check (history_turn_limit between 1 and 30);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bots_ui_header_bg_color_ck') then
    alter table public.bots
      add constraint bots_ui_header_bg_color_ck
      check (ui_header_bg_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bots_ui_header_text_color_ck') then
    alter table public.bots
      add constraint bots_ui_header_text_color_ck
      check (ui_header_text_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bots_ui_footer_bg_color_ck') then
    alter table public.bots
      add constraint bots_ui_footer_bg_color_ck
      check (ui_footer_bg_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bots_ui_footer_text_color_ck') then
    alter table public.bots
      add constraint bots_ui_footer_text_color_ck
      check (ui_footer_text_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end
$$;

-- C) triggers / indexes
create trigger set_tenant_api_keys_updated_at
before update on public.tenant_api_keys
for each row execute procedure app.set_updated_at();

create trigger set_source_pages_updated_at
before update on public.source_pages
for each row execute procedure app.set_updated_at();

create index if not exists idx_tenant_api_keys_tenant_id on public.tenant_api_keys(tenant_id);
create index if not exists idx_indexing_jobs_tenant_requested on public.indexing_jobs(tenant_id, requested_at desc);
create index if not exists idx_indexing_jobs_status_requested on public.indexing_jobs(status, requested_at);
create index if not exists idx_source_pages_source_id on public.source_pages(source_id);
create index if not exists idx_source_pages_tenant_bot on public.source_pages(tenant_id, bot_id);
create index if not exists idx_source_pages_fetched_at on public.source_pages(fetched_at desc);
create index if not exists idx_tenant_notifications_tenant_created on public.tenant_notifications(tenant_id, created_at desc);
create index if not exists idx_tenant_notifications_unread on public.tenant_notifications(tenant_id) where read_at is null;
create index if not exists idx_bots_access_mode on public.bots(access_mode);
create index if not exists idx_bots_chat_purpose on public.bots(chat_purpose);
create index if not exists idx_bots_file_search_vector_store_id on public.bots(file_search_vector_store_id);
create index if not exists idx_sources_file_search_file_id on public.sources(file_search_file_id);

-- D) function final forms
create or replace function app.current_user_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.tenant_memberships
  where user_id = auth.uid() and is_active = true
$$;

create or replace function app.increment_usage_daily(
  p_tenant_id uuid,
  p_bot_id uuid,
  p_usage_date date,
  p_messages integer default 0,
  p_tokens_in integer default 0,
  p_tokens_out integer default 0
)
returns void
language plpgsql
as $$
begin
  insert into public.usage_daily (
    tenant_id,
    bot_id,
    usage_date,
    messages_count,
    tokens_in,
    tokens_out
  )
  values (
    p_tenant_id,
    p_bot_id,
    p_usage_date,
    greatest(p_messages, 0),
    greatest(p_tokens_in, 0),
    greatest(p_tokens_out, 0)
  )
  on conflict (tenant_id, bot_id, usage_date)
  do update set
    messages_count = public.usage_daily.messages_count + excluded.messages_count,
    tokens_in = public.usage_daily.tokens_in + excluded.tokens_in,
    tokens_out = public.usage_daily.tokens_out + excluded.tokens_out;
end;
$$;

create or replace function app.get_tenant_storage_usage_bytes(target_tenant_id uuid)
returns bigint
language sql
stable
as $$
  with source_sizes as (
    select coalesce(sum(s.file_size_bytes), 0)::bigint as bytes
    from public.bots b
    join public.sources s on s.bot_id = b.id
    where b.tenant_id = target_tenant_id
      and s.status <> 'deleted'
  ),
  page_sizes as (
    select coalesce(sum(sp.raw_bytes + sp.text_bytes), 0)::bigint as bytes
    from public.source_pages sp
    where sp.tenant_id = target_tenant_id
  )
  select (source_sizes.bytes + page_sizes.bytes)::bigint
  from source_sizes, page_sizes
$$;

-- E) RLS for newly consolidated objects
alter table public.tenant_api_keys enable row level security;
alter table public.indexing_jobs enable row level security;
alter table public.source_pages enable row level security;
alter table public.tenant_notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tenant_api_keys' and policyname = 'tenant_api_keys_select_member'
  ) then
    create policy "tenant_api_keys_select_member"
    on public.tenant_api_keys for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tenant_api_keys' and policyname = 'tenant_api_keys_write_editor'
  ) then
    create policy "tenant_api_keys_write_editor"
    on public.tenant_api_keys for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'indexing_jobs' and policyname = 'indexing_jobs_select_member'
  ) then
    create policy "indexing_jobs_select_member"
    on public.indexing_jobs for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'indexing_jobs' and policyname = 'indexing_jobs_write_editor'
  ) then
    create policy "indexing_jobs_write_editor"
    on public.indexing_jobs for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'source_pages' and policyname = 'source_pages_select_member'
  ) then
    create policy "source_pages_select_member"
    on public.source_pages for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'source_pages' and policyname = 'source_pages_write_editor'
  ) then
    create policy "source_pages_write_editor"
    on public.source_pages for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tenant_notifications' and policyname = 'tenant_notifications_select_member'
  ) then
    create policy "tenant_notifications_select_member"
    on public.tenant_notifications for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tenant_notifications' and policyname = 'tenant_notifications_write_editor'
  ) then
    create policy "tenant_notifications_write_editor"
    on public.tenant_notifications for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;
end
$$;



-- ============================================================
-- schema02 final reconciliation block (2026-02-28)
-- This block applies additive features not fully embedded in base schema.sql
-- ============================================================

-- A) Widget distribution settings
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bots_widget_mode_ck'
  ) then
    alter table public.bots
      add constraint bots_widget_mode_ck
      check (widget_mode in ('overlay', 'redirect', 'both'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'bots_widget_position_ck'
  ) then
    alter table public.bots
      add constraint bots_widget_position_ck
      check (widget_position in ('right-bottom', 'right-top'));
  end if;
end
$$;

-- B) Platform admin + contract overrides
create table if not exists public.platform_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_contract_overrides (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id bigint not null references public.plans(id),
  status subscription_status not null default 'active',
  billing_mode text not null default 'stripe' check (billing_mode in ('stripe', 'bank_transfer', 'invoice', 'manual')),
  is_active boolean not null default true,
  notes text,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_contract_overrides_effective_window_ck') then
    alter table public.tenant_contract_overrides
      add constraint tenant_contract_overrides_effective_window_ck
      check (effective_until is null or effective_until > effective_from);
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_platform_admin_users_updated_at') then
    create trigger set_platform_admin_users_updated_at
    before update on public.platform_admin_users
    for each row execute procedure app.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_tenant_contract_overrides_updated_at') then
    create trigger set_tenant_contract_overrides_updated_at
    before update on public.tenant_contract_overrides
    for each row execute procedure app.set_updated_at();
  end if;
end
$$;

create index if not exists idx_platform_admin_users_active on public.platform_admin_users(is_active);
create index if not exists idx_tenant_contract_overrides_tenant_active
  on public.tenant_contract_overrides(tenant_id, is_active, effective_from desc);

create or replace function app.is_platform_admin_user(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.platform_admin_users p
    where p.user_id = target_user_id
      and p.is_active = true
  )
$$;

alter table public.platform_admin_users enable row level security;
alter table public.tenant_contract_overrides enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'platform_admin_users' and policyname = 'platform_admin_users_select_self_or_admin'
  ) then
    create policy "platform_admin_users_select_self_or_admin"
    on public.platform_admin_users for select
    using (user_id = auth.uid() or app.is_platform_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'platform_admin_users' and policyname = 'platform_admin_users_write_admin'
  ) then
    create policy "platform_admin_users_write_admin"
    on public.platform_admin_users for all
    using (app.is_platform_admin_user())
    with check (app.is_platform_admin_user());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tenant_contract_overrides' and policyname = 'tenant_contract_overrides_admin_only'
  ) then
    create policy "tenant_contract_overrides_admin_only"
    on public.tenant_contract_overrides for all
    using (app.is_platform_admin_user())
    with check (app.is_platform_admin_user());
  end if;
end
$$;

-- C) Audit log / ops helper + billing retry metadata
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_tenant_created
  on public.audit_logs (tenant_id, created_at desc);
create index if not exists idx_audit_logs_action_created
  on public.audit_logs (action, created_at desc);
create index if not exists idx_audit_logs_target_created
  on public.audit_logs (target_type, target_id, created_at desc);

alter table public.audit_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'audit_logs_select_member'
  ) then
    create policy "audit_logs_select_member"
    on public.audit_logs for select
    using (app.can_read_tenant(tenant_id));
  end if;
end
$$;

create or replace function app.write_audit_log(
  p_tenant_id uuid,
  p_action text,
  p_target_type text,
  p_target_id text default null,
  p_before jsonb default '{}'::jsonb,
  p_after jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  if not app.can_read_tenant(p_tenant_id) then
    raise exception 'forbidden';
  end if;

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    target_type,
    target_id,
    before_json,
    after_json,
    metadata
  ) values (
    p_tenant_id,
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    coalesce(p_before, '{}'::jsonb),
    coalesce(p_after, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function app.write_audit_log(uuid, text, text, text, jsonb, jsonb, jsonb) to authenticated;

create or replace function app.get_tenant_ops_snapshot(target_tenant_id uuid)
returns table (
  bot_total bigint,
  bot_ready bigint,
  source_total bigint,
  source_failed bigint,
  jobs_queued bigint,
  jobs_running bigint,
  jobs_failed_7d bigint,
  jobs_done_7d bigint,
  messages_30d bigint,
  unread_notifications bigint,
  storage_usage_bytes bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with bot_stat as (
    select
      count(*)::bigint as bot_total,
      count(*) filter (where status in ('ready', 'running'))::bigint as bot_ready
    from public.bots
    where tenant_id = target_tenant_id
  ),
  source_stat as (
    select
      count(*)::bigint as source_total,
      count(*) filter (where s.status = 'failed')::bigint as source_failed
    from public.sources s
    join public.bots b on b.id = s.bot_id
    where b.tenant_id = target_tenant_id
  ),
  job_stat as (
    select
      count(*) filter (where status = 'queued')::bigint as jobs_queued,
      count(*) filter (where status = 'running')::bigint as jobs_running,
      count(*) filter (where status = 'failed' and requested_at >= now() - interval '7 days')::bigint as jobs_failed_7d,
      count(*) filter (where status in ('done', 'ready') and requested_at >= now() - interval '7 days')::bigint as jobs_done_7d
    from public.indexing_jobs
    where tenant_id = target_tenant_id
  ),
  usage_stat as (
    select
      coalesce(sum(messages_count), 0)::bigint as messages_30d
    from public.usage_daily
    where tenant_id = target_tenant_id
      and usage_date >= (now()::date - 29)
  ),
  notification_stat as (
    select
      count(*)::bigint as unread_notifications
    from public.tenant_notifications
    where tenant_id = target_tenant_id
      and read_at is null
  ),
  storage_stat as (
    select app.get_tenant_storage_usage_bytes(target_tenant_id)::bigint as storage_usage_bytes
  )
  select
    bot_stat.bot_total,
    bot_stat.bot_ready,
    source_stat.source_total,
    source_stat.source_failed,
    job_stat.jobs_queued,
    job_stat.jobs_running,
    job_stat.jobs_failed_7d,
    job_stat.jobs_done_7d,
    usage_stat.messages_30d,
    notification_stat.unread_notifications,
    storage_stat.storage_usage_bytes
  from bot_stat, source_stat, job_stat, usage_stat, notification_stat, storage_stat
$$;

grant execute on function app.get_tenant_ops_snapshot(uuid) to authenticated;
create index if not exists idx_billing_events_retry_queue
  on public.billing_events (provider, processed_at, next_retry_at, created_at)
  where processed_at is null;

create index if not exists idx_billing_events_tenant_processed
  on public.billing_events (tenant_id, processed_at, created_at desc);

-- D) kill switch
create index if not exists idx_tenants_force_stopped on public.tenants(force_stopped);
create index if not exists idx_bots_force_stopped on public.bots(force_stopped);

-- E) bot-level AI model + hosted rooms/invites
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'bots_ai_model_ck') then
    alter table public.bots
      drop constraint bots_ai_model_ck;
  end if;

  if exists (select 1 from pg_constraint where conname = 'bots_ai_fallback_model_ck') then
    alter table public.bots
      drop constraint bots_ai_fallback_model_ck;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bots_ai_max_output_tokens_ck') then
    alter table public.bots
      add constraint bots_ai_max_output_tokens_ck
      check (ai_max_output_tokens between 200 and 4000);
  end if;
end
$$;

create table if not exists public.hosted_chat_rooms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '新しいチャット',
  is_archived boolean not null default false,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hosted_chat_messages (
  id bigserial primary key,
  room_id uuid not null references public.hosted_chat_rooms(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_member_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role membership_role not null default 'reader',
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  invited_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  email_sent_at timestamptz,
  email_send_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_hosted_access_blocks (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, bot_id, user_id)
);

create unique index if not exists uq_tenant_member_invites_active
on public.tenant_member_invites (tenant_id, email)
where status = 'pending';

create index if not exists idx_hosted_chat_rooms_owner on public.hosted_chat_rooms(owner_user_id, created_at desc);
create index if not exists idx_hosted_chat_rooms_tenant_bot on public.hosted_chat_rooms(tenant_id, bot_id, updated_at desc);
create index if not exists idx_hosted_chat_messages_room on public.hosted_chat_messages(room_id, created_at asc);
create index if not exists idx_tenant_member_invites_tenant_created on public.tenant_member_invites(tenant_id, created_at desc);
create index if not exists idx_bot_hosted_access_blocks_tenant_user on public.bot_hosted_access_blocks(tenant_id, user_id);
create index if not exists idx_bot_hosted_access_blocks_bot_user on public.bot_hosted_access_blocks(bot_id, user_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_hosted_chat_rooms_updated_at'
      and tgrelid = 'public.hosted_chat_rooms'::regclass
  ) then
    create trigger set_hosted_chat_rooms_updated_at
    before update on public.hosted_chat_rooms
    for each row execute procedure app.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_tenant_member_invites_updated_at'
      and tgrelid = 'public.tenant_member_invites'::regclass
  ) then
    create trigger set_tenant_member_invites_updated_at
    before update on public.tenant_member_invites
    for each row execute procedure app.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_bot_hosted_access_blocks_updated_at'
      and tgrelid = 'public.bot_hosted_access_blocks'::regclass
  ) then
    create trigger set_bot_hosted_access_blocks_updated_at
    before update on public.bot_hosted_access_blocks
    for each row execute procedure app.set_updated_at();
  end if;
end
$$;

alter table public.hosted_chat_rooms enable row level security;
alter table public.hosted_chat_messages enable row level security;
alter table public.tenant_member_invites enable row level security;
alter table public.bot_hosted_access_blocks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hosted_chat_rooms' and policyname = 'hosted_chat_rooms_select_member'
  ) then
    create policy "hosted_chat_rooms_select_member"
    on public.hosted_chat_rooms for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hosted_chat_rooms' and policyname = 'hosted_chat_rooms_write_editor'
  ) then
    create policy "hosted_chat_rooms_write_editor"
    on public.hosted_chat_rooms for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hosted_chat_messages' and policyname = 'hosted_chat_messages_select_member'
  ) then
    create policy "hosted_chat_messages_select_member"
    on public.hosted_chat_messages for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hosted_chat_messages' and policyname = 'hosted_chat_messages_write_editor'
  ) then
    create policy "hosted_chat_messages_write_editor"
    on public.hosted_chat_messages for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tenant_member_invites' and policyname = 'tenant_member_invites_select_member'
  ) then
    create policy "tenant_member_invites_select_member"
    on public.tenant_member_invites for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tenant_member_invites' and policyname = 'tenant_member_invites_write_editor'
  ) then
    create policy "tenant_member_invites_write_editor"
    on public.tenant_member_invites for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'bot_hosted_access_blocks' and policyname = 'bot_hosted_access_blocks_select_member'
  ) then
    create policy "bot_hosted_access_blocks_select_member"
    on public.bot_hosted_access_blocks for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'bot_hosted_access_blocks' and policyname = 'bot_hosted_access_blocks_write_editor'
  ) then
    create policy "bot_hosted_access_blocks_write_editor"
    on public.bot_hosted_access_blocks for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;
end
$$;

-- F) account_type-aware signup trigger behavior
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
  account_type text;
begin
  account_type := coalesce(new.raw_user_meta_data->>'account_type', 'owner');

  if account_type = 'member' then
    insert into public.profiles (user_id, full_name, default_tenant_id)
    values (new.id, new.raw_user_meta_data->>'full_name', null)
    on conflict (user_id) do update
    set full_name = excluded.full_name;
    return new;
  end if;

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
  values (new.id, new.raw_user_meta_data->>'full_name', new_tenant_id)
  on conflict (user_id) do update
  set
    full_name = excluded.full_name,
    default_tenant_id = excluded.default_tenant_id;

  insert into public.tenant_memberships (tenant_id, user_id, role, is_active)
  values (new_tenant_id, new.id, 'editor', true)
  on conflict (tenant_id, user_id) do update
  set role = excluded.role, is_active = true;

  return new;
end;
$$;

-- G) ensure final plan entitlements state
update public.plans
set
  max_api_keys = case code when 'starter' then 0 when 'lite' then 0 when 'standard' then 2 when 'pro' then 10 else max_api_keys end,
  max_hosted_pages = case code when 'starter' then 0 when 'lite' then 0 when 'standard' then 2 when 'pro' then 50 else max_hosted_pages end,
  internal_max_allowed_origins_cap = coalesce(internal_max_allowed_origins_cap, 200),
  api_rpm_limit = case code when 'starter' then 30 when 'lite' then 30 when 'standard' then 120 when 'pro' then 300 else api_rpm_limit end,
  overage_notify_threshold_percent = coalesce(overage_notify_threshold_percent, 80),
  spam_protection_profile = coalesce(nullif(spam_protection_profile, ''), 'standard'),
  support_level = coalesce(nullif(support_level, ''), 'documentation');

-- ============================================================================
-- schema-02 post-schema updates (consolidated from patch files)
-- Applied after base schema.sql to reproduce current Supabase state.
-- ============================================================================

-- 0) Promo codes (invitation codes with trial grant)
create table if not exists public.promo_codes (
  id          uuid        primary key default gen_random_uuid(),
  code        text        unique not null,
  description text,
  trial_days  integer     not null default 14,
  plan_code   text        null,
  max_uses    integer     null,
  used_count  integer     not null default 0,
  expires_at  timestamptz null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.increment_promo_code_used_count(p_code text)
returns void
language sql
security definer
as $$
  update public.promo_codes
  set used_count = used_count + 1
  where code = upper(p_code);
$$;

-- 1) Public storage bucket for bot logos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bot-logos',
  'bot-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'bot logos public read'
  ) then
    create policy "bot logos public read"
      on storage.objects for select
      using (bucket_id = 'bot-logos');
  end if;
end
$$;

-- 1) Public wrapper for usage increment RPC
create or replace function public.increment_usage_daily(
  p_tenant_id uuid,
  p_bot_id uuid,
  p_usage_date date,
  p_messages integer default 0,
  p_tokens_in integer default 0,
  p_tokens_out integer default 0
)
returns void
language sql
security definer
set search_path = public, app
as $$
  select app.increment_usage_daily(
    p_tenant_id,
    p_bot_id,
    p_usage_date,
    p_messages,
    p_tokens_in,
    p_tokens_out
  );
$$;

grant execute on function public.increment_usage_daily(uuid, uuid, date, integer, integer, integer) to authenticated;
grant execute on function public.increment_usage_daily(uuid, uuid, date, integer, integer, integer) to service_role;

-- 2) Legacy model id normalization (safe to re-run)
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'bots_ai_model_ck') then
    alter table public.bots drop constraint bots_ai_model_ck;
  end if;
  if exists (select 1 from pg_constraint where conname = 'bots_ai_fallback_model_ck') then
    alter table public.bots drop constraint bots_ai_fallback_model_ck;
  end if;
end
$$;

alter table public.bots
  alter column ai_model set default 'gpt-5-mini';

update public.bots
set
  ai_model = case ai_model
    when '5-nano' then 'gpt-5-nano'
    when '5-mini' then 'gpt-5-mini'
    when '5' then 'gpt-5-mini'
    when 'gpt-5' then 'gpt-5-mini'
    else ai_model
  end,
  ai_fallback_model = case ai_fallback_model
    when '5-nano' then 'gpt-5-nano'
    when '5-mini' then 'gpt-5-mini'
    when '5' then 'gpt-5-mini'
    when 'gpt-5' then 'gpt-5-mini'
    else ai_fallback_model
  end
where ai_model in ('5-nano', '5-mini', '5', 'gpt-5')
   or ai_fallback_model in ('5-nano', '5-mini', '5', 'gpt-5');

-- 3) Rate limit tables / functions (Supabase backed)
create table if not exists public.rate_limit_buckets (
  key          text primary key,
  count        integer not null default 1,
  window_start timestamptz not null default now(),
  expires_at   timestamptz not null
);

create table if not exists public.auth_lockouts (
  email_hash   text primary key,
  fail_count   integer not null default 0,
  locked_until timestamptz,
  last_fail_at timestamptz not null default now()
);

alter table public.rate_limit_buckets enable row level security;
alter table public.auth_lockouts enable row level security;

create or replace function public.rate_limit_check(
  p_key text,
  p_window_seconds integer
) returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
  v_now timestamptz := now();
  v_expiry timestamptz := v_now + (p_window_seconds || ' seconds')::interval;
begin
  insert into public.rate_limit_buckets (key, count, window_start, expires_at)
  values (p_key, 1, v_now, v_expiry)
  on conflict (key) do update
    set
      count = case when public.rate_limit_buckets.expires_at < v_now then 1 else public.rate_limit_buckets.count + 1 end,
      window_start = case when public.rate_limit_buckets.expires_at < v_now then v_now else public.rate_limit_buckets.window_start end,
      expires_at = case when public.rate_limit_buckets.expires_at < v_now then v_expiry else public.rate_limit_buckets.expires_at end
  returning count into v_count;

  return v_count;
end;
$$;

create or replace function public.auth_record_login_failure(
  p_email_hash text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_new_count integer;
  v_locked_until timestamptz;
  v_now timestamptz := now();
begin
  insert into public.auth_lockouts (email_hash, fail_count, locked_until, last_fail_at)
  values (p_email_hash, 0, null, v_now)
  on conflict (email_hash) do nothing;

  select fail_count, locked_until
    into v_new_count, v_locked_until
  from public.auth_lockouts
  where email_hash = p_email_hash
  for update;

  if v_locked_until is not null and v_locked_until < v_now then
    v_new_count := 0;
    v_locked_until := null;
  end if;

  v_new_count := v_new_count + 1;

  if v_locked_until is null then
    if v_new_count >= 20 then
      v_locked_until := v_now + interval '60 minutes';
    elsif v_new_count >= 10 then
      v_locked_until := v_now + interval '15 minutes';
    end if;
  end if;

  update public.auth_lockouts
  set
    fail_count = v_new_count,
    locked_until = v_locked_until,
    last_fail_at = v_now
  where email_hash = p_email_hash;

  return jsonb_build_object('fail_count', v_new_count, 'locked_until', v_locked_until);
end;
$$;

-- 4) pg_cron jobs
create extension if not exists pg_cron;

-- 6-a) audit log retention
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'knotic-audit-log-retention') THEN
    PERFORM cron.unschedule('knotic-audit-log-retention');
  END IF;
END
$$;

select cron.schedule(
  'knotic-audit-log-retention',
  '0 3 * * *',
  $cron$
    delete from public.audit_logs al
    where al.created_at < now() - (
      case
        when exists (
          select 1
          from public.subscriptions s
          join public.plans p on p.id = s.plan_id
          where s.tenant_id = al.tenant_id
            and p.code = 'lite'
            and s.status in ('active', 'trialing', 'past_due', 'unpaid', 'canceled', 'paused', 'incomplete')
        )
        then interval '7 days'
        else interval '30 days'
      end
    );
  $cron$
);

-- 6-b) free tier cleanup (Edge Function via pg_net)
create extension if not exists pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'knotic-free-tier-cleanup') THEN
    PERFORM cron.unschedule('knotic-free-tier-cleanup');
  END IF;
END
$$;

select cron.schedule(
  'knotic-free-tier-cleanup',
  '15 3 * * *',
  $cron$
    select net.http_post(
      url     := 'https://wbsrawibepsvcvkyzwtm.supabase.co/functions/v1/free-tier-cleanup',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $cron$
);

-- 6-d) rate limit cleanup jobs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rate-limit-bucket-cleanup') THEN
    PERFORM cron.unschedule('rate-limit-bucket-cleanup');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auth-lockout-cleanup') THEN
    PERFORM cron.unschedule('auth-lockout-cleanup');
  END IF;
END
$$;

select cron.schedule(
  'rate-limit-bucket-cleanup',
  '0 4 * * *',
  $$delete from public.rate_limit_buckets where expires_at < now()$$
);

select cron.schedule(
  'auth-lockout-cleanup',
  '0 4 * * *',
  $$delete from public.auth_lockouts where last_fail_at < now() - interval '100 hours'$$
);
