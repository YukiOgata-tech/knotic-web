import { createAdminClient } from "@/lib/supabase/admin"
import {
  createTenantNotification,
  getEffectiveBotLimit,
  getTenantBotCount,
  getTenantPlanSnapshot,
  getTenantStorageUsageBytes,
} from "@/lib/billing/limits"

type EnforcementResult = {
  tenantId: string
  planCode: string
  apiKeysRevoked: number
  botOverLimit: number
  storageOverBytes: number
  hostedOverLimit: number
}

async function getHostedCandidateBotRows(tenantId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("bots")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .neq("status", "archived")
    .or("is_public.eq.true,access_mode.eq.internal,require_auth_for_hosted.eq.true")
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as Array<{ id: string; name: string }>
}

export async function enforceTenantPlanLimits(tenantId: string): Promise<EnforcementResult> {
  const admin = createAdminClient()
  const plan = await getTenantPlanSnapshot(tenantId)

  let apiKeysRevoked = 0
  if (!plan.hasApi) {
    const { data, error } = await admin
      .from("tenant_api_keys")
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .is("revoked_at", null)
      .select("id")

    if (!error) {
      apiKeysRevoked = data?.length ?? 0
      if (apiKeysRevoked > 0) {
        await createTenantNotification({
          tenantId,
          level: "warning",
          kind: "api_keys_revoked_by_plan",
          title: "APIキーを自動停止しました",
          message: `現在の契約プラン（${plan.planName}）ではAPI利用不可のため、有効APIキー ${apiKeysRevoked} 件を停止しました。`,
          dedupeKey: `api_revoked:${tenantId}:${plan.planCode}:${apiKeysRevoked}`,
          metadata: { planCode: plan.planCode, apiKeysRevoked },
        })
      }
    }
  }

  const botCount = await getTenantBotCount(tenantId)
  const botLimit = getEffectiveBotLimit(plan)
  const botOverLimit = Math.max(0, botCount - botLimit)
  if (botOverLimit > 0) {
    await createTenantNotification({
      tenantId,
      level: "warning",
      kind: "bot_limit_over",
      title: "Bot上限を超過しています",
      message: `現在 ${botCount} 件 / 上限 ${botLimit} 件です。新規Bot作成は停止されます。`,
      dedupeKey: `bot_over:${tenantId}:${plan.planCode}:${botLimit}:${botCount}`,
      metadata: { botCount, botLimit, planCode: plan.planCode },
    })
  }

  const storageBytes = await getTenantStorageUsageBytes(tenantId)
  const storageLimitBytes = Math.max(0, plan.maxStorageMb) * 1024 * 1024
  const storageOverBytes = Math.max(0, storageBytes - storageLimitBytes)
  if (storageOverBytes > 0) {
    await createTenantNotification({
      tenantId,
      level: "warning",
      kind: "storage_limit_over",
      title: "データ容量上限を超過しています",
      message: "容量超過中のため、新規PDF追加・再インデックスは停止されます。不要データを整理してください。",
      dedupeKey: `storage_over:${tenantId}:${plan.planCode}:${storageLimitBytes}:${storageBytes}`,
      metadata: { storageBytes, storageLimitBytes, planCode: plan.planCode },
    })
  }

  const hostedCandidates = await getHostedCandidateBotRows(tenantId)
  const hostedLimit = plan.hasHostedPage ? Math.max(0, plan.maxHostedPages) : 0
  const hostedOverLimit = Math.max(0, hostedCandidates.length - hostedLimit)
  if (hostedOverLimit > 0) {
    const overflowNames = hostedCandidates.slice(hostedLimit).map((bot) => bot.name).slice(0, 5)
    await createTenantNotification({
      tenantId,
      level: "warning",
      kind: "hosted_limit_over",
      title: "Hosted URL上限を超過しています",
      message:
        hostedLimit <= 0
          ? "現在プランではHosted URLを利用できません。"
          : `現在 ${hostedCandidates.length} 件 / 上限 ${hostedLimit} 件です。超過候補: ${overflowNames.join(", ") || "-"}`,
      dedupeKey: `hosted_over:${tenantId}:${plan.planCode}:${hostedLimit}:${hostedCandidates.length}`,
      metadata: {
        hostedLimit,
        hostedCandidates: hostedCandidates.length,
        overflowBotIds: hostedCandidates.slice(hostedLimit).map((bot) => bot.id),
      },
    })
  }

  return {
    tenantId,
    planCode: plan.planCode,
    apiKeysRevoked,
    botOverLimit,
    storageOverBytes,
    hostedOverLimit,
  }
}

export async function enforceAllTenantPlanLimits(options?: { limit?: number }) {
  const admin = createAdminClient()
  const limit = Math.max(1, Math.min(options?.limit ?? 200, 1000))
  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("tenant_id")
    .in("status", ["trialing", "active", "past_due", "unpaid", "canceled", "incomplete", "paused"])
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error

  const tenantIds = [...new Set((rows ?? []).map((row) => String(row.tenant_id)).filter(Boolean))]
  const results: EnforcementResult[] = []

  for (const tenantId of tenantIds) {
    const result = await enforceTenantPlanLimits(tenantId)
    results.push(result)
  }

  return results
}
