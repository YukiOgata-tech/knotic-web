import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

import {
  assertTenantCanConsumeMessage,
  assertTenantCanUseHostedPage,
  createTenantNotification,
  getMonthStartString,
  getTenantMonthlyMessages,
  getTenantPlanSnapshot,
} from "@/lib/billing/limits"
import { createEmbeddings } from "@/lib/indexing/embeddings"
import { generateAnswer, type ConversationTurn } from "@/lib/llm/responses"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_MODELS = new Set(["5-nano", "5-mini", "5", "4o-mini", "4o"])

type ChatRequest = {
  botPublicId?: string
  botId?: string
  message?: string
  conversation?: ConversationTurn[]
  model?: string
  widgetToken?: string
}

type BotRow = {
  id: string
  tenant_id: string
  public_id: string
  name: string
  status: string
  is_public: boolean
  access_mode: "public" | "internal" | null
  require_auth_for_hosted: boolean | null
  force_stopped: boolean | null
  force_stop_reason: string | null
  history_turn_limit: number | null
  ai_model: string | null
  ai_fallback_model: string | null
  ai_max_output_tokens: number | null
}

type SourceRow = {
  id: string
  type: "url" | "pdf" | "file"
  url: string | null
  file_name: string | null
  file_path: string | null
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function extractApiKey(request: NextRequest) {
  const headerKey = request.headers.get("x-knotic-api-key")
  if (headerKey) return headerKey.trim()

  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const value = auth.slice("Bearer ".length).trim()
  return value.startsWith("knotic_api_") ? value : null
}

function extractWidgetToken(request: NextRequest, bodyToken: string | undefined) {
  const header = request.headers.get("x-knotic-widget-token")
  if (header?.trim()) return header.trim()
  if (bodyToken?.trim()) return bodyToken.trim()
  return null
}

function normalizeModel(candidate: string | undefined, fallback: string) {
  if (!candidate) return fallback
  const value = candidate.trim()
  return ALLOWED_MODELS.has(value) ? value : fallback
}

function parseOriginHost(origin: string | null) {
  if (!origin) return null
  try {
    return new URL(origin).origin
  } catch {
    return null
  }
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4))
}

function getHistoryTurnLimitCap(planCode: string) {
  return planCode === "lite" ? 20 : 30
}

function normalizeConversation(
  conversation: ConversationTurn[] | undefined,
  maxTurns: number
): ConversationTurn[] {
  const turns = Array.isArray(conversation) ? conversation : []
  return turns
    .filter(
      (turn): turn is ConversationTurn =>
        (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string"
    )
    .slice(-Math.max(1, maxTurns))
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient()
  const body = (await request.json().catch(() => ({}))) as ChatRequest
  const message = body.message?.trim() ?? ""
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 })
  }

  const botPublicId = body.botPublicId?.trim()
  const botId = body.botId?.trim()
  if (!botPublicId && !botId) {
    return NextResponse.json({ error: "botPublicId or botId is required" }, { status: 400 })
  }

  let botQuery = admin
    .from("bots")
    .select("id, tenant_id, public_id, name, status, is_public, access_mode, require_auth_for_hosted, force_stopped, force_stop_reason, history_turn_limit, ai_model, ai_fallback_model, ai_max_output_tokens")
    .limit(1)
  if (botPublicId) {
    botQuery = botQuery.eq("public_id", botPublicId)
  } else {
    botQuery = botQuery.eq("id", botId!)
  }
  const { data: botData, error: botError } = await botQuery.maybeSingle()
  if (botError || !botData) {
    return NextResponse.json({ error: "bot not found" }, { status: 404 })
  }

  const bot = botData as BotRow

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("id, force_stopped, force_stop_reason")
    .eq("id", bot.tenant_id)
    .maybeSingle()

  if (tenantRow?.force_stopped) {
    return NextResponse.json(
      { error: tenantRow.force_stop_reason ?? "tenant is force-stopped by operator" },
      { status: 423 }
    )
  }

  if (bot.force_stopped) {
    return NextResponse.json(
      { error: bot.force_stop_reason ?? "bot is force-stopped by operator" },
      { status: 423 }
    )
  }

  if (bot.status !== "ready" && bot.status !== "running") {
    return NextResponse.json(
      { error: "bot is not ready. please run indexing first." },
      { status: 409 }
    )
  }

  const apiKey = extractApiKey(request)
  const widgetToken = extractWidgetToken(request, body.widgetToken)
  const origin = parseOriginHost(request.headers.get("origin"))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = user
    ? await admin
        .from("tenant_memberships")
        .select("tenant_id")
        .eq("tenant_id", bot.tenant_id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null as { tenant_id: string } | null }

  const internalUser = Boolean(membership)
  const requiresInternalAuth = bot.access_mode === "internal" || Boolean(bot.require_auth_for_hosted)
  const plan = await getTenantPlanSnapshot(bot.tenant_id)

  let authMode: "api_key" | "widget" | "public" | "internal_user" | null = null
  if (apiKey) {
    const keyHash = sha256(apiKey)
    const { data: keyRow } = await admin
      .from("tenant_api_keys")
      .select("id, expires_at")
      .eq("tenant_id", bot.tenant_id)
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .is("revoked_at", null)
      .maybeSingle()
    const expired = keyRow?.expires_at
      ? new Date(String(keyRow.expires_at)).getTime() <= Date.now()
      : false
    if (!keyRow || expired) {
      return NextResponse.json({ error: "invalid api key" }, { status: 401 })
    }
    if (!plan.hasApi) {
      return NextResponse.json({ error: "api is not available on current plan" }, { status: 403 })
    }
    authMode = "api_key"
  } else if (widgetToken) {
    const tokenHash = sha256(widgetToken)
    const { data: tokenRow } = await admin
      .from("bot_public_tokens")
      .select("id, allowed_origins")
      .eq("bot_id", bot.id)
      .eq("public_token_hash", tokenHash)
      .is("revoked_at", null)
      .maybeSingle()
    if (!tokenRow) {
      return NextResponse.json({ error: "invalid widget token" }, { status: 401 })
    }
    const allowed = (tokenRow.allowed_origins ?? []) as string[]
    if (allowed.length > 0 && origin && !allowed.includes(origin)) {
      return NextResponse.json({ error: "origin not allowed" }, { status: 403 })
    }
    authMode = "widget"
  } else if (internalUser) {
    authMode = "internal_user"
  } else {
    if (requiresInternalAuth) {
      return NextResponse.json({ error: "authentication required" }, { status: 401 })
    }
    if (!bot.is_public) {
      return NextResponse.json({ error: "authentication required" }, { status: 401 })
    }
    authMode = "public"
  }

  if (authMode === "public" || authMode === "internal_user") {
    try {
      await assertTenantCanUseHostedPage(bot.tenant_id, bot.id)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "hosted url unavailable" },
        { status: 403 }
      )
    }
  }

  try {
    await assertTenantCanConsumeMessage(bot.tenant_id)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "quota exceeded" },
      { status: 402 }
    )
  }

  const defaultModel = normalizeModel(bot.ai_model ?? "5-mini", "5-mini")
  const fallbackModel = bot.ai_fallback_model
    ? normalizeModel(bot.ai_fallback_model, defaultModel)
    : null
  const selectedModel = defaultModel
  const maxOutputTokens = Number(bot.ai_max_output_tokens ?? 900)
  const conversationLimit = Math.min(
    getHistoryTurnLimitCap(plan.planCode),
    Math.max(1, bot.history_turn_limit ?? 8)
  )
  const normalizedConversation = normalizeConversation(body.conversation, conversationLimit)

  const [queryEmbedding] = await createEmbeddings([message])
  const vector = `[${queryEmbedding.join(",")}]`
  const { data: matches, error: matchError } = await admin.rpc("match_chunks", {
    query_embedding: vector,
    target_tenant_id: bot.tenant_id,
    target_bot_id: bot.id,
    match_count: 8,
  })
  if (matchError) {
    return NextResponse.json({ error: `retrieval failed: ${matchError.message}` }, { status: 500 })
  }

  const chunks = (matches ?? []) as Array<{
    chunk_id: string
    source_id: string
    score: number
    text: string
    meta: { source_url?: string; source_title?: string; [key: string]: unknown }
  }>
  if (!chunks.length) {
    return NextResponse.json(
      {
        error: "no indexed content found for this bot",
        hint: "add sources and run indexing",
      },
      { status: 409 }
    )
  }

  const context = chunks
    .map((chunk, index) => {
      const url = chunk.meta?.source_url ?? "-"
      const title = chunk.meta?.source_title ?? "-"
      return `[#${index + 1}] title=${title} url=${url}\n${chunk.text}`
    })
    .join("\n\n")

  const systemPrompt = [
    "あなたは企業向けサポートAIです。",
    "必ず与えられたコンテキストのみで回答し、不明な場合は不明と答えてください。",
    "回答は簡潔に要点をまとめ、該当根拠番号 [n] を本文中に付けてください。",
    "案内可能な情報源がある場合は『URLはこちら』または『PDF資料はこちら』の形で案内してください。",
  ].join("\n")

  const userPrompt = [
    `質問:\n${message}`,
    "",
    "参照コンテキスト:",
    context,
  ].join("\n")

  const answer = await generateAnswer({
    model: selectedModel,
    fallbackModel,
    systemPrompt,
    userPrompt,
    conversation: normalizedConversation,
    maxOutputTokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 900,
  })

  const topChunks = chunks.slice(0, 5)
  const sourceIds = [...new Set(topChunks.map((chunk) => chunk.source_id))]
  const { data: sourceRows } = await admin
    .from("sources")
    .select("id, type, url, file_name, file_path")
    .in("id", sourceIds)

  const sourceById = new Map<string, SourceRow>()
  for (const row of sourceRows ?? []) {
    sourceById.set(row.id as string, row as SourceRow)
  }

  const citations = [] as Array<{
    rank: number
    sourceId: string
    score: number
    url: string | null
    title: string | null
    excerpt: string
    sourceType: "url" | "pdf" | "file"
    linkLabel: string
  }>

  for (let i = 0; i < topChunks.length; i += 1) {
    const chunk = topChunks[i]
    const source = sourceById.get(chunk.source_id)
    const sourceType = source?.type ?? "url"
    let link: string | null = chunk.meta?.source_url ?? null
    let linkLabel = "URLはこちら"

    if (sourceType === "url") {
      link = source?.url ?? link
      linkLabel = "URLはこちら"
    } else if ((sourceType === "pdf" || sourceType === "file") && source?.file_path) {
      const signed = await admin.storage.from("source-files").createSignedUrl(source.file_path, 60 * 60)
      link = signed.data?.signedUrl ?? null
      linkLabel = "PDF資料はこちら"
    }

    citations.push({
      rank: i + 1,
      sourceId: chunk.source_id,
      score: chunk.score,
      url: link,
      title: source?.file_name ?? (chunk.meta?.source_title as string | undefined) ?? null,
      excerpt: chunk.text.slice(0, 180),
      sourceType,
      linkLabel,
    })
  }

  const inputTokens = Number(answer.usage.input_tokens ?? estimateTokens(message + context))
  const outputTokens = Number(answer.usage.output_tokens ?? estimateTokens(answer.text))
  const today = new Date().toISOString().slice(0, 10)

  await admin.from("chat_logs").insert({
    tenant_id: bot.tenant_id,
    bot_id: bot.id,
    user_anon_id: authMode,
    question: message,
    answer: answer.text,
    token_usage_in: inputTokens,
    token_usage_out: outputTokens,
  })

  const { error: usageError } = await admin.rpc("increment_usage_daily", {
    p_tenant_id: bot.tenant_id,
    p_bot_id: bot.id,
    p_usage_date: today,
    p_messages: 1,
    p_tokens_in: inputTokens,
    p_tokens_out: outputTokens,
  })
  if (usageError) {
    await admin.from("usage_daily").upsert(
      {
        tenant_id: bot.tenant_id,
        bot_id: bot.id,
        usage_date: today,
        messages_count: 1,
        tokens_in: inputTokens,
        tokens_out: outputTokens,
      },
      { onConflict: "tenant_id,bot_id,usage_date" }
    )
  }

  const usedMessages = await getTenantMonthlyMessages(bot.tenant_id)
  const threshold = Math.floor(plan.maxMonthlyMessages * 0.8)
  if (usedMessages >= threshold) {
    await createTenantNotification({
      tenantId: bot.tenant_id,
      level: "warning",
      kind: "message_limit_near",
      title: "月間メッセージ上限が近づいています",
      message: `今月の利用は ${usedMessages}/${plan.maxMonthlyMessages} です。`,
      dedupeKey: `msg_warn:${bot.tenant_id}:${getMonthStartString()}`,
      metadata: {
        usedMessages,
        maxMonthlyMessages: plan.maxMonthlyMessages,
      },
    })
  }

  return NextResponse.json({
    answer: answer.text,
    model: answer.model,
    citations,
    usage: {
      inputTokens,
      outputTokens,
      monthlyMessagesUsed: usedMessages,
      monthlyMessagesLimit: plan.maxMonthlyMessages,
    },
  })
}

