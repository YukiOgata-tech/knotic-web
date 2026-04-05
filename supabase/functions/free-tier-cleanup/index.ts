/**
 * free-tier-cleanup
 *
 * フリー枠テナントのデータ自動削除 Edge Function。
 * Supabase スケジューラから毎日呼び出される（config.toml で設定）。
 *
 * ロジック:
 *   - 有効なサブスクリプション / tenant_contract_overrides がないテナントをフリー枠と判定
 *   - 最終 audit_log（なければ tenants.created_at）から 14日以上経過 → Bot を全削除
 *   - OpenAI Vector Store ファイル削除 → Supabase Storage 削除 → DB レコード削除
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? ""

const INACTIVITY_DELETE_DAYS = 14
const SOURCE_FILES_BUCKET = "source-files"
const SOURCE_ARTIFACTS_BUCKET = "source-artifacts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TenantRow = { id: string; created_at: string }
type BotRow = { id: string; public_id: string; file_search_vector_store_id: string | null }
type SourceRow = {
  id: string
  file_path: string | null
  file_search_file_id: string | null
}

// ---------------------------------------------------------------------------
// OpenAI helpers
// ---------------------------------------------------------------------------

async function openAiDelete(path: string): Promise<void> {
  try {
    await fetch(`https://api.openai.com/v1${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    })
  } catch {
    // best effort
  }
}

async function deleteOpenAiFile(
  vectorStoreId: string | null,
  fileId: string | null
): Promise<void> {
  if (!fileId) return
  if (vectorStoreId) {
    await openAiDelete(
      `/vector_stores/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(fileId)}`
    )
  }
  await openAiDelete(`/files/${encodeURIComponent(fileId)}`)
}

async function deleteOpenAiVectorStore(vectorStoreId: string | null): Promise<void> {
  if (!vectorStoreId) return
  await openAiDelete(`/vector_stores/${encodeURIComponent(vectorStoreId)}`)
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (_req) => {
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. フリー枠テナントの一覧を取得
    const { data: allTenants, error: tenantsError } = await admin
      .from("tenants")
      .select("id, created_at")

    if (tenantsError) throw tenantsError

    const tenants = (allTenants ?? []) as TenantRow[]
    if (tenants.length === 0) {
      return new Response(JSON.stringify({ deleted: 0, skipped: 0 }), { status: 200 })
    }

    // 有効サブスクリプションがあるテナントIDを除外
    const { data: activeSubs } = await admin
      .from("subscriptions")
      .select("tenant_id")
      .in("status", ["trialing", "active", "past_due", "unpaid", "incomplete", "paused"])

    const { data: activeOverrides } = await admin
      .from("tenant_contract_overrides")
      .select("tenant_id")
      .eq("is_active", true)

    const paidTenantIds = new Set<string>([
      ...((activeSubs ?? []).map((r: { tenant_id: string }) => r.tenant_id)),
      ...((activeOverrides ?? []).map((r: { tenant_id: string }) => r.tenant_id)),
    ])

    const freeTenants = tenants.filter((t) => !paidTenantIds.has(t.id))
    if (freeTenants.length === 0) {
      return new Response(JSON.stringify({ deleted: 0, skipped: 0 }), { status: 200 })
    }

    // 2. 各フリー枠テナントの最終audit_logを確認
    const freeTenantIds = freeTenants.map((t) => t.id)
    const { data: lastLogs } = await admin
      .from("audit_logs")
      .select("tenant_id, created_at")
      .in("tenant_id", freeTenantIds)
      .order("created_at", { ascending: false })

    // テナントIDごとの最終活動日 Map（audit_log がなければ created_at をフォールバック）
    const lastActivityByTenant = new Map<string, Date>()
    for (const log of (lastLogs ?? []) as { tenant_id: string; created_at: string }[]) {
      if (!lastActivityByTenant.has(log.tenant_id)) {
        lastActivityByTenant.set(log.tenant_id, new Date(log.created_at))
      }
    }
    for (const t of freeTenants) {
      if (!lastActivityByTenant.has(t.id)) {
        lastActivityByTenant.set(t.id, new Date(t.created_at))
      }
    }

    // 3. 14日以上非アクティブなテナントを絞り込む
    const now = Date.now()
    const deleteTargets = freeTenants.filter((t) => {
      const lastActive = lastActivityByTenant.get(t.id) ?? new Date(t.created_at)
      const daysSince = (now - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince >= INACTIVITY_DELETE_DAYS
    })

    let deletedCount = 0

    for (const tenant of deleteTargets) {
      try {
        await deleteTenantBots(admin, tenant.id)
        deletedCount++
        console.log(`[free-tier-cleanup] Deleted bots for tenant: ${tenant.id}`)
      } catch (err) {
        console.error(`[free-tier-cleanup] Failed for tenant ${tenant.id}:`, err)
      }
    }

    return new Response(
      JSON.stringify({
        deleted: deletedCount,
        skipped: freeTenants.length - deletedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("[free-tier-cleanup] Fatal error:", err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

// ---------------------------------------------------------------------------
// Bot 削除処理
// ---------------------------------------------------------------------------

async function deleteTenantBots(
  // deno-lint-ignore no-explicit-any
  admin: any,
  tenantId: string
): Promise<void> {
  // テナントの全 Bot を取得
  const { data: bots, error: botsError } = await admin
    .from("bots")
    .select("id, public_id, file_search_vector_store_id")
    .eq("tenant_id", tenantId)

  if (botsError) throw botsError
  if (!bots || bots.length === 0) return

  for (const bot of bots as BotRow[]) {
    await deleteBotData(admin, bot)
  }
}

async function deleteBotData(
  // deno-lint-ignore no-explicit-any
  admin: any,
  bot: BotRow
): Promise<void> {
  // Bot に紐づくソースを取得
  const { data: sources } = await admin
    .from("sources")
    .select("id, file_path, file_search_file_id")
    .eq("bot_id", bot.id)

  // 各ソースの OpenAI ファイル削除 + Storage ファイル削除
  for (const source of (sources ?? []) as SourceRow[]) {
    await deleteOpenAiFile(bot.file_search_vector_store_id, source.file_search_file_id)
    if (source.file_path) {
      await admin.storage.from(SOURCE_FILES_BUCKET).remove([source.file_path])
      // source-artifacts も同一パスプレフィックスで試みる
      await admin.storage.from(SOURCE_ARTIFACTS_BUCKET).remove([source.file_path])
    }
  }

  // OpenAI Vector Store 削除
  await deleteOpenAiVectorStore(bot.file_search_vector_store_id)

  // indexing_jobs 削除
  await admin.from("indexing_jobs").delete().eq("bot_id", bot.id)

  // sources 削除
  await admin.from("sources").delete().eq("bot_id", bot.id)

  // bot 本体を削除（ハード削除）
  await admin.from("bots").delete().eq("id", bot.id)
}
