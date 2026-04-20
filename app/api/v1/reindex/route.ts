import crypto from "node:crypto"
import { type NextRequest } from "next/server"

import { writeAuditLog } from "@/app/console/_lib/audit"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { assertTenantCanIndexData } from "@/lib/billing/limits"
import { processIndexingJob } from "@/lib/indexing/pipeline"
import { createAdminClient } from "@/lib/supabase/admin"

// Queues a re-index job for an existing source and returns { jobId }.
// The client then passes jobId to the Supabase Edge Function for actual processing.

export async function POST(request: NextRequest) {
  let tenantId: string
  let userId: string
  let auditSupabase: Parameters<typeof writeAuditLog>[0]

  try {
    const { user, membership, supabase } = await requireConsoleContext()
    if (!membership) {
      return Response.json({ error: "テナント情報が見つかりません。" }, { status: 403 })
    }
    if (membership.role !== "editor") {
      return Response.json({ error: "編集権限が必要です。" }, { status: 403 })
    }
    tenantId = membership.tenant_id
    userId = user.id
    auditSupabase = supabase
  } catch {
    return Response.json({ error: "認証が必要です。" }, { status: 401 })
  }

  let body: { sourceId?: string; botId?: string; mode?: string }
  try {
    body = (await request.json()) as { sourceId?: string; botId?: string; mode?: string }
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 })
  }

  const { sourceId, botId, mode } = body
  if (!sourceId) {
    return Response.json({ error: "sourceId は必須です。" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify source belongs to this tenant
  const { data: source } = await admin
    .from("sources")
    .select("id, bot_id, type")
    .eq("id", sourceId)
    .maybeSingle()

  if (!source) {
    return Response.json({ error: "ソースが見つかりません。" }, { status: 404 })
  }
  const sourceType = String((source as { type?: string | null }).type ?? "")
  const indexMode = sourceType === "url" && mode === "llm" ? "llm" : "raw"

  // Verify the source is attached to a bot in this tenant. Do not let a request
  // override source ownership by passing an unrelated botId.
  const resolvedBotId = (source.bot_id as string | null) ?? ""
  if (botId && botId !== resolvedBotId) {
    return Response.json({ error: "ソースとBotの組み合わせが正しくありません。" }, { status: 400 })
  }
  if (resolvedBotId) {
    const { data: bot } = await admin
      .from("bots")
      .select("id")
      .eq("id", resolvedBotId)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    if (!bot) {
      return Response.json({ error: "Bot が見つかりません。" }, { status: 404 })
    }
  }

  try {
    await assertTenantCanIndexData(tenantId, 0)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "クォータ超過です。" },
      { status: 403 }
    )
  }

  // Reset source status to queued
  await admin.from("sources").update({ status: "queued" }).eq("id", sourceId)
  if (resolvedBotId) {
    await admin.from("bots").update({ status: "queued" }).eq("id", resolvedBotId)
  }

  const jobId = crypto.randomUUID()
  const { error: jobError } = await admin.from("indexing_jobs").insert({
    id: jobId,
    tenant_id: tenantId,
    bot_id: resolvedBotId || null,
    source_id: sourceId,
    status: "queued",
    job_type: "manual",
    embedding_model: "text-embedding-3-small",
    requested_by: userId,
    index_mode: indexMode,
  })

  if (jobError) {
    return Response.json({ error: "ジョブ作成に失敗しました。" }, { status: 500 })
  }

  await writeAuditLog(auditSupabase, {
    tenantId,
    action: "indexing.queue",
    targetType: "source",
    targetId: sourceId,
    after: { bot_id: resolvedBotId || null, embedding_model: "text-embedding-3-small", source_type: sourceType, index_mode: indexMode },
  })

  if (sourceType !== "url") {
    try {
      await processIndexingJob(jobId)
      return Response.json({ jobId, sourceType, completed: true })
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "ファイルのナレッジ更新に失敗しました。" },
        { status: 500 }
      )
    }
  }

  return Response.json({ jobId, sourceType, completed: false })
}
