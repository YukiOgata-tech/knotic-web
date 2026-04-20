import crypto from "node:crypto"

import { assertTenantCanIndexData } from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import { SPREADSHEET_EXTENSIONS, syncSourceTextToOpenAiFileSearch, syncBinaryFileToOpenAiFileSearch } from "@/lib/filesearch/openai"
import {
  MAX_CRAWL_PAGES_PER_JOB,
  STORAGE_BUCKET_ARTIFACTS,
} from "@/lib/indexing/config"
import { fetchPage, fetchWithRetry, filterUrlsByHost, parseSitemapUrls, USER_AGENT } from "@/lib/indexing/html"
import { pdfToStructuredMarkdown } from "@/lib/indexing/pdf"
import { spreadsheetToMarkdown } from "@/lib/indexing/spreadsheet"

export type IndexProgressEvent =
  | { type: "fetching_sitemap" }
  | { type: "sitemap_ready"; total: number }
  | { type: "single_page" }
  | { type: "page_progress"; done: number; total: number }
  | { type: "syncing_openai" }

type IndexingJob = {
  id: string
  tenant_id: string
  bot_id: string | null
  source_id: string | null
}

type SourceRow = {
  id: string
  bot_id: string
  type: "url" | "pdf" | "file"
  url: string | null
  file_path: string | null
  file_name: string | null
}

const FETCH_CONCURRENCY = 3

function artifactPath(tenantId: string, sourceId: string, kind: "raw" | "text", suffix: string) {
  // crypto.randomUUID slice で並列アップロード時のパス衝突を防ぐ
  return `${tenantId}/${sourceId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${kind}.${suffix}`
}

function maybeSitemap(url: string) {
  try {
    const path = new URL(url).pathname.toLowerCase()
    return path.endsWith(".xml") || /(?:^|\/)sitemap(?:[-_]index)?$/.test(path)
  } catch {
    return url.toLowerCase().endsWith(".xml")
  }
}

async function uploadArtifact(path: string, content: string, contentType: string) {
  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(STORAGE_BUCKET_ARTIFACTS)
    .upload(path, Buffer.from(content, "utf-8"), { contentType, upsert: false })
  if (error) {
    throw new Error(
      `Storage upload failed for ${path}. Ensure bucket '${STORAGE_BUCKET_ARTIFACTS}' exists.`
    )
  }
}


async function upsertSourcePage(params: {
  sourceId: string
  tenantId: string
  botId: string
  canonicalUrl: string
  title: string | null
  statusCode: number
  contentHash: string
  rawPath: string
  textPath: string
  rawBytes: number
  textBytes: number
}) {
  const admin = createAdminClient()
  const { error } = await admin.from("source_pages").upsert(
    {
      source_id: params.sourceId,
      tenant_id: params.tenantId,
      bot_id: params.botId,
      canonical_url: params.canonicalUrl,
      title: params.title,
      status_code: params.statusCode,
      content_hash: params.contentHash,
      raw_path: params.rawPath,
      text_path: params.textPath,
      raw_bytes: params.rawBytes,
      text_bytes: params.textBytes,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "source_id,canonical_url" }
  )
  if (error) throw error
}

type PageResult = { contentHash: string; section: string }

async function fetchAndStorePage(params: {
  pageUrl: string
  tenantId: string
  sourceId: string
  botId: string
}): Promise<PageResult | null> {
  const page = await fetchPage(params.pageUrl)
  if (!page.text) return null

  const rawPath = artifactPath(params.tenantId, params.sourceId, "raw", "html")
  const textPath = artifactPath(params.tenantId, params.sourceId, "text", "txt")
  await uploadArtifact(rawPath, page.rawHtml, "text/html; charset=utf-8")
  await uploadArtifact(textPath, page.text, "text/plain; charset=utf-8")

  await upsertSourcePage({
    sourceId: params.sourceId,
    tenantId: params.tenantId,
    botId: params.botId,
    canonicalUrl: page.url,
    title: page.title,
    statusCode: page.statusCode,
    contentHash: page.contentHash,
    rawPath,
    textPath,
    rawBytes: Buffer.byteLength(page.rawHtml, "utf-8"),
    textBytes: Buffer.byteLength(page.text, "utf-8"),
  })

  return {
    contentHash: page.contentHash,
    section: [`## ${page.title ?? page.url}`, `URL: ${page.url}`, "", page.text].join("\n"),
  }
}

async function processUrlSource(
  job: IndexingJob,
  source: SourceRow,
  onProgress?: (event: IndexProgressEvent) => void
) {
  if (!source.url) throw new Error("URL source has no URL.")
  const admin = createAdminClient()
  await assertTenantCanIndexData(job.tenant_id, 0)

  let pageUrls: string[]
  if (maybeSitemap(source.url)) {
    onProgress?.({ type: "fetching_sitemap" })
    const sitemapRes = await fetchWithRetry(source.url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml,*/*;q=0.8" },
      cache: "no-store",
      redirect: "follow",
    })
    const discovered = filterUrlsByHost(source.url, parseSitemapUrls(await sitemapRes.text(), MAX_CRAWL_PAGES_PER_JOB))
    pageUrls = discovered.length ? discovered : [source.url]
    onProgress?.({ type: "sitemap_ready", total: pageUrls.length })
  } else {
    onProgress?.({ type: "single_page" })
    pageUrls = [source.url]
  }

  const pageHashes: string[] = []
  const aggregatedSections: string[] = []
  let pagesIndexed = 0

  // FETCH_CONCURRENCY 件ずつ並列処理
  for (let i = 0; i < pageUrls.length; i += FETCH_CONCURRENCY) {
    const chunk = pageUrls.slice(i, i + FETCH_CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map((pageUrl) =>
        fetchAndStorePage({ pageUrl, tenantId: job.tenant_id, sourceId: source.id, botId: source.bot_id })
      )
    )
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        pageHashes.push(result.value.contentHash)
        aggregatedSections.push(result.value.section)
        pagesIndexed += 1
      }
      // rejected（robots.txt 拒否、ネットワークエラー等）は該当ページをスキップ
    }
    onProgress?.({ type: "page_progress", done: pagesIndexed, total: pageUrls.length })
  }

  // ② テキストが1件も取得できなかった場合はエラーにする
  if (aggregatedSections.length === 0) {
    throw new Error("URLからテキストを取得できませんでした。ページにテキストが含まれているか確認してください。")
  }

  onProgress?.({ type: "syncing_openai" })

  // ⑥ 外側のadminをそのまま使用（シャドーイング解消）
  const { data: bot } = await admin
    .from("bots")
    .select("id, public_id, name")
    .eq("id", source.bot_id)
    .maybeSingle()
  if (!bot?.public_id) {
    throw new Error("Bot public_id is missing while syncing file search.")
  }
  await syncSourceTextToOpenAiFileSearch({
    botId: source.bot_id,
    botPublicId: String(bot.public_id),
    sourceId: source.id,
    sourceType: "url",
    sourceLabel: source.url ?? String(bot.name ?? "URL source"),
    text: aggregatedSections.join("\n\n---\n\n"),
  })

  const { error: sourceUpdateError } = await admin
    .from("sources")
    .update({
      status: "ready",
      content_hash: crypto
        .createHash("sha256")
        .update(pageHashes.join("|"))
        .digest("hex"),
    })
    .eq("id", source.id)
  if (sourceUpdateError) throw sourceUpdateError

  await admin
    .from("bots")
    .update({ status: "ready" })
    .eq("id", source.bot_id)

  return { pagesDiscovered: pageUrls.length, pagesIndexed }
}

async function processFileSource(job: IndexingJob, source: SourceRow) {
  if (!source.file_path) throw new Error("File source has no file path.")
  const admin = createAdminClient()
  await assertTenantCanIndexData(job.tenant_id, 0)

  const { data: fileBlob, error: fileError } = await admin.storage
    .from("source-files")
    .download(source.file_path)
  if (fileError || !fileBlob) {
    throw new Error("ファイルの取得に失敗しました。source-files バケットを確認してください。")
  }

  const fileBuffer = Buffer.from(await fileBlob.arrayBuffer())
  await assertTenantCanIndexData(job.tenant_id, fileBuffer.length)

  const { data: bot } = await admin
    .from("bots")
    .select("id, public_id, name")
    .eq("id", source.bot_id)
    .maybeSingle()
  if (!bot?.public_id) {
    throw new Error("Bot public_id is missing while syncing file search.")
  }

  const filename = source.file_name ?? `file-${source.id}`
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""

  if (ext === "pdf") {
    const markdown = await pdfToStructuredMarkdown(fileBuffer, filename)
    await syncSourceTextToOpenAiFileSearch({
      botId: source.bot_id,
      botPublicId: String(bot.public_id),
      sourceId: source.id,
      sourceType: "pdf",
      sourceLabel: filename,
      text: markdown,
    })
  } else if (SPREADSHEET_EXTENSIONS.has(ext)) {
    const markdown = spreadsheetToMarkdown(fileBuffer, filename)
    await syncSourceTextToOpenAiFileSearch({
      botId: source.bot_id,
      botPublicId: String(bot.public_id),
      sourceId: source.id,
      sourceType: "file",
      sourceLabel: filename,
      text: markdown,
    })
  } else {
    await syncBinaryFileToOpenAiFileSearch({
      botId: source.bot_id,
      botPublicId: String(bot.public_id),
      sourceId: source.id,
      filename,
      buffer: fileBuffer,
    })
  }

  const { error: sourceUpdateError } = await admin
    .from("sources")
    .update({
      status: "ready",
      content_hash: crypto.createHash("sha256").update(fileBuffer).digest("hex"),
    })
    .eq("id", source.id)
  if (sourceUpdateError) throw sourceUpdateError

  await admin.from("bots").update({ status: "ready" }).eq("id", source.bot_id)

  return { pagesDiscovered: 1, pagesIndexed: 1 }
}

export async function processIndexingJob(jobId: string, onProgress?: (event: IndexProgressEvent) => void) {
  const admin = createAdminClient()
  const workerId = `api-${crypto.randomUUID().slice(0, 8)}`

  const { data: job, error: jobError } = await admin
    .from("indexing_jobs")
    .select("id, tenant_id, bot_id, source_id, status")
    .eq("id", jobId)
    .maybeSingle()

  if (jobError) throw jobError
  if (!job || !job.source_id) throw new Error("Indexing job not found or source is empty.")
  if (job.status !== "queued") return { skipped: true as const }

  const { data: claimed, error: claimError } = await admin
    .from("indexing_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      worker_id: workerId,
      lock_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      error_message: null,
    })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id, tenant_id, bot_id, source_id")
    .maybeSingle()

  if (claimError) throw claimError
  if (!claimed) return { skipped: true as const }

  const { data: source, error: sourceError } = await admin
    .from("sources")
    .select("id, bot_id, type, url, file_path, file_name")
    .eq("id", claimed.source_id)
    .single()
  if (sourceError) throw sourceError

  const claimedJob = claimed as IndexingJob
  const sourceRow = source as SourceRow

  try {
    let metrics
    if (sourceRow.type === "url") {
      metrics = await processUrlSource(claimedJob, sourceRow, onProgress)
    } else {
      metrics = await processFileSource(claimedJob, sourceRow)
    }

    const { error: doneError } = await admin
      .from("indexing_jobs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        pages_discovered: metrics.pagesDiscovered,
        pages_indexed: metrics.pagesIndexed,
      })
      .eq("id", claimedJob.id)
    if (doneError) throw doneError

    return { skipped: false as const, ...metrics }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown indexing error"
    await admin
      .from("sources")
      .update({
        status: "failed",
        file_search_error: message,
      })
      .eq("id", claimed.source_id)
    await admin
      .from("indexing_jobs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", claimedJob.id)
    throw error
  }
}

export async function processQueuedIndexingJobs(limit = 2, tenantId?: string) {
  const admin = createAdminClient()
  let query = admin
    .from("indexing_jobs")
    .select("id")
    .eq("status", "queued")
    .order("requested_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 20)))
  if (tenantId) {
    query = query.eq("tenant_id", tenantId)
  }

  const { data: jobs, error } = await query

  if (error) throw error
  const results = []
  for (const job of jobs ?? []) {
    try {
      const result = await processIndexingJob(job.id as string)
      results.push({ jobId: job.id, ok: true, result })
    } catch (err) {
      results.push({
        jobId: job.id,
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      })
    }
  }
  return results
}
