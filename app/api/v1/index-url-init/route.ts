import crypto from "node:crypto"
import { type NextRequest } from "next/server"

import { writeAuditLog } from "@/app/console/_lib/audit"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { assertTenantCanIndexData } from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"

// Lightweight route that handles auth, billing, and job creation for URL indexing.
// Returns { jobId } which the client then passes to the Supabase Edge Function
// to run the actual crawl+index pipeline with SSE streaming.
//
// To switch to Vercel Pro (inline SSE), remove this route and use /api/v1/index-url directly.

export async function POST(request: NextRequest) {
  // Auth must be resolved outside any async streams
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

  try {
    await assertTenantCanIndexData(tenantId, 0)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "クォータ超過です。" },
      { status: 403 }
    )
  }

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
    return Response.json({ error: "ソース作成に失敗しました。" }, { status: 500 })
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

  if (jobError) {
    return Response.json({ error: "ジョブ作成に失敗しました。" }, { status: 500 })
  }

  await writeAuditLog(auditSupabase, {
    tenantId,
    action: "source.url.add",
    targetType: "source",
    targetId: botId,
    after: { bot_id: botId, url },
  })

  return Response.json({ jobId })
}
