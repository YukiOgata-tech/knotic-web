"use server"

import crypto from "node:crypto"
import { redirect } from "next/navigation"

import {
  assertTenantCanCreateBot,
  assertTenantCanIndexData,
  getTenantPlanSnapshot,
} from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import { processQueuedIndexingJobs } from "@/lib/indexing/pipeline"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/app/console/_lib/audit"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { getAppUrl } from "@/lib/env"

const ALLOWED_MODELS = [
  "5-nano",
  "5-mini",
  "5",
  "4o-mini",
  "4o",
] as const
const STORAGE_BUCKET = "source-files"
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024

function normalizeModel(value: string, fallback: (typeof ALLOWED_MODELS)[number]) {
  const normalized = value.trim()
  return (ALLOWED_MODELS as readonly string[]).includes(normalized)
    ? (normalized as (typeof ALLOWED_MODELS)[number])
    : fallback
}

type Membership = {
  tenant_id: string
  role: "editor" | "reader"
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

function getHistoryTurnLimitCap(planCode: string | null | undefined) {
  return planCode === "lite" ? 20 : 30
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

export async function addUrlSourceAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, user, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    const url = String(formData.get("url") ?? "").trim()

    if (!botId || !url) {
      redirect(toAppUrl(redirectTo, { error: "BotとURLを入力してください。" }))
    }
    await assertTenantCanIndexData(tenantId, 0)

    const { error } = await supabase.from("sources").insert({
      bot_id: botId,
      type: "url",
      status: "queued",
      url,
      created_by: user.id,
    })

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
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "URLソース追加に失敗しました。",
      })
    )
  }
}

export async function addPdfSourceAction(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") ?? "")

  try {
    const { supabase, user, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    const file = formData.get("pdf")

    if (!botId) {
      redirect(toAppUrl(redirectTo, { error: "Botを選択してください。" }))
    }

    if (!(file instanceof File) || file.size === 0) {
      redirect(toAppUrl(redirectTo, { error: "PDFファイルを選択してください。" }))
    }

    const fileName = file.name || "upload.pdf"
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (ext !== "pdf") {
      redirect(toAppUrl(redirectTo, { error: "PDF形式のみアップロードできます。" }))
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      redirect(toAppUrl(redirectTo, { error: "PDFサイズは20MB以下にしてください。" }))
    }
    await assertTenantCanIndexData(tenantId, file.size)

    const bytes = Buffer.from(await file.arrayBuffer())
    const contentHash = crypto.createHash("sha256").update(bytes).digest("hex")
    const storagePath = `${tenantId}/${botId}/${Date.now()}-${sanitizeFileName(fileName)}`

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      })

    if (uploadError) {
      throw new Error(
        "PDFアップロードに失敗しました。Storageバケット source-files の作成と権限設定を確認してください。"
      )
    }

    const { error: insertError } = await supabase.from("sources").insert({
      bot_id: botId,
      type: "pdf",
      status: "queued",
      file_path: storagePath,
      file_name: fileName,
      file_size_bytes: file.size,
      content_hash: contentHash,
      created_by: user.id,
    })

    if (insertError) {
      await admin.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw insertError
    }

    await writeAuditLog(supabase, {
      tenantId,
      action: "source.pdf.add",
      targetType: "source",
      targetId: botId,
      after: { bot_id: botId, file_name: fileName, file_size_bytes: file.size },
    })
    redirect(toAppUrl(redirectTo, { notice: "PDFソースを追加しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(redirectTo, {
        error: error instanceof Error ? error.message : "PDFソース追加に失敗しました。",
      })
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
    redirect(toAppUrl(redirectTo, { notice: "インデックス実行をキュー登録しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "インデックス実行に失敗しました。",
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
    redirect(toAppUrl(redirectTo, { notice: "インデックスジョブを1件実行しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "インデックス実行に失敗しました。",
      })
    )
  }
}



export async function updateHostedConfigAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    if (!botId) {
      redirect(toAppUrl(redirectTo, { error: "Botが指定されていません。" }))
    }
    const botName = String(formData.get("name") ?? "").trim()
    if (!botName) {
      redirect(toAppUrl(redirectTo, { error: "Bot名を入力してください。" }))
    }

    const chatPurpose = normalizeChatPurpose(String(formData.get("chat_purpose") ?? "customer_support").trim())
    const requestedAccessMode = normalizeAccessMode(String(formData.get("access_mode") ?? "public").trim())
    const displayName = String(formData.get("display_name") ?? "").trim()
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
    const aiModel = normalizeModel(String(formData.get("ai_model") ?? "5-mini"), "5-mini")
    const aiFallbackRaw = String(formData.get("ai_fallback_model") ?? "").trim()
    const aiFallbackModel = aiFallbackRaw === "" ? null : normalizeModel(aiFallbackRaw, "5-mini")
    const aiMaxOutputTokensRaw = Number(formData.get("ai_max_output_tokens") ?? 1200)
    const aiMaxOutputTokens = Number.isFinite(aiMaxOutputTokensRaw)
      ? Math.max(200, Math.min(4000, Math.floor(aiMaxOutputTokensRaw)))
      : 1200
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
        display_name: displayName || null,
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
        widget_launcher_label: widgetLauncherLabel || "チャット",
        widget_policy_text:
          widgetPolicyText ||
          "このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。",
        widget_redirect_new_tab: widgetRedirectNewTab,
        ai_model: aiModel,
        ai_fallback_model: aiFallbackModel,
        ai_max_output_tokens: aiMaxOutputTokens,
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
      },
    })
    redirect(toAppUrl(redirectTo, { notice: "Hostedチャット設定を更新しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "Hosted設定の更新に失敗しました。",
      })
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await admin
      .from("tenant_member_invites")
      .upsert(
        {
          tenant_id: tenantId,
          email,
          role,
          token_hash: tokenHash,
          status: "pending",
          invited_by: user.id,
          expires_at: expiresAt,
          accepted_at: null,
          accepted_by: null,
        },
        { onConflict: "tenant_id,email" }
      )

    if (error) {
      throw new Error("招待作成に失敗しました。patch SQLの適用状態を確認してください。")
    }

    await writeAuditLog(admin, {
      tenantId,
      action: "tenant.member.invite.create",
      targetType: "tenant_member_invite",
      after: { email, role, expires_at: expiresAt },
    })

    const appUrl = getAppUrl().replace(/\/$/, "")
    const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(token)}`

    redirect(
      toAppUrl(redirectTo, {
        notice: "招待リンクを発行しました。共有してください。",
        invite_link: inviteUrl,
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
