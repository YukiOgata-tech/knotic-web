-- audit_logs 保持期間の自動削除 (pg_cron)
--
-- 前提: Supabase ダッシュボード > Database > Extensions > pg_cron を有効化してから実行すること。
--
-- 保持ポリシー:
--   Lite プラン    : 7日間
--   Standard / Pro : 30日間
--   サブスクリプション未設定テナント : 30日間（安全側）
--
-- 実行スケジュール: 毎日 03:00 UTC (12:00 JST)

-- pg_cron 拡張を有効化
create extension if not exists pg_cron;

-- 既存の同名ジョブがあれば削除してから再登録
do $$
begin
  if exists (select 1 from cron.job where jobname = 'knotic-audit-log-retention') then
    perform cron.unschedule('knotic-audit-log-retention');
  end if;
end
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
