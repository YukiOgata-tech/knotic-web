import { createAdminClient } from "@/lib/supabase/admin"

export type TenantPlanSnapshot = {
  subscriptionStatus: string
  planCode: string
  planName: string
  maxBots: number
  maxHostedPages: number
  maxMonthlyMessages: number
  maxStorageMb: number
  internalMaxBotsCap: number
  hasApi: boolean
  hasHostedPage: boolean
  billingMode: "stripe" | "bank_transfer" | "invoice" | "manual"
}

type NotificationPayload = {
  tenantId: string
  level: "info" | "warning" | "critical"
  kind: string
  title: string
  message: string
  dedupeKey: string
  metadata?: Record<string, unknown>
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due"])
const BLOCKED_SUBSCRIPTION_STATUSES = new Set(["unpaid", "canceled", "paused", "incomplete"])

type PlanRow = {
  code: string
  name: string
  max_bots: number
  max_hosted_pages: number
  max_monthly_messages: number
  max_storage_mb: number
  internal_max_bots_cap: number
  has_api: boolean
  has_hosted_page: boolean
}

export class QuotaError extends Error {
  code:
    | "subscription_blocked"
    | "bot_limit"
    | "message_limit"
    | "storage_limit"
    | "hosted_page_unavailable"
    | "hosted_page_limit"
  constructor(code: QuotaError["code"], message: string) {
    super(message)
    this.code = code
  }
}

export function getMonthStartString() {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return monthStart.toISOString().slice(0, 10)
}

function normalizePlans(plansRaw: unknown) {
  return (Array.isArray(plansRaw) ? plansRaw[0] : plansRaw) as PlanRow | null
}

function toSnapshot(status: string, plans: PlanRow, billingMode: TenantPlanSnapshot["billingMode"]): TenantPlanSnapshot {
  return {
    subscriptionStatus: status,
    planCode: plans.code,
    planName: plans.name,
    maxBots: plans.max_bots,
    maxHostedPages: plans.max_hosted_pages,
    maxMonthlyMessages: plans.max_monthly_messages,
    maxStorageMb: plans.max_storage_mb,
    internalMaxBotsCap: plans.internal_max_bots_cap,
    hasApi: plans.has_api,
    hasHostedPage: plans.has_hosted_page,
    billingMode,
  }
}

async function getOverrideSnapshot(tenantId: string): Promise<TenantPlanSnapshot | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("tenant_contract_overrides")
    .select(
      "status, billing_mode, effective_until, plans(code,name,max_bots,max_hosted_pages,max_monthly_messages,max_storage_mb,internal_max_bots_cap,has_api,has_hosted_page)"
    )
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  if (error || !data?.plans) return null

  const effectiveUntil = data.effective_until ? new Date(String(data.effective_until)).getTime() : null
  if (effectiveUntil && effectiveUntil <= Date.now()) return null

  const plans = normalizePlans(data.plans)
  if (!plans?.code) return null

  const billingMode = (data.billing_mode as TenantPlanSnapshot["billingMode"] | null) ?? "manual"
  return toSnapshot(data.status as string, plans, billingMode)
}

export async function getTenantPlanSnapshot(tenantId: string): Promise<TenantPlanSnapshot> {
  const override = await getOverrideSnapshot(tenantId)
  if (override) return override

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "status, plans(code,name,max_bots,max_hosted_pages,max_monthly_messages,max_storage_mb,internal_max_bots_cap,has_api,has_hosted_page)"
    )
    .eq("tenant_id", tenantId)
    .in("status", ["trialing", "active", "past_due", "unpaid", "canceled", "paused", "incomplete"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.plans) {
    throw new Error("契約プラン情報が取得できませんでした。subscriptions / plans / overrides を確認してください。")
  }

  const plans = normalizePlans(data.plans)
  if (!plans?.code) {
    throw new Error("契約プラン情報が不正です。")
  }

  return toSnapshot(data.status as string, plans, "stripe")
}

export function assertSubscriptionOperational(plan: TenantPlanSnapshot) {
  if (BLOCKED_SUBSCRIPTION_STATUSES.has(plan.subscriptionStatus)) {
    throw new QuotaError(
      "subscription_blocked",
      "契約状態によりボット実行は停止中です。管理画面で契約状態を確認してください。"
    )
  }
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(plan.subscriptionStatus)) {
    throw new QuotaError(
      "subscription_blocked",
      "契約状態が有効ではありません。支払い状態を確認してください。"
    )
  }
}

export function getEffectiveBotLimit(plan: TenantPlanSnapshot) {
  if (plan.internalMaxBotsCap > 0) {
    return Math.min(plan.maxBots, plan.internalMaxBotsCap)
  }
  return plan.maxBots
}

export async function getTenantBotCount(tenantId: string) {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("bots")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  if (error) throw error
  return count ?? 0
}

async function getHostedEligibleBotIds(tenantId: string, limit: number) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("bots")
    .select("id")
    .eq("tenant_id", tenantId)
    .neq("status", "archived")
    .or("is_public.eq.true,access_mode.eq.internal,require_auth_for_hosted.eq.true")
    .order("created_at", { ascending: true })
    .limit(Math.max(1, limit))

  if (error) throw error
  return (data ?? []).map((row) => String(row.id))
}

async function getTenantHostedCandidateCount(tenantId: string) {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("bots")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .neq("status", "archived")
    .or("is_public.eq.true,access_mode.eq.internal,require_auth_for_hosted.eq.true")

  if (error) throw error
  return count ?? 0
}

export async function getTenantMonthlyMessages(tenantId: string) {
  const admin = createAdminClient()
  const monthStart = getMonthStartString()
  const { data, error } = await admin
    .from("usage_daily")
    .select("messages_count")
    .eq("tenant_id", tenantId)
    .gte("usage_date", monthStart)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + (row.messages_count ?? 0), 0)
}

export async function getTenantStorageUsageBytes(tenantId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("get_tenant_storage_usage_bytes", {
    target_tenant_id: tenantId,
  })
  if (error) {
    const { data: sourceRows } = await admin
      .from("sources")
      .select("file_size_bytes, bots!inner(tenant_id)")
      .eq("bots.tenant_id", tenantId)
    const bytes = (sourceRows ?? []).reduce(
      (sum, row) => sum + Number(row.file_size_bytes ?? 0),
      0
    )
    return bytes
  }
  return Number(data ?? 0)
}

export async function createTenantNotification(payload: NotificationPayload) {
  const admin = createAdminClient()
  try {
    const { error } = await admin.from("tenant_notifications").upsert(
      {
        tenant_id: payload.tenantId,
        level: payload.level,
        kind: payload.kind,
        title: payload.title,
        message: payload.message,
        dedupe_key: payload.dedupeKey,
        metadata: payload.metadata ?? {},
      },
      { onConflict: "dedupe_key" }
    )
    if (error) return
  } catch {
    return
  }
}

export async function assertTenantCanCreateBot(tenantId: string) {
  const plan = await getTenantPlanSnapshot(tenantId)
  assertSubscriptionOperational(plan)
  const currentBotCount = await getTenantBotCount(tenantId)
  const botLimit = getEffectiveBotLimit(plan)
  if (currentBotCount >= botLimit) {
    await createTenantNotification({
      tenantId,
      level: "warning",
      kind: "bot_limit_reached",
      title: "Bot上限に達しています",
      message: `現在プランのBot上限（${botLimit}）に達しているため、新規Botを作成できません。`,
      dedupeKey: `bot_limit:${tenantId}:${plan.planCode}:${botLimit}`,
      metadata: { botLimit, currentBotCount, planCode: plan.planCode },
    })
    throw new QuotaError("bot_limit", "Bot上限に達しているため、新規Botを作成できません。")
  }
}

export async function assertTenantCanConsumeMessage(tenantId: string) {
  const plan = await getTenantPlanSnapshot(tenantId)
  assertSubscriptionOperational(plan)
  const usedMessages = await getTenantMonthlyMessages(tenantId)
  if (usedMessages >= plan.maxMonthlyMessages) {
    const month = getMonthStartString()
    await createTenantNotification({
      tenantId,
      level: "critical",
      kind: "message_limit_reached",
      title: "月間メッセージ上限に達しました",
      message: "契約プランの月間メッセージ上限に達したため、応答を停止しています。",
      dedupeKey: `msg_limit:${tenantId}:${month}`,
      metadata: { usedMessages, maxMonthlyMessages: plan.maxMonthlyMessages, month },
    })
    throw new QuotaError("message_limit", "月間メッセージ上限に達したため、現在は応答を停止しています。")
  }
}

export async function assertTenantCanIndexData(tenantId: string, incomingBytes = 0) {
  const plan = await getTenantPlanSnapshot(tenantId)
  assertSubscriptionOperational(plan)
  const storageBytes = await getTenantStorageUsageBytes(tenantId)
  const maxBytes = plan.maxStorageMb * 1024 * 1024
  if (storageBytes + incomingBytes > maxBytes) {
    await createTenantNotification({
      tenantId,
      level: "warning",
      kind: "storage_limit_reached",
      title: "データ容量上限に達しています",
      message: "契約プランの保存容量上限を超えるため、追加インデックスを停止しました。",
      dedupeKey: `storage_limit:${tenantId}:${plan.planCode}:${maxBytes}`,
      metadata: { storageBytes, incomingBytes, maxBytes, planCode: plan.planCode },
    })
    throw new QuotaError("storage_limit", "データ容量上限を超えるため、この操作は実行できません。")
  }
}

export async function assertTenantCanUseHostedPage(tenantId: string, botId?: string) {
  const plan = await getTenantPlanSnapshot(tenantId)
  assertSubscriptionOperational(plan)

  if (!plan.hasHostedPage || plan.maxHostedPages <= 0) {
    throw new QuotaError(
      "hosted_page_unavailable",
      "現在の契約プランではHosted URL公開は利用できません。"
    )
  }

  const hostedCandidateCount = await getTenantHostedCandidateCount(tenantId)
  if (hostedCandidateCount <= plan.maxHostedPages) return

  if (!botId) {
    throw new QuotaError(
      "hosted_page_limit",
      `Hosted URLの利用上限（${plan.maxHostedPages}）を超えています。`
    )
  }

  const allowedBotIds = await getHostedEligibleBotIds(tenantId, plan.maxHostedPages)
  if (!allowedBotIds.includes(botId)) {
    throw new QuotaError(
      "hosted_page_limit",
      `Hosted URLの利用上限（${plan.maxHostedPages}）を超えています。`
    )
  }
}
