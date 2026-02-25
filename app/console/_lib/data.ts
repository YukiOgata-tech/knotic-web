import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type TenantMembership = {
  tenant_id: string
  role: "editor" | "reader"
  tenants: {
    id: string
    slug: string
    display_name: string
  } | null
}

export type PlanSummary = {
  code: string
  name: string
  monthly_price_jpy: number
  max_bots: number
  max_monthly_messages: number
  max_storage_mb: number
  has_api: boolean
  has_hosted_page: boolean
  has_widget: boolean
  allow_model_selection: boolean
  is_bot_limit_display_unlimited: boolean
  internal_max_bots_cap: number
}

export function toMonthStartISO() {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return monthStart.toISOString().slice(0, 10)
}

export async function requireConsoleContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/console")
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role, tenants(id, slug, display_name)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)

  const membership = (memberships?.[0] as TenantMembership | undefined) ?? null
  return {
    supabase,
    user,
    membership,
    membershipError,
  }
}

export async function fetchConsoleData(tenantId: string) {
  const supabase = await createClient()
  const [{ data: bots }, { data: sources }, { data: subscriptions }, { data: usage }, logsMeta, { data: tokens }, { data: apiKeys, error: apiKeyError }, { data: tenantRow, error: aiSettingsError }, { data: notifications, error: notificationError }] =
    await Promise.all([
      supabase
        .from("bots")
        .select("id, public_id, name, description, status, is_public, chat_purpose, access_mode, display_name, welcome_message, placeholder_text, disclaimer_text, show_citations, history_turn_limit, require_auth_for_hosted, ui_header_bg_color, ui_header_text_color, ui_footer_bg_color, ui_footer_text_color, widget_enabled, widget_mode, widget_position, widget_launcher_label, widget_policy_text, widget_redirect_new_tab, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      supabase
        .from("sources")
        .select("id, bot_id, type, status, url, file_name, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("subscriptions")
        .select(
          "id, status, current_period_end, trial_ends_at, plans(code,name,monthly_price_jpy,max_bots,max_monthly_messages,max_storage_mb,has_api,has_hosted_page,has_widget,allow_model_selection,is_bot_limit_display_unlimited,internal_max_bots_cap)"
        )
        .eq("tenant_id", tenantId)
        .in("status", ["trialing", "active", "past_due", "unpaid", "canceled"])
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("usage_daily")
        .select("messages_count, tokens_in, tokens_out")
        .eq("tenant_id", tenantId)
        .gte("usage_date", toMonthStartISO()),
      supabase
        .from("chat_logs")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("bot_public_tokens")
        .select("id, bot_id, allowed_origins, revoked_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("tenant_api_keys")
        .select("id, name, key_prefix, key_last4, is_active, last_used_at, expires_at, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      supabase
        .from("tenants")
        .select("ai_default_model, ai_fallback_model, ai_allow_model_override, ai_max_output_tokens")
        .eq("id", tenantId)
        .maybeSingle(),
      supabase
        .from("tenant_notifications")
        .select("id, level, title, message, created_at, read_at")
        .eq("tenant_id", tenantId)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const aiSettings = tenantRow
    ? {
        default_model: tenantRow.ai_default_model,
        fallback_model: tenantRow.ai_fallback_model,
        allow_model_override: tenantRow.ai_allow_model_override,
        max_output_tokens: tenantRow.ai_max_output_tokens,
      }
    : null

  const primarySubscription = subscriptions?.[0] as
    | {
        status: string
        current_period_end: string | null
        trial_ends_at: string | null
        plans: PlanSummary | null
      }
    | undefined

  const currentPlan = primarySubscription?.plans ?? null
  const botCount = bots?.length ?? 0
  const sourceCount = sources?.length ?? 0
  const monthlyMessages = (usage ?? []).reduce((sum, row) => sum + (row.messages_count ?? 0), 0)
  const monthlyTokensOut = (usage ?? []).reduce((sum, row) => sum + (row.tokens_out ?? 0), 0)
  const logsCount = logsMeta.count ?? 0

  const sourceByBotId = new Map<string, typeof sources>()
  for (const source of sources ?? []) {
    const key = source.bot_id ?? ""
    const list = sourceByBotId.get(key) ?? []
    list.push(source)
    sourceByBotId.set(key, list)
  }

  const tokenByBotId = new Map<string, { id: string; allowed_origins: string[]; revoked_at: string | null; created_at: string }>()
  for (const token of tokens ?? []) {
    if (!token.revoked_at && !tokenByBotId.has(token.bot_id)) {
      tokenByBotId.set(token.bot_id, token as { id: string; allowed_origins: string[]; revoked_at: string | null; created_at: string })
    }
  }

  return {
    bots: bots ?? [],
    sources: sources ?? [],
    subscriptions: subscriptions ?? [],
    usage: usage ?? [],
    logsCount,
    tokens: tokens ?? [],
    apiKeys: apiKeys ?? [],
    apiKeyError,
    aiSettings,
    aiSettingsError,
    notifications: notifications ?? [],
    notificationError,
    primarySubscription,
    currentPlan,
    botCount,
    sourceCount,
    monthlyMessages,
    monthlyTokensOut,
    sourceByBotId,
    tokenByBotId,
  }
}



