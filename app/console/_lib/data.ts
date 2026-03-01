import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { IMPERSONATION_COOKIE_NAME, parseImpersonationToken } from "@/lib/impersonation"

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
  max_hosted_pages: number
  max_monthly_messages: number
  max_storage_mb: number
  has_api: boolean
  has_hosted_page: boolean
  has_widget: boolean
  allow_model_selection: boolean
  is_bot_limit_display_unlimited: boolean
  internal_max_bots_cap: number
}

export type AuditLogRow = {
  id: string
  tenant_id: string
  actor_user_id: string | null
  action: string
  target_type: string
  target_id: string | null
  before_json: Record<string, unknown> | null
  after_json: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type OperationSummary = {
  messagesToday: number
  messages7d: number
  messages30d: number
  monthlyLimit: number | null
  monthlyUsageRate: number | null
  storageUsedBytes: number
  storageUsedMb: number
  storageLimitMb: number | null
  storageUsageRate: number | null
  botTotal: number
  botPublic: number
  botInternal: number
  botReady: number
  sourceTotal: number
  sourceFailed: number
  sourceRunning: number
  jobsQueued: number
  jobsRunning: number
  jobsFailed7d: number
  jobsDone7d: number
  unreadNotifications: number
  recentAudit: AuditLogRow[]
  auditError: { message?: string } | null
}

export type TenantMemberRow = {
  user_id: string
  role: "editor" | "reader"
  is_active: boolean
  created_at: string
}

export type TenantInviteRow = {
  id: string
  email: string
  role: "editor" | "reader"
  status: "pending" | "accepted" | "revoked" | "expired"
  expires_at: string
  created_at: string
}

export function toMonthStartISO() {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return monthStart.toISOString().slice(0, 10)
}

function dayStartISO(daysAgo: number) {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  now.setUTCDate(now.getUTCDate() - daysAgo)
  return now.toISOString().slice(0, 10)
}

function timestampISO(daysAgo: number) {
  const now = new Date()
  now.setUTCDate(now.getUTCDate() - daysAgo)
  return now.toISOString()
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

  let membership = (memberships?.[0] as TenantMembership | undefined) ?? null
  let impersonation: {
    active: boolean
    tenantId: string
    expiresAt: string
    actorUserId: string
  } | null = null

  const token = (await cookies()).get(IMPERSONATION_COOKIE_NAME)?.value
  const parsed = parseImpersonationToken(token)
  if (parsed && parsed.actorUserId === user.id) {
    const admin = createAdminClient()
    const { data: adminRow } = await admin
      .from("platform_admin_users")
      .select("is_active")
      .eq("user_id", user.id)
      .maybeSingle()

    if (adminRow?.is_active) {
      const { data: tenantRow } = await admin
        .from("tenants")
        .select("id, slug, display_name")
        .eq("id", parsed.tenantId)
        .maybeSingle()

      if (tenantRow?.id) {
        membership = {
          tenant_id: tenantRow.id,
          role: "reader",
          tenants: {
            id: tenantRow.id,
            slug: tenantRow.slug,
            display_name: tenantRow.display_name,
          },
        }
        impersonation = {
          active: true,
          tenantId: parsed.tenantId,
          actorUserId: parsed.actorUserId,
          expiresAt: new Date(parsed.exp * 1000).toISOString(),
        }
      }
    }
  }

  return {
    supabase,
    user,
    membership,
    membershipError,
    impersonation,
  }
}

export async function fetchConsolePlanLabel(tenantId: string) {
  const supabase = await createClient()

  const [{ data: override }, { data: subscription }] = await Promise.all([
    supabase
      .from("tenant_contract_overrides")
      .select("is_active, plans(name, code)")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, plans(name, code)")
      .eq("tenant_id", tenantId)
      .in("status", ["trialing", "active", "past_due", "unpaid", "canceled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const pickPlanLabel = (
    plan:
      | { name?: string | null; code?: string | null }
      | Array<{ name?: string | null; code?: string | null }>
      | null
      | undefined
  ) => {
    const row = Array.isArray(plan) ? plan[0] : plan
    if (!row) return null
    return row.name ?? row.code ?? null
  }

  return pickPlanLabel(override?.plans) ?? pickPlanLabel(subscription?.plans) ?? "未契約"
}
export async function fetchConsoleData(tenantId: string) {
  const supabase = await createClient()
  const [
    { data: bots },
    { data: sources },
    { data: subscriptions },
    { data: usage },
    logsMeta,
    { data: tokens },
    { data: apiKeys, error: apiKeyError },
    { data: notifications, error: notificationError },
    storageUsage,
  ] = await Promise.all([
    supabase
      .from("bots")
      .select(
        "id, public_id, name, description, status, is_public, chat_purpose, access_mode, display_name, welcome_message, placeholder_text, disclaimer_text, show_citations, history_turn_limit, require_auth_for_hosted, ui_header_bg_color, ui_header_text_color, ui_footer_bg_color, ui_footer_text_color, widget_enabled, widget_mode, widget_position, widget_launcher_label, widget_policy_text, widget_redirect_new_tab, ai_model, ai_fallback_model, ai_max_output_tokens, created_at"
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("sources")
      .select("id, bot_id, type, status, url, file_name, file_size_bytes, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("subscriptions")
      .select(
        "id, status, current_period_end, trial_ends_at, plans(code,name,monthly_price_jpy,max_bots,max_hosted_pages,max_monthly_messages,max_storage_mb,has_api,has_hosted_page,has_widget,allow_model_selection,is_bot_limit_display_unlimited,internal_max_bots_cap)"
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
      .from("tenant_notifications")
      .select("id, level, title, message, created_at, read_at")
      .eq("tenant_id", tenantId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.rpc("get_tenant_storage_usage_bytes", { target_tenant_id: tenantId }),
  ])

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
  const storageUsedBytes = typeof storageUsage.data === "number" ? storageUsage.data : 0
  const storageUsedMb = Math.round((storageUsedBytes / (1024 * 1024)) * 10) / 10

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
    notifications: notifications ?? [],
    notificationError,
    primarySubscription,
    currentPlan,
    botCount,
    sourceCount,
    monthlyMessages,
    monthlyTokensOut,
    storageUsedBytes,
    storageUsedMb,
    sourceByBotId,
    tokenByBotId,
  }
}

export async function fetchOperationSummary(tenantId: string): Promise<OperationSummary> {
  const supabase = await createClient()
  const monthStart = toMonthStartISO()
  const sevenDayStart = dayStartISO(6)
  const today = dayStartISO(0)
  const jobsStart = timestampISO(7)

  const [
    { data: bots },
    { data: sources },
    { data: usage },
    { data: jobs },
    { data: subscriptions },
    notificationsMeta,
    storageUsage,
    { data: recentAudit, error: auditError },
  ] = await Promise.all([
    supabase.from("bots").select("id, status, is_public, access_mode").eq("tenant_id", tenantId),
    supabase.from("sources").select("id, status"),
    supabase
      .from("usage_daily")
      .select("usage_date, messages_count")
      .eq("tenant_id", tenantId)
      .gte("usage_date", monthStart),
    supabase
      .from("indexing_jobs")
      .select("id, status, requested_at")
      .eq("tenant_id", tenantId)
      .gte("requested_at", jobsStart)
      .order("requested_at", { ascending: false })
      .limit(200),
    supabase
      .from("subscriptions")
      .select("plans(max_monthly_messages, max_storage_mb)")
      .eq("tenant_id", tenantId)
      .in("status", ["trialing", "active", "past_due", "unpaid", "canceled"])
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("tenant_notifications")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("read_at", null),
    supabase.rpc("get_tenant_storage_usage_bytes", { target_tenant_id: tenantId }),
    supabase
      .from("audit_logs")
      .select("id, tenant_id, actor_user_id, action, target_type, target_id, before_json, after_json, metadata, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const rows = usage ?? []
  const messages30d = rows.reduce((sum, row) => sum + (row.messages_count ?? 0), 0)
  const messages7d = rows
    .filter((row) => (row.usage_date ?? "") >= sevenDayStart)
    .reduce((sum, row) => sum + (row.messages_count ?? 0), 0)
  const messagesToday = rows
    .filter((row) => (row.usage_date ?? "") >= today)
    .reduce((sum, row) => sum + (row.messages_count ?? 0), 0)

  const primaryPlan = (subscriptions?.[0] as { plans?: { max_monthly_messages?: number; max_storage_mb?: number } | null } | undefined)
    ?.plans
  const monthlyLimit = primaryPlan?.max_monthly_messages ?? null
  const monthlyUsageRate = monthlyLimit && monthlyLimit > 0 ? Math.min(999, (messages30d / monthlyLimit) * 100) : null

  const storageUsedBytes = typeof storageUsage.data === "number" ? storageUsage.data : 0
  const storageUsedMb = Math.round((storageUsedBytes / (1024 * 1024)) * 10) / 10
  const storageLimitMb = primaryPlan?.max_storage_mb ?? null
  const storageUsageRate = storageLimitMb && storageLimitMb > 0 ? Math.min(999, (storageUsedMb / storageLimitMb) * 100) : null

  const botRows = bots ?? []
  const sourceRows = sources ?? []
  const jobRows = jobs ?? []

  return {
    messagesToday,
    messages7d,
    messages30d,
    monthlyLimit,
    monthlyUsageRate,
    storageUsedBytes,
    storageUsedMb,
    storageLimitMb,
    storageUsageRate,
    botTotal: botRows.length,
    botPublic: botRows.filter((bot) => Boolean(bot.is_public)).length,
    botInternal: botRows.filter((bot) => bot.access_mode === "internal").length,
    botReady: botRows.filter((bot) => bot.status === "ready" || bot.status === "running").length,
    sourceTotal: sourceRows.length,
    sourceFailed: sourceRows.filter((source) => source.status === "failed").length,
    sourceRunning: sourceRows.filter((source) => source.status === "running" || source.status === "queued").length,
    jobsQueued: jobRows.filter((job) => job.status === "queued").length,
    jobsRunning: jobRows.filter((job) => job.status === "running").length,
    jobsFailed7d: jobRows.filter((job) => job.status === "failed").length,
    jobsDone7d: jobRows.filter((job) => job.status === "done" || job.status === "ready").length,
    unreadNotifications: notificationsMeta.count ?? 0,
    recentAudit: (recentAudit ?? []) as AuditLogRow[],
    auditError,
  }
}

export async function fetchAuditLogs(
  tenantId: string,
  options?: {
    action?: string
    targetType?: string
    limit?: number
  }
) {
  const supabase = await createClient()
  let query = supabase
    .from("audit_logs")
    .select("id, tenant_id, actor_user_id, action, target_type, target_id, before_json, after_json, metadata, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(options?.limit ?? 100, 1), 200))

  if (options?.action) query = query.eq("action", options.action)
  if (options?.targetType) query = query.eq("target_type", options.targetType)

  const { data, error } = await query

  return {
    rows: (data ?? []) as AuditLogRow[],
    error,
  }
}

export async function fetchTenantMembersAndInvites(tenantId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [{ data: membersRaw, error: membersError }, { data: invitesRaw, error: invitesError }, usersPage] =
    await Promise.all([
      supabase
        .from("tenant_memberships")
        .select("user_id, role, is_active, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),
      supabase
        .from("tenant_member_invites")
        .select("id, email, role, status, expires_at, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50),
      admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    ])

  const emailByUserId = new Map<string, string>()
  for (const user of usersPage.data.users ?? []) {
    emailByUserId.set(user.id, user.email ?? "-")
  }

  return {
    members: (membersRaw ?? []) as TenantMemberRow[],
    invites: (invitesRaw ?? []) as TenantInviteRow[],
    emailByUserId,
    membersError,
    invitesError,
  }
}



