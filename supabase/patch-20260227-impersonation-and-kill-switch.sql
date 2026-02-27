-- Platform admin features: impersonation support + emergency kill switch

alter table public.tenants
  add column if not exists force_stopped boolean not null default false,
  add column if not exists force_stop_reason text,
  add column if not exists force_stopped_at timestamptz,
  add column if not exists force_stopped_by uuid references auth.users(id) on delete set null;

alter table public.bots
  add column if not exists force_stopped boolean not null default false,
  add column if not exists force_stop_reason text,
  add column if not exists force_stopped_at timestamptz,
  add column if not exists force_stopped_by uuid references auth.users(id) on delete set null;

create index if not exists idx_tenants_force_stopped on public.tenants(force_stopped);
create index if not exists idx_bots_force_stopped on public.bots(force_stopped);
