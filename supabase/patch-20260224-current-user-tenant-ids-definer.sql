-- Apply after running supabase/schema.sql
-- Fix: allow tenant membership lookup under RLS policies

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
