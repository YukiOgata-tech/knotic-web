"use server"

import crypto from "node:crypto"
import { redirect } from "next/navigation"

import { assertTenantCanCreateBot, assertTenantCanIndexData } from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import { processQueuedIndexingJobs } from "@/lib/indexing/pipeline"
import { createClient } from "@/lib/supabase/server"

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

async function getTenantContext(requireEditor = false) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/console")
  }

  const { data: memberships, error } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)

  if (error || !memberships?.length) {
    throw new Error("Tenant membership not found. Run schema and patch SQL first.")
  }

  const membership = memberships[0] as Membership
  if (requireEditor && membership.role !== "editor") {
    throw new Error("Editor role is required for this action.")
  }

  return {
    supabase,
    user,
    tenantId: membership.tenant_id,
    role: membership.role,
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
    const { error } = await supabase.from("bots").insert({
      tenant_id: tenantId,
      public_id: publicId,
      name,
      description: description || null,
      status: "draft",
      is_public: false,
      created_by: user.id,
    })

    if (error) throw error
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
    const { supabase } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    const nextPublic = String(formData.get("next_public") ?? "") === "true"

    const { error } = await supabase
      .from("bots")
      .update({ is_public: nextPublic })
      .eq("id", botId)

    if (error) throw error
    redirect(toAppUrl(redirectTo, { notice: nextPublic ? "公開設定を有効化しました。" : "公開設定を停止しました。" }))
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
    const { supabase } = await getTenantContext(true)
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
    const { supabase } = await getTenantContext(true)
    const tokenId = String(formData.get("token_id") ?? "")
    const originsRaw = String(formData.get("allowed_origins") ?? "")
    const allowedOrigins = normalizeOrigins(originsRaw)

    const { error } = await supabase
      .from("bot_public_tokens")
      .update({ allowed_origins: allowedOrigins })
      .eq("id", tokenId)

    if (error) throw error
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
    const { supabase } = await getTenantContext(true)
    const keyId = String(formData.get("key_id") ?? "")
    const { error } = await supabase
      .from("tenant_api_keys")
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", keyId)

    if (error) throw error
    redirect(toAppUrl(redirectTo, { notice: "APIキーを失効しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "APIキー失効に失敗しました。",
      })
    )
  }
}

export async function saveAiSettingsAction(formData: FormData) {
  try {
    const redirectTo = String(formData.get("redirect_to") ?? "")
    const { supabase, tenantId } = await getTenantContext(true)
    const defaultModel = normalizeModel(
      String(formData.get("default_model") ?? "5-mini"),
      "5-mini"
    )
    const fallbackModelRaw = String(formData.get("fallback_model") ?? "").trim()
    const fallbackModel =
      fallbackModelRaw === "" ? null : normalizeModel(fallbackModelRaw, "5-mini")
    const allowOverride = String(formData.get("allow_model_override") ?? "") === "on"
    const maxOutputTokens = Number(formData.get("max_output_tokens") ?? 1200)

    const { error } = await supabase
      .from("tenants")
      .update({
        ai_default_model: defaultModel,
        ai_fallback_model: fallbackModel,
        ai_allow_model_override: allowOverride,
        ai_max_output_tokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 1200,
      })
      .eq("id", tenantId)

    if (error) {
      throw new Error("tenants のAI設定更新に失敗しました。table-consolidation patchを適用してください。")
    }

    redirect(toAppUrl(redirectTo, { notice: "AIモデル設定を更新しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "AIモデル設定の更新に失敗しました。",
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
    const { supabase } = await getTenantContext(true)
    const botId = String(formData.get("bot_id") ?? "")
    if (!botId) {
      redirect(toAppUrl(redirectTo, { error: "Botが指定されていません。" }))
    }

    const chatPurpose = normalizeChatPurpose(String(formData.get("chat_purpose") ?? "customer_support").trim())
    const accessMode = normalizeAccessMode(String(formData.get("access_mode") ?? "public").trim())
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
    const normalizedLimit = Number.isFinite(historyTurnLimit)
      ? Math.max(1, Math.min(30, Math.floor(historyTurnLimit)))
      : 8

    const { error } = await supabase
      .from("bots")
      .update({
        chat_purpose: chatPurpose,
        access_mode: accessMode,
        display_name: displayName || null,
        welcome_message: welcomeMessage || null,
        placeholder_text: placeholderText || null,
        disclaimer_text: disclaimerText || null,
        show_citations: showCitations,
        history_turn_limit: normalizedLimit,
        require_auth_for_hosted: requireAuthForHosted || accessMode === "internal",
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
      })
      .eq("id", botId)

    if (error) throw error
    redirect(toAppUrl(redirectTo, { notice: "Hostedチャット設定を更新しました。" }))
  } catch (error) {
    redirect(
      toAppUrl(String(formData.get("redirect_to") ?? ""), {
        error: error instanceof Error ? error.message : "Hosted設定の更新に失敗しました。",
      })
    )
  }
}







