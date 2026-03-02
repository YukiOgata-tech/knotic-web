import crypto from "node:crypto"
import { type NextRequest } from "next/server"

import { writeAuditLog } from "@/app/console/_lib/audit"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { assertTenantCanIndexData } from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import { processIndexingJob, type IndexProgressEvent } from "@/lib/indexing/pipeline"

type SseEvent = IndexProgressEvent | { type: "source_ready" } | { type: "error"; message: string }

export async function POST(request: NextRequest) {
  // cookies() は ReadableStream の外で呼ぶ必要がある
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

  let body: { botId?: string; url?: string }
  try {
    body = (await request.json()) as { botId?: string; url?: string }
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 })
  }

  const { botId, url: rawUrl } = body
  if (!botId || !rawUrl) {
    return Response.json({ error: "botId と url は必須です。" }, { status: 400 })
  }

  const url = rawUrl.trim()
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return Response.json({ error: "http/https 形式の URL を入力してください。" }, { status: 400 })
    }
  } catch {
    return Response.json({ error: "正しい URL 形式で入力してください。" }, { status: 400 })
  }

  // bot が当該テナントのものか確認
  const admin = createAdminClient()
  const { data: bot } = await admin
    .from("bots")
    .select("id")
    .eq("id", botId)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (!bot) {
    return Response.json({ error: "Bot が見つかりません。" }, { status: 404 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SseEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          // controller が既に閉じている場合は無視
        }
      }

      try {
        await assertTenantCanIndexData(tenantId, 0)

        const { data: insertedSource, error: insertError } = await admin
          .from("sources")
          .insert({
            bot_id: botId,
            type: "url",
            status: "queued",
            url,
            created_by: userId,
          })
          .select("id")
          .single()

        if (insertError || !insertedSource) {
          throw new Error("ソース作成に失敗しました。")
        }

        const jobId = crypto.randomUUID()
        const { error: jobError } = await admin.from("indexing_jobs").insert({
          id: jobId,
          tenant_id: tenantId,
          bot_id: botId,
          source_id: insertedSource.id,
          status: "queued",
          job_type: "auto",
          embedding_model: "text-embedding-3-small",
          requested_by: userId,
        })

        if (jobError) throw new Error("ジョブ作成に失敗しました。")

        await writeAuditLog(auditSupabase, {
          tenantId,
          action: "source.url.add",
          targetType: "source",
          targetId: botId,
          after: { bot_id: botId, url },
        })

        await processIndexingJob(jobId, send)

        send({ type: "source_ready" })
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "エラーが発生しました。" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
