-- 2026-03 hosted-access patch
-- Bot-specific Hosted URL access control (default allow; blocked rows only).
-- Safe to re-run (idempotent).

create table if not exists public.bot_hosted_access_blocks (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, bot_id, user_id)
);

create index if not exists idx_bot_hosted_access_blocks_tenant_user
  on public.bot_hosted_access_blocks(tenant_id, user_id);
create index if not exists idx_bot_hosted_access_blocks_bot_user
  on public.bot_hosted_access_blocks(bot_id, user_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_bot_hosted_access_blocks_updated_at'
      and tgrelid = 'public.bot_hosted_access_blocks'::regclass
  ) then
    create trigger set_bot_hosted_access_blocks_updated_at
    before update on public.bot_hosted_access_blocks
    for each row execute procedure app.set_updated_at();
  end if;
end
$$;

alter table public.bot_hosted_access_blocks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bot_hosted_access_blocks'
      and policyname = 'bot_hosted_access_blocks_select_member'
  ) then
    create policy "bot_hosted_access_blocks_select_member"
    on public.bot_hosted_access_blocks for select
    using (app.can_read_tenant(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bot_hosted_access_blocks'
      and policyname = 'bot_hosted_access_blocks_write_editor'
  ) then
    create policy "bot_hosted_access_blocks_write_editor"
    on public.bot_hosted_access_blocks for all
    using (app.can_write_tenant(tenant_id))
    with check (app.can_write_tenant(tenant_id));
  end if;
end
$$;
