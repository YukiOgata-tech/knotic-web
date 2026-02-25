-- Apply after supabase/schema.sql
-- Widget distribution settings for existing bots table

alter table public.bots
  add column if not exists widget_enabled boolean not null default true,
  add column if not exists widget_mode text not null default 'overlay',
  add column if not exists widget_position text not null default 'right-bottom',
  add column if not exists widget_launcher_label text not null default 'チャット',
  add column if not exists widget_policy_text text not null default 'このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。',
  add column if not exists widget_redirect_new_tab boolean not null default false;

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
