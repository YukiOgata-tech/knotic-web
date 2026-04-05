-- free-tier-cleanup Edge Function を毎日 UTC 3:15 に pg_cron + pg_net で呼び出す
-- pg_net は Supabase プロジェクトでデフォルト有効

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
