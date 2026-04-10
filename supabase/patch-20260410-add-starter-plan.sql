-- Starterプラン追加 & Lite料金改定（¥10,000 → ¥9,800）
-- 2026-04-10

-- Starterプランを追加
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
) values (
  'starter', 'Starter', 4900, 1, 300, 75, false, false, true, false, false, 50, 0, 0, null, 200, 30, 80, 'standard', 'documentation', false
)
on conflict (code) do update
set
  name                           = excluded.name,
  monthly_price_jpy              = excluded.monthly_price_jpy,
  max_bots                       = excluded.max_bots,
  max_monthly_messages           = excluded.max_monthly_messages,
  max_storage_mb                 = excluded.max_storage_mb,
  has_api                        = excluded.has_api,
  has_hosted_page                = excluded.has_hosted_page,
  has_widget                     = excluded.has_widget,
  allow_model_selection          = excluded.allow_model_selection,
  is_bot_limit_display_unlimited = excluded.is_bot_limit_display_unlimited,
  internal_max_bots_cap          = excluded.internal_max_bots_cap,
  max_api_keys                   = excluded.max_api_keys,
  max_hosted_pages               = excluded.max_hosted_pages,
  max_allowed_origins            = excluded.max_allowed_origins,
  internal_max_allowed_origins_cap = excluded.internal_max_allowed_origins_cap,
  api_rpm_limit                  = excluded.api_rpm_limit,
  overage_notify_threshold_percent = excluded.overage_notify_threshold_percent,
  spam_protection_profile        = excluded.spam_protection_profile,
  support_level                  = excluded.support_level,
  has_line                       = excluded.has_line,
  is_active                      = true;

-- Liteプラン料金改定
update public.plans
set monthly_price_jpy = 9800
where code = 'lite';
