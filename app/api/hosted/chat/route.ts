import { NextRequest, NextResponse } from "next/server"

import {
  assertTenantCanConsumeMessage,
  createTenantNotification,
  getMonthStartString,
  getTenantMonthlyMessages,
  getTenantPlanSnapshot,
} from "@/lib/billing/limits"
import { answerWithOpenAiFileSearch, getBotOpenAiVectorStoreId } from "@/lib/filesearch/openai"
import { type ConversationTurn } from "@/lib/llm/responses"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireHostedMemberContext } from "@/lib/hosted/access"

const ALLOWED_MODELS = new Set(["5-nano", "5-mini", "5"])

type ChatRequest = {
  botPublicId?: string
  roomId?: string
  message?: string
}

type SourceRow = {
  id: string
  type: "url" | "pdf" | "file"
  url: string | null
  file_name: string | null
  file_path: string | null
}

type CitationItem = {
  rank: number
  sourceId: string
  score: number
  url: string | null
  title: string | null
  excerpt: string
  sourceType: "url" | "pdf" | "file"
  linkLabel: string
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4))
}

function getHistoryTurnLimitCap(planCode: string) {
  return planCode === "lite" ? 20 : 30
}

function normalizeModel(candidate: string | undefined, fallback: string) {
  if (!candidate) return fallback
  const value = candidate.trim()
  return ALLOWED_MODELS.has(value) ? value : fallback
}

function toErrorStatus(message: string) {
  if (message === "authentication_required") return 401
  if (message === "membership_required") return 403
  if (message === "bot_not_found" || message === "room_not_found") return 404
  if (message === "bot_not_ready") return 409
  if (message === "internal_mode_required") return 400
  return 400
}

async function buildCitationsFromSources(admin: ReturnType<typeof createAdminClient>, sourceRows: SourceRow[]) {
  const citations: CitationItem[] = []
  for (let i = 0; i < sourceRows.length; i += 1) {
    const source = sourceRows[i]
    const sourceType = source.type
    let link: string | null = source.url ?? null
    let linkLabel = "URLはこちら"
    if ((sourceType === "pdf" || sourceType === "file") && source.file_path) {
      const signed = await admin.storage.from("source-files").createSignedUrl(source.file_path, 60 * 60)
      link = signed.data?.signedUrl ?? null
      linkLabel = "PDF資料はこちら"
    }
    citations.push({
      rank: i + 1,
      sourceId: source.id,
      score: 0,
      url: link,
      title: source.file_name ?? null,
      excerpt: "",
      sourceType,
      linkLabel,
    })
  }
  return citations
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient()
  try {
    const body = (await request.json().catch(() => ({}))) as ChatRequest
    const message = body.message?.trim() ?? ""
    const botPublicId = body.botPublicId?.trim()
    const roomId = body.roomId?.trim()

    if (!message || !botPublicId || !roomId) {
      return NextResponse.json({ error: "botPublicId, roomId, message are required" }, { status: 400 })
    }

    const { bot, user } = await requireHostedMemberContext(botPublicId)

    const { data: room } = await admin
      .from("hosted_chat_rooms")
      .select("id, tenant_id, bot_id, owner_user_id")
      .eq("id", roomId)
      .eq("tenant_id", bot.tenant_id)
      .eq("bot_id", bot.id)
      .eq("owner_user_id", user.id)
      .eq("is_archived", false)
      .maybeSingle()

    if (!room) {
      return NextResponse.json({ error: "room_not_found" }, { status: 404 })
    }

    try {
      await assertTenantCanConsumeMessage(bot.tenant_id)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "quota exceeded" },
        { status: 402 }
      )
    }

    const plan = await getTenantPlanSnapshot(bot.tenant_id)
    const conversationLimit = Math.min(
      getHistoryTurnLimitCap(plan.planCode),
      Math.max(1, bot.history_turn_limit ?? 8)
    )

    const { data: roomHistory } = await admin
      .from("hosted_chat_messages")
      .select("role, content")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(conversationLimit * 2)

    const conversation = (roomHistory ?? [])
      .reverse()
      .filter((item): item is { role: "user" | "assistant"; content: string } =>
        (item.role === "user" || item.role === "assistant") && typeof item.content === "string"
      )
      .map((item) => ({ role: item.role, content: item.content })) as ConversationTurn[]

    await admin.from("hosted_chat_messages").insert({
      room_id: roomId,
      tenant_id: bot.tenant_id,
      bot_id: bot.id,
      user_id: user.id,
      role: "user",
      content: message,
    })

    const defaultModel = normalizeModel(bot.ai_model ?? "5-mini", "5-mini")
    const fallbackModel = bot.ai_fallback_model
      ? normalizeModel(bot.ai_fallback_model, defaultModel)
      : null
    const maxOutputTokens = Number(bot.ai_max_output_tokens ?? 1200)
    let citations: CitationItem[] = []
    const vectorStoreId = await getBotOpenAiVectorStoreId(bot.id)
    if (!vectorStoreId) {
      return NextResponse.json(
        {
          error: "file search store is not ready for this bot",
          hint: "run indexing to sync sources into file search",
        },
        { status: 409 }
      )
    }

    const fsAnswer = await answerWithOpenAiFileSearch({
      vectorStoreId,
      model: defaultModel,
      fallbackModel,
      systemPrompt: [
        "あなたは企業向けサポートAIです。",
        "検索結果が不足する場合は不足を明示してください。",
        "回答は簡潔に要点をまとめ、根拠を示してください。",
      ].join("\n"),
      message,
      conversation,
      maxOutputTokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 1200,
    })
    const answer = { model: fsAnswer.model, text: fsAnswer.text, usage: fsAnswer.usage }

    if (fsAnswer.citationFileIds.length > 0) {
      const { data: sourceRows } = await admin
        .from("sources")
        .select("id, type, url, file_name, file_path")
        .eq("bot_id", bot.id)
        .in("file_search_file_id", fsAnswer.citationFileIds)
        .limit(5)
      citations = await buildCitationsFromSources(admin, (sourceRows ?? []) as SourceRow[])
    }

    await admin.from("hosted_chat_messages").insert({
      room_id: roomId,
      tenant_id: bot.tenant_id,
      bot_id: bot.id,
      user_id: user.id,
      role: "assistant",
      content: answer.text,
      citations,
    })

    await admin
      .from("hosted_chat_rooms")
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId)

    const inputTokens = Number(answer.usage.input_tokens ?? estimateTokens(message))
    const outputTokens = Number(answer.usage.output_tokens ?? estimateTokens(answer.text))
    const today = new Date().toISOString().slice(0, 10)

    await admin.from("chat_logs").insert({
      tenant_id: bot.tenant_id,
      bot_id: bot.id,
      user_anon_id: "internal_user_room",
      question: message,
      answer: answer.text,
      token_usage_in: inputTokens,
      token_usage_out: outputTokens,
    })

    await admin.rpc("increment_usage_daily", {
      p_tenant_id: bot.tenant_id,
      p_bot_id: bot.id,
      p_usage_date: today,
      p_messages: 1,
      p_tokens_in: inputTokens,
      p_tokens_out: outputTokens,
    })

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
        metadata: { usedMessages, maxMonthlyMessages: plan.maxMonthlyMessages },
      })
    }

    return NextResponse.json({
      answer: answer.text,
      citations,
      usage: {
        inputTokens,
        outputTokens,
        monthlyMessagesUsed: usedMessages,
        monthlyMessagesLimit: plan.maxMonthlyMessages,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed"
    return NextResponse.json({ error: message }, { status: toErrorStatus(message) })
  }
}
