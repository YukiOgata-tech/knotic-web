-- Consolidated patch for 2026-02-26 changes
-- Includes:
-- 1) patch-20260226-platform-admin-console.sql
-- 2) patch-20260226-audit-and-ops.sql
-- 3) patch-20260226-billing-events-retry.sql

-- ============================================================
-- BEGIN: supabase\patch-20260226-platform-admin-console.sql
-- ============================================================

-- Platform admin console and tenant contract overrides (Stripe-independent)

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


-- END: supabase\patch-20260226-platform-admin-console.sql

-- ============================================================
-- BEGIN: supabase\patch-20260226-audit-and-ops.sql
-- ============================================================

-- Audit log and operations helper patch (non-breaking, additive)
-- File: supabase/patch-20260226-audit-and-ops.sql

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



-- END: supabase\patch-20260226-audit-and-ops.sql

-- ============================================================
-- BEGIN: supabase\patch-20260226-billing-events-retry.sql
-- ============================================================

-- Billing webhook retry metadata patch
-- Additive patch for robust retry operations

alter table public.billing_events
  add column if not exists processing_error text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists next_retry_at timestamptz;

create index if not exists idx_billing_events_retry_queue
  on public.billing_events (provider, processed_at, next_retry_at, created_at)
  where processed_at is null;

create index if not exists idx_billing_events_tenant_processed
  on public.billing_events (tenant_id, processed_at, created_at desc);


-- END: supabase\patch-20260226-billing-events-retry.sql


