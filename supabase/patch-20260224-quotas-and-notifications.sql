-- Apply after:
-- 1) supabase/schema.sql
-- 2) supabase/patch-20260224-console-management.sql
-- 3) supabase/patch-20260224-indexing-pipeline.sql
--
-- Adds quota enforcement helpers and tenant notifications.

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

create index if not exists idx_tenant_notifications_tenant_created
  on public.tenant_notifications(tenant_id, created_at desc);
create index if not exists idx_tenant_notifications_unread
  on public.tenant_notifications(tenant_id)
  where read_at is null;

alter table public.tenant_notifications enable row level security;

create policy "tenant_notifications_select_member"
on public.tenant_notifications for select
using (app.can_read_tenant(tenant_id));

create policy "tenant_notifications_write_editor"
on public.tenant_notifications for all
using (app.can_write_tenant(tenant_id))
with check (app.can_write_tenant(tenant_id));

alter table public.sources
  add column if not exists file_size_bytes bigint not null default 0;

do $$
begin
  if to_regclass('public.source_pages') is not null then
    alter table public.source_pages
      add column if not exists raw_bytes bigint not null default 0,
      add column if not exists text_bytes bigint not null default 0;
  end if;
end
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

