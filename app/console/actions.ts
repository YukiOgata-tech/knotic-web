"use server"

import crypto from "node:crypto"
import { redirect } from "next/navigation"

import {
  assertTenantCanCreateBot,
  assertTenantCanIndexData,
  getTenantPlanSnapshot,
  FREE_TIER_PLAN_CODE,
} from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import { processQueuedIndexingJobs } from "@/lib/indexing/pipeline"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/app/console/_lib/audit"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { getAppUrl } from "@/lib/env"
import { sendMemberInviteEmail } from "@/lib/email/resend"
import { ALLOWED_FILE_EXTENSIONS, SPREADSHEET_EXTENSIONS, cleanupSourceFromOpenAiFileSearch, syncBinaryFileToOpenAiFileSearch, syncSourceTextToOpenAiFileSearch } from "@/lib/filesearch/openai"
import { storeFileKnowledgeMarkdown } from "@/lib/indexing/file-artifacts"
import { pdfToStructuredMarkdown } from "@/lib/indexing/pdf"
import { spreadsheetToMarkdown } from "@/lib/indexing/spreadsheet"

const ALLOWED_MODELS = [
  "gpt-4o-mini",
  "gpt-5-nano",
  "gpt-5-mini",
] as const
const STORAGE_BUCKET = "source-files"
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const BOT_IDENTITY_CHANGE_LIMIT = 3
const BOT_IDENTITY_CHANGE_WINDOW_DAYS = 30

function normalizeModel(value: string, fallback: (typeof ALLOWED_MODELS)[number]) {
  const normalized = value.trim()
  return (ALLOWED_MODELS as readonly string[]).includes(normalized)
    ? (normalized as (typeof ALLOWED_MODELS)[number])
    : fallback
}

function normalizeRedirectTo(value: string | null) {
  if (!value) return "/console/overview"
  if (!value.startsWith("/console")) return "/console/overview"
  return value
}

function toAppUrl(redirectTo: string | null, params: Record<string, string>) {
  const url = new URLSearchParams(params)
  return `${normalizeRedirectTo(redirectTo)}?${url.toString()}`
}

function normalizeOrigins(raw: string) {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}


function normalizeChatPurpose(value: string) {
  const allowed = ["customer_support", "lead_gen", "internal_kb", "onboarding", "custom"] as const
  return (allowed as readonly string[]).includes(value) ? value : "customer_support"
}

function normalizeAccessMode(value: string) {
  return value === "internal" ? "internal" : "public"
}

function normalizeHexColor(value: string, fallback: string) {
  const v = value.trim()
  return /^#[0-9A-Fa-f]{6}$/.test(v) ? v.toLowerCase() : fallback
}

function normalizeWidgetMode(value: string) {
  return value === "redirect" || value === "both" ? value : "overlay"
}

function normalizeWidgetPosition(value: string) {
  return value === "right-top" ? "right-top" : "right-bottom"
}

function normalizeConfigTab(value: string | null | undefined) {
  const allowed = ["basic", "bot", "ai", "theme", "widget", "preview"] as const
  return value && (allowed as readonly string[]).includes(value) ? value : "basic"
}

function getHistoryTurnLimitCap(planCode: string | null | undefined) {
  if (planCode === "starter" || planCode === "lite") return 20
  return 30
}

async function getTenantContext(requireEditor = false) {
  const { supabase, user, membership, membershipError, impersonation } = await requireConsoleContext()

  if (membershipError || !membership) {
    throw new Error("Tenant membership not found. Run schema and patch SQL first.")
  }

  if (impersonation?.active && requireEditor) {
    throw new Error("代理閲覧モードでは編集できません。開発者コンソールで代理閲覧を終了してください。")
  }

  if (requireEditor && membership.role !== "editor") {
    throw new Error("Editor role is required for this action.")
  }

  return {
    supabase,
    user,
    tenantId: membership.tenant_id,
    role: membership.role,
    impersonation,
  }
}

export async function createBotAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, user, tenantId } = await getTenantContext(true)
    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()

    if (!name) {
      redirect(toAppUrl(redirectTo, { error: "Bot名を入力してください。" }))
    }
    await assertTenantCanCreateBot(tenantId)

    const publicId = `bot_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`
    const { data: createdBot, error } = await supabase
      .from("bots")
      .insert({
        tenant_id: tenantId,
        public_id: publicId,
        name,
        description: description || null,
        status: "draft",
        is_public: false,
        file_search_provider: "openai",
        created_by: user.id,
      })
      .select("id, public_id, name, is_public, status")
      .single()

    if (error) throw error
    await writeAuditLog(supabase, {
      tenantId,
      action: "bot.create",
      targetType: "bot",
      targetId: createdBot?.id,
      after: {
        public_id: createdBot?.public_id ?? publicId,
        name,
        is_public: false,
        status: "draft",
      },
    })
    redirect(toAppUrl(redirectTo, { notice: "Botを作成しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "Bot作成に失敗しました。",
      })
    )
  }
}

export async function toggleBotPublicAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    const nextPublic = String(formData.get("next_public") ?? "") === "true"

    if (nextPublic) {
      const plan = await getTenantPlanSnapshot(tenantId)
      if (plan.planCode === FREE_TIER_PLAN_CODE) {
        redirect(toAppUrl(redirectTo, { error: "Botの公開には契約プランへの加入が必要です。" }))
      }
    }

    const { error } = await supabase
      .from("bots")
      .update({ is_public: nextPublic })
      .eq("id", botId)

    if (error) throw error
    await writeAuditLog(supabase, {
      tenantId,
      action: "bot.public.toggle",
      targetType: "bot",
      targetId: botId,
      after: { is_public: nextPublic },
    })
    redirect(toAppUrl(redirectTo, { notice: nextPublic ? "Botを有効化しました。" : "Botを無効化しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "公開設定の更新に失敗しました。",
      })
    )
  }
}

export async function deleteBotAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    if (!botId) {
      redirect(toAppUrl(redirectTo, { error: "Botが指定されていません。" }))
    }

    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("id, name, public_id, status")
      .eq("id", botId)
      .maybeSingle()

    if (botError) throw botError
    if (!bot) {
      redirect(toAppUrl(redirectTo, { error: "対象Botが見つかりません。" }))
    }

    const { error } = await supabase
      .from("bots")
      .update({
        status: "archived",
        is_public: false,
        widget_enabled: false,
        require_auth_for_hosted: false,
        access_mode: "public",
      })
      .eq("id", botId)

    if (error) throw error

    await writeAuditLog(supabase, {
      tenantId,
      action: "bot.delete",
      targetType: "bot",
      targetId: botId,
      before: {
        name: bot.name,
        public_id: bot.public_id,
        status: bot.status,
      },
      after: {
        status: "archived",
        is_public: false,
        widget_enabled: false,
      },
    })

    redirect(toAppUrl(redirectTo, { notice: "Botを削除しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? "/console/bots"), {
        error: error instanceof Error ? error.message : "Bot削除に失敗しました。",
      })
    )
  }
}

export async function addUrlSourceAction(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") ?? "")
  try {
    const { supabase, user, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    const url = String(formData.get("url") ?? "").trim()
    if (!botId || !url) redirect(toAppUrl(redirectTo, { error: "BotとURLを入力してください。" }))
    await assertTenantCanIndexData(tenantId, 0)
    const { error } = await supabase
      .from("sources")
      .insert({ bot_id: botId, type: "url", status: "queued", url, created_by: user.id })
    if (error) throw error
    await writeAuditLog(supabase, {
      tenantId,
      action: "source.url.add",
      targetType: "source",
      targetId: botId,
      after: { bot_id: botId, url },
    })
    redirect(toAppUrl(redirectTo, { notice: "URLソースを追加しました。" }))
  } catch (error) {
    redirect(toAppUrl(redirectTo, { error: error instanceof Error ? error.message : "URLソース追加に失敗しました。" }))
  }
}

export async function addFileSourceAction(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") ?? "")
  const activeTab = normalizeConfigTab(String(formData.get("active_tab") ?? "ai"))
  const withActiveTab = (params: Record<string, string>) => ({ ...params, active_tab: activeTab })

  try {
    const { supabase, user, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    const file = formData.get("file")

    if (!botId) {
      redirect(toAppUrl(redirectTo, withActiveTab({ error: "Botを選択してください。" })))
    }

    if (!(file instanceof File) || file.size === 0) {
      redirect(toAppUrl(redirectTo, withActiveTab({ error: "ファイルを選択してください。" })))
    }

    const fileName = file.name || "upload"
    const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
      redirect(toAppUrl(redirectTo, withActiveTab({ error: "対応していないファイル形式です。" })))
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      redirect(toAppUrl(redirectTo, withActiveTab({ error: "ファイルサイズは20MB以下にしてください。" })))
    }
    await assertTenantCanIndexData(tenantId, file.size)

    const bytes = Buffer.from(await file.arrayBuffer())
    const contentHash = crypto.createHash("sha256").update(bytes).digest("hex")
    const storagePath = `${tenantId}/${botId}/${Date.now()}-${sanitizeFileName(fileName)}`

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, bytes, { upsert: false })

    if (uploadError) {
      throw new Error(
        "ファイルアップロードに失敗しました。Storageバケット source-files の作成と権限設定を確認してください。"
      )
    }

    const { data: insertedSource, error: insertError } = await supabase
      .from("sources")
      .insert({
        bot_id: botId,
        type: ext === "pdf" ? "pdf" : "file",
        status: "queued",
        file_path: storagePath,
        file_name: fileName,
        file_size_bytes: file.size,
        content_hash: contentHash,
        created_by: user.id,
      })
      .select("id")
      .single()

    if (insertError || !insertedSource) {
      await admin.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw insertError ?? new Error("ソース作成に失敗しました。")
    }

    const { data: bot } = await admin
      .from("bots")
      .select("id, public_id")
      .eq("id", botId)
      .maybeSingle()

    if (bot?.public_id) {
      if (ext === "pdf") {
        const markdown = await pdfToStructuredMarkdown(bytes, fileName)
        await storeFileKnowledgeMarkdown({
          tenantId,
          botId,
          sourceId: insertedSource.id,
          title: fileName,
          markdown,
          rawBytes: bytes.length,
        })
        await syncSourceTextToOpenAiFileSearch({
          botId,
          botPublicId: String(bot.public_id),
          sourceId: insertedSource.id,
          sourceType: "pdf",
          sourceLabel: fileName,
          text: markdown,
        })
      } else if (SPREADSHEET_EXTENSIONS.has(ext)) {
        const markdown = spreadsheetToMarkdown(bytes, fileName)
        await storeFileKnowledgeMarkdown({
          tenantId,
          botId,
          sourceId: insertedSource.id,
          title: fileName,
          markdown,
          rawBytes: bytes.length,
        })
        await syncSourceTextToOpenAiFileSearch({
          botId,
          botPublicId: String(bot.public_id),
          sourceId: insertedSource.id,
          sourceType: "file",
          sourceLabel: fileName,
          text: markdown,
        })
      } else {
        await syncBinaryFileToOpenAiFileSearch({
          botId,
          botPublicId: String(bot.public_id),
          sourceId: insertedSource.id,
          filename: fileName,
          buffer: bytes,
        })
      }
      await admin
        .from("sources")
        .update({ status: "ready" })
        .eq("id", insertedSource.id)
      await admin.from("bots").update({ status: "ready" }).eq("id", botId)
    }

    await writeAuditLog(supabase, {
      tenantId,
      action: "source.file.add",
      targetType: "source",
      targetId: botId,
      after: { bot_id: botId, file_name: fileName, file_size_bytes: file.size },
    })
    redirect(toAppUrl(redirectTo, withActiveTab({ notice: "ファイルを追加しました。" })))
  } catch (error) {
    redirect(
      toAppUrl(redirectTo, withActiveTab({
        error: error instanceof Error ? error.message : "ファイル追加に失敗しました。",
      }))
    )
  }
}

export async function queueIndexAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, user, tenantId } = await getTenantContext(true)
    const sourceId = String(formData.get("source_id") ?? "")
    const botId = String(formData.get("bot_id") ?? "")

    await assertTenantCanIndexData(tenantId, 0)

    const { error: sourceError } = await supabase
      .from("sources")
      .update({ status: "queued" })
      .eq("id", sourceId)

    if (sourceError) throw sourceError

    if (botId) {
      await supabase
        .from("bots")
        .update({ status: "queued" })
        .eq("id", botId)
    }

    const { error: jobError } = await supabase.from("indexing_jobs").insert({
      tenant_id: tenantId,
      bot_id: botId || null,
      source_id: sourceId,
      status: "queued",
      job_type: "manual",
      embedding_model: "text-embedding-3-small",
      requested_by: user.id,
    })

    if (jobError) {
      throw new Error(
        "indexing_jobsテーブルが未作成です。patch SQLを適用してください。"
      )
    }

    await writeAuditLog(supabase, {
      tenantId,
      action: "indexing.queue",
      targetType: "source",
      targetId: sourceId,
      after: { bot_id: botId || null, embedding_model: "text-embedding-3-small" },
    })
    redirect(toAppUrl(redirectTo, { notice: "ナレッジ更新をキュー登録しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "ナレッジ更新に失敗しました。",
      })
    )
  }
}

export async function rotateWidgetTokenAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    const botPublicId = String(formData.get("bot_public_id") ?? "")
    const rawToken = `knotic_wgt_${crypto.randomBytes(18).toString("base64url")}`
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")

    await supabase
      .from("bot_public_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("bot_id", botId)
      .is("revoked_at", null)

    const { error } = await supabase.from("bot_public_tokens").insert({
      bot_id: botId,
      public_token_hash: tokenHash,
      allowed_origins: [],
    })

    if (error) throw error

    await writeAuditLog(supabase, {
      tenantId,
      action: "widget.token.rotate",
      targetType: "bot",
      targetId: botId,
      after: { bot_public_id: botPublicId, token_last4: rawToken.slice(-4) },
    })

    redirect(
      toAppUrl(redirectTo, {
        notice: "Widgetトークンを再発行しました。表示中の値はこの1回のみです。",
        widget_token: rawToken,
        widget_bot_public_id: botPublicId,
      })
    )
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "Widgetトークン再発行に失敗しました。",
      })
    )
  }
}
export async function updateAllowedOriginsAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId } = await getTenantContext(true)
    const tokenId = String(formData.get("token_id") ?? "")
    const originsRaw = String(formData.get("allowed_origins") ?? "")
    const allowedOrigins = normalizeOrigins(originsRaw)

    const { error } = await supabase
      .from("bot_public_tokens")
      .update({ allowed_origins: allowedOrigins })
      .eq("id", tokenId)

    if (error) throw error
    await writeAuditLog(supabase, {
      tenantId,
      action: "widget.allowed_origins.update",
      targetType: "bot_public_token",
      targetId: tokenId,
      after: { allowed_origins_count: allowedOrigins.length },
    })
    redirect(toAppUrl(redirectTo, { notice: "許可オリジンを更新しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "許可オリジン更新に失敗しました。",
      })
    )
  }
}

export async function createApiKeyAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, user, tenantId } = await getTenantContext(true)
    const name = String(formData.get("name") ?? "").trim()
    const expiresAt = String(formData.get("expires_at") ?? "").trim()

    if (!name) {
      redirect(toAppUrl(redirectTo, { error: "APIキー名を入力してください。" }))
    }

    const rawKey = `knotic_api_${crypto.randomBytes(24).toString("base64url")}`
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex")
    const keyPrefix = rawKey.slice(0, 16)
    const keyLast4 = rawKey.slice(-4)

    const { error } = await supabase.from("tenant_api_keys").insert({
      tenant_id: tenantId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      key_last4: keyLast4,
      is_active: true,
      created_by: user.id,
      expires_at: expiresAt || null,
      scopes: ["chat:invoke"],
    })

    if (error) {
      throw new Error("tenant_api_keysテーブルが未作成です。patch SQLを適用してください。")
    }

    await writeAuditLog(supabase, {
      tenantId,
      action: "api_key.create",
      targetType: "tenant_api_key",
      after: { name, key_prefix: keyPrefix, key_last4: keyLast4, expires_at: expiresAt || null },
    })

    redirect(
      toAppUrl(redirectTo, {
        notice: "APIキーを発行しました。表示中の値はこの1回のみです。",
        issued_api_key: rawKey,
      })
    )
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "APIキー発行に失敗しました。",
      })
    )
  }
}

export async function revokeApiKeyAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId } = await getTenantContext(true)
    const keyId = String(formData.get("key_id") ?? "")
    const { error } = await supabase
      .from("tenant_api_keys")
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", keyId)

    if (error) throw error
    await writeAuditLog(supabase, {
      tenantId,
      action: "api_key.revoke",
      targetType: "tenant_api_key",
      targetId: keyId,
      after: { is_active: false },
    })
    redirect(toAppUrl(redirectTo, { notice: "APIキーを失効しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "APIキー失効に失敗しました。",
      })
    )
  }
}

export async function runIndexingWorkerAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { tenantId } = await getTenantContext(true)
    const results = await processQueuedIndexingJobs(1, tenantId)
    const done = results.find((item) => item.ok)
    if (!done) {
      const err = results[0]?.error ?? "実行対象キューがないか、処理に失敗しました。"
      redirect(toAppUrl(redirectTo, { error: err }))
    }
    redirect(toAppUrl(redirectTo, { notice: "ナレッジ読み込みを1件実行しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "ナレッジ読み込みに失敗しました。",
      })
    )
  }
}

export async function deleteSourceAction(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") ?? "")
  try {
    const { supabase, tenantId } = await getTenantContext(true)
    const sourceId = String(formData.get("source_id") ?? "")
    const botId = String(formData.get("bot_id") ?? "")
    if (!sourceId || !botId) throw new Error("sourceId と botId は必須です。")

    const admin = createAdminClient()

    // Verify source + bot belong to this tenant
    const { data: source } = await admin
      .from("sources")
      .select("id, type, file_path, file_search_file_id")
      .eq("id", sourceId)
      .maybeSingle()
    if (!source) throw new Error("ソースが見つかりません。")

    const { data: bot } = await admin
      .from("bots")
      .select("id, file_search_vector_store_id")
      .eq("id", botId)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    if (!bot) throw new Error("Bot が見つかりません。")

    // Clean up OpenAI file search resources (best effort)
    await cleanupSourceFromOpenAiFileSearch({
      vectorStoreId: (bot as { file_search_vector_store_id?: string | null }).file_search_vector_store_id ?? null,
      fileId: (source as { file_search_file_id?: string | null }).file_search_file_id ?? null,
    })

    // Delete storage file if present
    const filePath = (source as { file_path?: string | null }).file_path ?? null
    if (filePath) {
      await admin.storage.from("source-files").remove([filePath])
    }

    // Hard delete source (cascades to source_pages, indexing_jobs via FK)
    const { error: deleteError } = await admin.from("sources").delete().eq("id", sourceId)
    if (deleteError) throw deleteError

    // If no sources remain, reset bot status
    const { data: remaining } = await admin
      .from("sources")
      .select("id")
      .eq("bot_id", botId)
      .limit(1)
    if (!remaining?.length) {
      await admin.from("bots").update({ status: "created" }).eq("id", botId)
    }

    await writeAuditLog(supabase, {
      tenantId,
      action: "source.delete",
      targetType: "source",
      targetId: sourceId,
      after: { bot_id: botId },
    })
    redirect(toAppUrl(redirectTo, { notice: "ソースを削除しました。" }))
  } catch (error) {
    redirect(toAppUrl(redirectTo, { error: error instanceof Error ? error.message : "削除に失敗しました。" }))
  }
}

export type SourcePage = {
  canonical_url: string
  title: string | null
  status_code: number | null
  fetched_at: string | null
  text_bytes: number | null
  text_path: string | null
}

export async function getSourcePagesAction(sourceId: string): Promise<{ pages: SourcePage[]; error?: string }> {
  try {
    const { tenantId } = await getTenantContext(false)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("source_pages")
      .select("canonical_url, title, status_code, fetched_at, text_bytes, text_path")
      .eq("source_id", sourceId)
      .eq("tenant_id", tenantId)
      .order("fetched_at", { ascending: true })
      .limit(200)
    if (error) return { pages: [], error: error.message }
    return { pages: (data ?? []) as SourcePage[] }
  } catch (err) {
    return { pages: [], error: err instanceof Error ? err.message : "取得に失敗しました。" }
  }
}

export async function getSourceTextAction(
  sourceId: string,
  textPath: string
): Promise<{ text: string | null; error?: string }> {
  try {
    const { tenantId } = await getTenantContext(false)
    const admin = createAdminClient()
    // Verify source belongs to tenant via source_pages
    const { data: page } = await admin
      .from("source_pages")
      .select("text_path")
      .eq("source_id", sourceId)
      .eq("tenant_id", tenantId)
      .eq("text_path", textPath)
      .maybeSingle()
    if (!page) return { text: null, error: "ファイルが見つかりません。" }

    const { data, error } = await admin.storage.from("source-artifacts").download(textPath)
    if (error || !data) return { text: null, error: error?.message ?? "ダウンロードに失敗しました。" }
    const text = await data.text()
    return { text }
  } catch (err) {
    return { text: null, error: err instanceof Error ? err.message : "取得に失敗しました。" }
  }
}

export async function testAuditLogAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "/console/audit")
    const { supabase, tenantId, user } = await getTenantContext(true)
    const result = await writeAuditLog(supabase, {
      tenantId,
      action: "audit.test.write",
      targetType: "tenant",
      targetId: tenantId,
      metadata: {
        requested_by: user.id,
        triggered_at: new Date().toISOString(),
      },
    })

    if (!result.ok) {
      redirect(
        toAppUrl(redirectTo, {
          error: `監査ログテスト失敗: ${result.error ?? "unknown"}`,
        })
      )
    }

    redirect(
      toAppUrl(redirectTo, {
        notice: `監査ログテスト成功 (via=${result.via}, id=${result.id ?? "n/a"})`,
      })
    )
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? "/console/audit"), {
        error: error instanceof Error ? error.message : "監査ログテストに失敗しました。",
      })
    )
  }
}



export async function updateHostedConfigAction(formData: FormData) {
  const redirectToRaw = String(formData.get("redirect_to") ?? "")
  const activeTab = normalizeConfigTab(String(formData.get("active_tab") ?? ""))
  const withActiveTab = (params: Record<string, string>) => ({ ...params, active_tab: activeTab })
  try {
    const redirectTo = redirectToRaw
    const { supabase, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    if (!botId) {
      redirect(toAppUrl(redirectTo, withActiveTab({ error: "Botが指定されていません。" })))
    }
    const botName = String(formData.get("name") ?? "").trim()
    if (!botName) {
      redirect(toAppUrl(redirectTo, withActiveTab({ error: "Bot名を入力してください。" })))
    }

    const chatPurpose = normalizeChatPurpose(String(formData.get("chat_purpose") ?? "customer_support").trim())
    const requestedAccessMode = normalizeAccessMode(String(formData.get("access_mode") ?? "public").trim())
    const displayName = String(formData.get("display_name") ?? "").trim()
    const normalizedDisplayName = displayName || null
    const welcomeMessage = String(formData.get("welcome_message") ?? "").trim()
    const placeholderText = String(formData.get("placeholder_text") ?? "").trim()
    const disclaimerText = String(formData.get("disclaimer_text") ?? "").trim()
    const showCitations = String(formData.get("show_citations") ?? "") === "on"
    const requireAuthForHosted = String(formData.get("require_auth_for_hosted") ?? "") === "on"
    const historyTurnLimit = Number(formData.get("history_turn_limit") ?? 8)
    const headerBgColor = normalizeHexColor(String(formData.get("ui_header_bg_color") ?? "#0f172a"), "#0f172a")
    const headerTextColor = normalizeHexColor(String(formData.get("ui_header_text_color") ?? "#f8fafc"), "#f8fafc")
    const footerBgColor = normalizeHexColor(String(formData.get("ui_footer_bg_color") ?? "#f8fafc"), "#f8fafc")
    const footerTextColor = normalizeHexColor(String(formData.get("ui_footer_text_color") ?? "#0f172a"), "#0f172a")
    const widgetEnabled = String(formData.get("widget_enabled") ?? "") === "on"
    const widgetMode = normalizeWidgetMode(String(formData.get("widget_mode") ?? "overlay"))
    const widgetPosition = normalizeWidgetPosition(String(formData.get("widget_position") ?? "right-bottom"))
    const widgetLauncherLabel = String(formData.get("widget_launcher_label") ?? "").trim()
    const widgetPolicyText = String(formData.get("widget_policy_text") ?? "").trim()
    const widgetRedirectNewTab = String(formData.get("widget_redirect_new_tab") ?? "") === "on"
    const botLogoUrl = String(formData.get("bot_logo_url") ?? "").trim() || null
    const launcherShowLabel = String(formData.get("launcher_show_label") ?? "") !== "false"
    const faqQuestions = [0, 1, 2, 3, 4]
      .map((i) => String(formData.get(`faq_question_${i}`) ?? "").trim())
      .filter(Boolean)
    const aiModel = normalizeModel(String(formData.get("ai_model") ?? "gpt-5-mini"), "gpt-5-mini")
    const aiFallbackRaw = String(formData.get("ai_fallback_model") ?? "").trim()
    const aiFallbackModel = aiFallbackRaw === "" ? null : normalizeModel(aiFallbackRaw, "gpt-5-mini")
    const aiMaxOutputTokensRaw = Number(formData.get("ai_max_output_tokens") ?? 1200)
    const aiMaxOutputTokens = Number.isFinite(aiMaxOutputTokensRaw)
      ? Math.max(200, Math.min(4000, Math.floor(aiMaxOutputTokensRaw)))
      : 1200
    const { data: currentBot, error: currentBotError } = await supabase
      .from("bots")
      .select("name, display_name")
      .eq("id", botId)
      .maybeSingle()

    if (currentBotError) throw currentBotError
    if (!currentBot) {
      redirect(toAppUrl(redirectTo, withActiveTab({ error: "対象Botが見つかりません。" })))
    }

    const identityChanged =
      currentBot.name !== botName || (currentBot.display_name ?? null) !== normalizedDisplayName

    if (identityChanged) {
      const windowStartIso = new Date(
        Date.now() - BOT_IDENTITY_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toISOString()
      const { count: recentIdentityChanges, error: recentIdentityChangesError } = await supabase
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("action", "bot.identity.update")
        .eq("target_type", "bot")
        .eq("target_id", botId)
        .gte("created_at", windowStartIso)

      if (recentIdentityChangesError) throw recentIdentityChangesError
      if ((recentIdentityChanges ?? 0) >= BOT_IDENTITY_CHANGE_LIMIT) {
        redirect(
          toAppUrl(redirectTo, withActiveTab({
            error: `Bot名/サービス表示名の変更は${BOT_IDENTITY_CHANGE_WINDOW_DAYS}日で${BOT_IDENTITY_CHANGE_LIMIT}回までです。期間経過後に再試行してください。`,
          }))
        )
      }
    }

    const plan = await getTenantPlanSnapshot(tenantId)
    const accessMode = plan.hasHostedPage ? requestedAccessMode : "public"
    const normalizedRequireAuth = plan.hasHostedPage
      ? requireAuthForHosted || accessMode === "internal"
      : false
    const historyTurnLimitCap = getHistoryTurnLimitCap(plan.planCode)
    const normalizedLimit = Number.isFinite(historyTurnLimit)
      ? Math.max(1, Math.min(historyTurnLimitCap, Math.floor(historyTurnLimit)))
      : Math.min(8, historyTurnLimitCap)

    const { error } = await supabase
      .from("bots")
      .update({
        name: botName,
        chat_purpose: chatPurpose,
        access_mode: accessMode,
        display_name: normalizedDisplayName,
        welcome_message: welcomeMessage || null,
        placeholder_text: placeholderText || null,
        disclaimer_text: disclaimerText || null,
        show_citations: showCitations,
        history_turn_limit: normalizedLimit,
        require_auth_for_hosted: normalizedRequireAuth,
        ui_header_bg_color: headerBgColor,
        ui_header_text_color: headerTextColor,
        ui_footer_bg_color: footerBgColor,
        ui_footer_text_color: footerTextColor,
        widget_enabled: widgetEnabled,
        widget_mode: widgetMode,
        widget_position: widgetPosition,
        widget_launcher_label: (widgetLauncherLabel || "チャット").slice(0, 8),
        widget_policy_text:
          widgetPolicyText ||
          "このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。",
        widget_redirect_new_tab: widgetRedirectNewTab,
        bot_logo_url: botLogoUrl,
        launcher_show_label: launcherShowLabel,
        faq_questions: faqQuestions,
        ai_model: aiModel,
        ai_fallback_model: aiFallbackModel,
        ai_max_output_tokens: aiMaxOutputTokens,
        file_search_provider: "openai",
      })
      .eq("id", botId)

    if (error) throw error
    await writeAuditLog(supabase, {
      tenantId,
      action: "bot.hosted_config.update",
      targetType: "bot",
      targetId: botId,
      after: {
        name: botName,
        display_name: normalizedDisplayName,
        chat_purpose: chatPurpose,
        access_mode: accessMode,
        show_citations: showCitations,
        history_turn_limit: normalizedLimit,
        require_auth_for_hosted: normalizedRequireAuth,
        widget_enabled: widgetEnabled,
        widget_mode: widgetMode,
        widget_position: widgetPosition,
        ai_model: aiModel,
        ai_fallback_model: aiFallbackModel,
        ai_max_output_tokens: aiMaxOutputTokens,
        rag_backend: "openai_file_search",
      },
    })
    if (identityChanged) {
      await writeAuditLog(supabase, {
        tenantId,
        action: "bot.identity.update",
        targetType: "bot",
        targetId: botId,
        before: {
          name: currentBot.name,
          display_name: currentBot.display_name ?? null,
        },
        after: {
          name: botName,
          display_name: normalizedDisplayName,
        },
        metadata: {
          limit: BOT_IDENTITY_CHANGE_LIMIT,
          window_days: BOT_IDENTITY_CHANGE_WINDOW_DAYS,
        },
      })
    }
    redirect(toAppUrl(redirectTo, withActiveTab({ notice: "Hostedチャット設定を更新しました。" })))
  } catch (error) {
    redirect(
      toAppUrl(redirectToRaw, withActiveTab({
        error: error instanceof Error ? error.message : "Hosted設定の更新に失敗しました。",
      }))
    )
  }
}




















function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeTenantDisplayName(value: string) {
  const v = value.trim()
  if (v.length < 2) throw new Error("テナント名は2文字以上で入力してください。")
  if (v.length > 80) throw new Error("テナント名は80文字以内で入力してください。")
  return v
}

function slugifyTenantName(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base || "tenant"
}

export async function createTenantWorkspaceAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "/console")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("ログインが必要です。")
    }

    const admin = createAdminClient()
    const displayName = normalizeTenantDisplayName(String(formData.get("display_name") ?? ""))
    const seed = slugifyTenantName(displayName)

    const { data: existingMembership } = await admin
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    if (existingMembership?.tenant_id) {
      throw new Error("すでに所属テナントがあります。")
    }

    let tenantId: string | null = null
    let attempt = 0
    while (!tenantId && attempt < 5) {
      const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
      const slug = `${seed}-${suffix}`.slice(0, 56)
      const { data: created, error: tenantError } = await admin
        .from("tenants")
        .insert({
          slug,
          display_name: displayName,
          owner_user_id: user.id,
        })
        .select("id")
        .single()

      if (!tenantError && created?.id) {
        tenantId = created.id as string
        break
      }
      attempt += 1
    }

    if (!tenantId) {
      throw new Error("テナント作成に失敗しました。もう一度お試しください。")
    }

    const { error: membershipError } = await admin.from("tenant_memberships").insert({
      tenant_id: tenantId,
      user_id: user.id,
      role: "editor",
      is_active: true,
    })
    if (membershipError) throw membershipError

    await admin
      .from("profiles")
      .upsert({
        user_id: user.id,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
        default_tenant_id: tenantId,
      })

    await writeAuditLog(admin, {
      tenantId,
      action: "tenant.create",
      targetType: "tenant",
      targetId: tenantId,
      after: { display_name: displayName },
    })

    redirect(toAppUrl(redirectTo, { notice: "テナントを作成しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? "/console"), {
        error: error instanceof Error ? error.message : "テナント作成に失敗しました。",
      })
    )
  }
}

export async function updateTenantProfileAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId, impersonation } = await getTenantContext(true)
    if (impersonation?.active) {
      throw new Error("代理閲覧モードでは編集できません。")
    }

    const displayName = normalizeTenantDisplayName(String(formData.get("display_name") ?? ""))

    const { error } = await supabase
      .from("tenants")
      .update({ display_name: displayName })
      .eq("id", tenantId)

    if (error) throw error

    await writeAuditLog(supabase, {
      tenantId,
      action: "tenant.profile.update",
      targetType: "tenant",
      targetId: tenantId,
      after: { display_name: displayName },
    })

    redirect(toAppUrl(redirectTo, { notice: "テナント情報を更新しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "テナント情報の更新に失敗しました。",
      })
    )
  }
}

export async function updateAuthEmailAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId, impersonation } = await getTenantContext(false)
    if (impersonation?.active) {
      throw new Error("代理閲覧モードでは編集できません。")
    }

    const nextEmail = String(formData.get("email") ?? "").trim().toLowerCase()
    if (!isValidEmail(nextEmail)) {
      throw new Error("有効なメールアドレスを入力してください。")
    }

    const { error } = await supabase.auth.updateUser({ email: nextEmail })
    if (error) throw error

    await writeAuditLog(supabase, {
      tenantId,
      action: "auth.email.update.requested",
      targetType: "user",
      after: { email: nextEmail },
    })

    redirect(
      toAppUrl(redirectTo, {
        notice: "メールアドレス変更リクエストを送信しました。確認メールをご確認ください。",
      })
    )
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "メールアドレス変更に失敗しました。",
      })
    )
  }
}

export async function updatePasswordAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId, impersonation } = await getTenantContext(false)
    if (impersonation?.active) {
      throw new Error("代理閲覧モードでは編集できません。")
    }

    const password = String(formData.get("password") ?? "")
    const confirm = String(formData.get("password_confirm") ?? "")

    if (password.length < 8) {
      throw new Error("パスワードは8文字以上で入力してください。")
    }
    if (password !== confirm) {
      throw new Error("確認用パスワードが一致しません。")
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error

    await writeAuditLog(supabase, {
      tenantId,
      action: "auth.password.updated",
      targetType: "user",
      after: { updated: true },
    })

    redirect(toAppUrl(redirectTo, { notice: "パスワードを更新しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "パスワード更新に失敗しました。",
      })
    )
  }
}

export async function createMemberInviteAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { tenantId, user } = await getTenantContext(true)
    const admin = createAdminClient()
    const email = String(formData.get("email") ?? "").trim().toLowerCase()
    const role: "reader" = "reader"

    if (!isValidEmail(email)) {
      throw new Error("有効なメールアドレスを入力してください。")
    }

    const token = `inv_${crypto.randomBytes(24).toString("base64url")}`
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const { data: existingPending, error: existingPendingError } = await admin
      .from("tenant_member_invites")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle()

    if (existingPendingError) {
      throw new Error(`招待作成の事前確認に失敗しました: ${existingPendingError.message}`)
    }

    if (existingPending?.id) {
      const { error: updateError } = await admin
        .from("tenant_member_invites")
        .update({
          role,
          token_hash: tokenHash,
          invited_by: user.id,
          expires_at: expiresAt,
          accepted_at: null,
          accepted_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPending.id)
        .eq("tenant_id", tenantId)

      if (updateError) {
        throw new Error(`既存招待の更新に失敗しました: ${updateError.message}`)
      }
    } else {
      const { error: insertError } = await admin
        .from("tenant_member_invites")
        .insert({
          tenant_id: tenantId,
          email,
          role,
          token_hash: tokenHash,
          status: "pending",
          invited_by: user.id,
          expires_at: expiresAt,
          accepted_at: null,
          accepted_by: null,
        })

      if (insertError) {
        throw new Error(`招待作成に失敗しました: ${insertError.message}`)
      }
    }

    await writeAuditLog(admin, {
      tenantId,
      action: "tenant.member.invite.create",
      targetType: "tenant_member_invite",
      after: { email, role, expires_at: expiresAt },
    })

    const appUrl = getAppUrl().replace(/\/$/, "")
    const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(token)}`

    // Send invite email (non-blocking: failure doesn't abort the invite)
    let emailSent = false
    try {
      const [{ data: tenant }, inviterData] = await Promise.all([
        admin.from("tenants").select("display_name").eq("id", tenantId).maybeSingle(),
        admin.auth.admin.getUserById(user.id),
      ])
      await sendMemberInviteEmail({
        toEmail: email,
        inviteUrl,
        token,
        tenantName: tenant?.display_name ?? "knotic",
        invitedByEmail: inviterData.data.user?.email ?? "",
        expiresAt,
      })
      await admin
        .from("tenant_member_invites")
        .update({ email_sent_at: new Date().toISOString(), email_send_count: 1 })
        .eq("token_hash", tokenHash)
      emailSent = true
    } catch (emailErr) {
      console.error("[invite] email send failed", emailErr)
    }

    redirect(
      toAppUrl(redirectTo, {
        notice: emailSent
          ? "招待メールを送信しました。"
          : "招待を作成しましたが、メール送信に失敗しました。招待履歴の「再送信」ボタンをお試しください。",
      })
    )
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "招待作成に失敗しました。",
      })
    )
  }
}

export async function revokeMemberInviteAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { tenantId } = await getTenantContext(true)
    const inviteId = String(formData.get("invite_id") ?? "")
    const admin = createAdminClient()

    const { error } = await admin
      .from("tenant_member_invites")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", inviteId)
      .eq("tenant_id", tenantId)

    if (error) throw error

    await writeAuditLog(admin, {
      tenantId,
      action: "tenant.member.invite.revoke",
      targetType: "tenant_member_invite",
      targetId: inviteId,
      after: { status: "revoked" },
    })

    redirect(toAppUrl(redirectTo, { notice: "招待を取り消しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "招待取り消しに失敗しました。",
      })
    )
  }
}

export async function resendMemberInviteAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { tenantId, user } = await getTenantContext(true)
    const inviteId = String(formData.get("invite_id") ?? "")
    const admin = createAdminClient()

    const { data: invite, error: fetchError } = await admin
      .from("tenant_member_invites")
      .select("id, email, status, expires_at, email_sent_at, email_send_count")
      .eq("id", inviteId)
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .maybeSingle()

    if (fetchError || !invite) {
      throw new Error("招待が見つかりません。")
    }

    // Rate limit: max 5 sends total
    const sendCount = (invite.email_send_count as number) ?? 0
    if (sendCount >= 5) {
      throw new Error("この招待の再送信回数の上限（5回）に達しています。招待を取り消して新たに発行してください。")
    }

    // Rate limit: min 10 minutes between sends
    if (invite.email_sent_at) {
      const lastSentMs = new Date(invite.email_sent_at as string).getTime()
      const cooldownMs = 10 * 60 * 1000
      const remainingSec = Math.ceil((lastSentMs + cooldownMs - Date.now()) / 1000)
      if (remainingSec > 0) {
        const remainingMin = Math.ceil(remainingSec / 60)
        throw new Error(`再送信は${remainingMin}分後に実行できます。`)
      }
    }

    // Generate a new token (refreshes the link and expiry)
    const token = `inv_${crypto.randomBytes(24).toString("base64url")}`
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    await admin
      .from("tenant_member_invites")
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt,
        invited_by: user.id,
        accepted_at: null,
        accepted_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inviteId)
      .eq("tenant_id", tenantId)

    const appUrl = getAppUrl().replace(/\/$/, "")
    const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(token)}`

    const [{ data: tenant }, inviterData] = await Promise.all([
      admin.from("tenants").select("display_name").eq("id", tenantId).maybeSingle(),
      admin.auth.admin.getUserById(user.id),
    ])

    await sendMemberInviteEmail({
      toEmail: invite.email as string,
      inviteUrl,
      token,
      tenantName: tenant?.display_name ?? "knotic",
      invitedByEmail: inviterData.data.user?.email ?? "",
      expiresAt,
    })

    await admin
      .from("tenant_member_invites")
      .update({
        email_sent_at: new Date().toISOString(),
        email_send_count: sendCount + 1,
      })
      .eq("id", inviteId)

    await writeAuditLog(admin, {
      tenantId,
      action: "tenant.member.invite.resend",
      targetType: "tenant_member_invite",
      targetId: inviteId,
      after: { email: invite.email, send_count: sendCount + 1 },
    })

    redirect(toAppUrl(redirectTo, { notice: "招待メールを再送信しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "再送信に失敗しました。",
      })
    )
  }
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const maybe = error as { code?: string | null; message?: string | null }
  return (
    maybe.code === "42P01" ||
    String(maybe.message ?? "").toLowerCase().includes("does not exist")
  )
}

export async function updateMemberHostedAccessAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const memberUserId = String(formData.get("member_user_id") ?? "").trim()
    const { tenantId } = await getTenantContext(true)
    const admin = createAdminClient()

    if (!memberUserId) {
      throw new Error("メンバーIDが指定されていません。")
    }

    const { data: memberRow, error: memberError } = await admin
      .from("tenant_memberships")
      .select("user_id, is_active")
      .eq("tenant_id", tenantId)
      .eq("user_id", memberUserId)
      .maybeSingle()

    if (memberError) throw memberError
    if (!memberRow) {
      throw new Error("対象メンバーが見つかりません。")
    }

    const { data: botsRaw, error: botsError } = await admin
      .from("bots")
      .select("id")
      .eq("tenant_id", tenantId)
      .neq("status", "archived")

    if (botsError) throw botsError

    const allBotIds = new Set((botsRaw ?? []).map((row) => String(row.id)))
    const allowedBotIds = new Set(
      formData
        .getAll("allowed_bot_ids")
        .map((value) => String(value))
        .filter((botId) => allBotIds.has(botId))
    )
    const blockedBotIds = [...allBotIds].filter((botId) => !allowedBotIds.has(botId))

    const { error: clearError } = await admin
      .from("bot_hosted_access_blocks")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", memberUserId)

    if (clearError) {
      if (isMissingRelationError(clearError)) {
        throw new Error("Bot単位アクセス制御テーブルが未適用です。DBパッチを適用してください。")
      }
      throw clearError
    }

    if (blockedBotIds.length > 0) {
      const rows = blockedBotIds.map((botId) => ({
        tenant_id: tenantId,
        bot_id: botId,
        user_id: memberUserId,
      }))
      const { error: insertError } = await admin.from("bot_hosted_access_blocks").insert(rows)
      if (insertError) {
        if (isMissingRelationError(insertError)) {
          throw new Error("Bot単位アクセス制御テーブルが未適用です。DBパッチを適用してください。")
        }
        throw insertError
      }
    }

    await writeAuditLog(admin, {
      tenantId,
      action: "tenant.member.bot_access.update",
      targetType: "tenant_membership",
      targetId: memberUserId,
      after: {
        allowed_bot_count: allowedBotIds.size,
        blocked_bot_count: blockedBotIds.length,
      },
    })

    redirect(toAppUrl(redirectTo, { notice: "メンバーのBotアクセス権を更新しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "メンバーのBotアクセス権更新に失敗しました。",
      })
    )
  }
}

// ── テナント切り替え ─────────────────────────────────────────
export async function switchTenantAction(formData: FormData) {
  const tenantId = String(formData.get("tenant_id") ?? "").trim()
  if (!tenantId) redirect("/console/overview")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/console")

  // Verify the user actually has an active membership in the target tenant
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle()

  if (!membership) {
    redirect("/console/overview?error=対象テナントへのアクセス権がありません。")
  }

  const admin = createAdminClient()
  await admin
    .from("profiles")
    .update({ default_tenant_id: tenantId })
    .eq("user_id", user.id)

  redirect("/console/overview?notice=テナントを切り替えました。")
}

// ── トークンでテナントに参加（既テナント所属ユーザー向け）──────────────
export async function joinTenantByTokenAction(formData: FormData) {
  const rawInput = String(formData.get("token") ?? "").trim()

  // Accept full invite URL or raw token
  let token = rawInput
  try {
    const url = new URL(rawInput)
    token = url.searchParams.get("token") ?? rawInput
  } catch {}

  if (!token) {
    redirect("/console/overview?error=招待URLまたはトークンを入力してください。")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/console")

  const userEmail = user.email?.trim().toLowerCase()
  if (!userEmail) {
    redirect("/console/overview?error=アカウントのメールアドレスを取得できませんでした。")
  }

  const admin = createAdminClient()
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  const { data: invite } = await admin
    .from("tenant_member_invites")
    .select("id, tenant_id, email, role, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (!invite) {
    redirect("/console/overview?error=招待トークンが見つかりません。無効または期限切れの可能性があります。")
  }
  if (invite.status !== "pending") {
    redirect("/console/overview?error=この招待は既に使用済みまたは取り消されています。")
  }
  if (new Date(invite.expires_at) < new Date()) {
    redirect("/console/overview?error=招待の有効期限が切れています。管理者に再発行を依頼してください。")
  }
  if (invite.email.trim().toLowerCase() !== userEmail) {
    redirect(`/console/overview?error=招待先メールアドレスが一致しません（招待先: ${invite.email}）。`)
  }

  await admin.from("tenant_memberships").upsert(
    { tenant_id: invite.tenant_id, user_id: user.id, role: invite.role, is_active: true },
    { onConflict: "tenant_id,user_id" }
  )

  await admin
    .from("tenant_member_invites")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)

  // Switch to the new tenant
  await admin
    .from("profiles")
    .update({ default_tenant_id: invite.tenant_id })
    .eq("user_id", user.id)

  const { data: tenant } = await admin
    .from("tenants")
    .select("display_name")
    .eq("id", invite.tenant_id)
    .maybeSingle()

  const name = tenant?.display_name ?? "テナント"
  redirect(`/console/overview?notice=${encodeURIComponent(`${name} に参加しました。`)}`)
}
