import crypto from "node:crypto"

import { assertTenantCanIndexData } from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import { chunkPlainText } from "@/lib/indexing/chunking"
import { createEmbeddings } from "@/lib/indexing/embeddings"
import {
  getEmbeddingModel,
  MAX_CRAWL_PAGES_PER_JOB,
  STORAGE_BUCKET_ARTIFACTS,
} from "@/lib/indexing/config"
import { fetchPage, parseSitemapUrls } from "@/lib/indexing/html"

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

type DocumentInsert = {
  source_id: string
  version: number
  title: string | null
  raw_path: string | null
  text_path: string | null
}

function artifactPath(tenantId: string, sourceId: string, kind: "raw" | "text", suffix: string) {
  return `${tenantId}/${sourceId}/${Date.now()}-${kind}.${suffix}`
}

function maybeSitemap(url: string) {
  const lower = url.toLowerCase()
  return lower.endsWith(".xml") || lower.includes("sitemap")
}

async function getNextDocumentVersion(sourceId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("documents")
    .select("version")
    .eq("source_id", sourceId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data?.version ?? 0) + 1
}

async function createDocument(insert: DocumentInsert) {
  const admin = createAdminClient()
  const { data, error } = await admin.from("documents").insert(insert).select("id").single()
  if (error) throw error
  return data.id as string
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

async function uploadArtifactBytes(path: string, content: Buffer, contentType: string) {
  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(STORAGE_BUCKET_ARTIFACTS)
    .upload(path, content, { contentType, upsert: false })
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

async function insertChunksAndEmbeddings(params: {
  documentId: string
  sourceId: string
  botId: string
  tenantId: string
  chunks: ReturnType<typeof chunkPlainText>
  citationUrl: string
  citationTitle: string | null
}) {
  if (!params.chunks.length) {
    return { chunksCreated: 0, tokensEmbedded: 0 }
  }

  const admin = createAdminClient()
  const chunkRows = params.chunks.map((chunk) => ({
    document_id: params.documentId,
    chunk_index: chunk.index,
    text: chunk.text,
    token_count: chunk.estimatedTokens,
    meta: {
      tenant_id: params.tenantId,
      bot_id: params.botId,
      source_id: params.sourceId,
      source_url: params.citationUrl,
      source_title: params.citationTitle,
    },
  }))

  const { data: inserted, error: chunkError } = await admin
    .from("chunks")
    .insert(chunkRows)
    .select("id,text")

  if (chunkError) throw chunkError

  const insertedChunks = inserted ?? []
  const model = getEmbeddingModel()
  const BATCH_SIZE = 64
  let tokensEmbedded = 0

  for (let i = 0; i < insertedChunks.length; i += BATCH_SIZE) {
    const batch = insertedChunks.slice(i, i + BATCH_SIZE)
    const input = batch.map((item) => item.text as string)
    const vectors = await createEmbeddings(input)
    tokensEmbedded += input.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0)

    const rows = batch.map((item, idx) => ({
      chunk_id: item.id as string,
      model,
      embedding: vectors[idx],
    }))

    const { error: embError } = await admin.from("embeddings").upsert(rows, {
      onConflict: "chunk_id",
    })
    if (embError) throw embError
  }

  return { chunksCreated: insertedChunks.length, tokensEmbedded }
}

async function processUrlSource(job: IndexingJob, source: SourceRow) {
  if (!source.url) throw new Error("URL source has no URL.")
  const admin = createAdminClient()
  await assertTenantCanIndexData(job.tenant_id, 0)

  const discovered = maybeSitemap(source.url)
    ? parseSitemapUrls(await (await fetch(source.url)).text(), MAX_CRAWL_PAGES_PER_JOB)
    : [source.url]
  const pageUrls = discovered.length ? discovered : [source.url]

  let pagesIndexed = 0
  let chunksCreated = 0
  let tokensEmbedded = 0
  const pageHashes: string[] = []

  for (const pageUrl of pageUrls) {
    const page = await fetchPage(pageUrl)
    if (!page.text) continue

    const rawPath = artifactPath(job.tenant_id, source.id, "raw", "html")
    const textPath = artifactPath(job.tenant_id, source.id, "text", "txt")
    await uploadArtifact(rawPath, page.rawHtml, "text/html; charset=utf-8")
    await uploadArtifact(textPath, page.text, "text/plain; charset=utf-8")

    await upsertSourcePage({
      sourceId: source.id,
      tenantId: job.tenant_id,
      botId: source.bot_id,
      canonicalUrl: page.url,
      title: page.title,
      statusCode: page.statusCode,
      contentHash: page.contentHash,
      rawPath,
      textPath,
      rawBytes: Buffer.byteLength(page.rawHtml, "utf-8"),
      textBytes: Buffer.byteLength(page.text, "utf-8"),
    })
    pageHashes.push(page.contentHash)

    const version = await getNextDocumentVersion(source.id)
    const documentId = await createDocument({
      source_id: source.id,
      version,
      title: page.title,
      raw_path: rawPath,
      text_path: textPath,
    })

    const chunked = chunkPlainText(page.text)
    const chunkRes = await insertChunksAndEmbeddings({
      documentId,
      sourceId: source.id,
      botId: source.bot_id,
      tenantId: job.tenant_id,
      chunks: chunked,
      citationUrl: page.url,
      citationTitle: page.title,
    })

    pagesIndexed += 1
    chunksCreated += chunkRes.chunksCreated
    tokensEmbedded += chunkRes.tokensEmbedded
  }

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

  return {
    pagesDiscovered: pageUrls.length,
    pagesIndexed,
    chunksCreated,
    tokensEmbedded,
  }
}

async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: buffer })
  const info = await parser.getInfo().catch(() => null)
  const parsed = await parser.getText()
  await parser.destroy().catch(() => {})
  const text = parsed.text?.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim() ?? ""
  return {
    text,
    pages: parsed.total ?? 0,
    title: (info?.info?.title as string | undefined) ?? (info?.info?.Title as string | undefined) ?? null,
  }
}

async function processPdfSource(job: IndexingJob, source: SourceRow) {
  if (!source.file_path) throw new Error("PDF source has no file path.")
  const admin = createAdminClient()
  await assertTenantCanIndexData(job.tenant_id, 0)

  const { data: fileBlob, error: fileError } = await admin.storage
    .from("source-files")
    .download(source.file_path)
  if (fileError || !fileBlob) {
    throw new Error("PDFファイルの取得に失敗しました。source-files バケットを確認してください。")
  }

  const fileBuffer = Buffer.from(await fileBlob.arrayBuffer())
  await assertTenantCanIndexData(job.tenant_id, fileBuffer.length)

  const extracted = await extractPdfText(fileBuffer)
  if (!extracted.text) {
    throw new Error("PDFからテキストを抽出できませんでした。テキストPDFか確認してください。")
  }

  const rawPath = artifactPath(job.tenant_id, source.id, "raw", "pdf")
  const textPath = artifactPath(job.tenant_id, source.id, "text", "txt")
  await uploadArtifactBytes(rawPath, fileBuffer, "application/pdf")
  await uploadArtifact(textPath, extracted.text, "text/plain; charset=utf-8")

  const version = await getNextDocumentVersion(source.id)
  const documentId = await createDocument({
    source_id: source.id,
    version,
    title: source.file_name ?? extracted.title,
    raw_path: rawPath,
    text_path: textPath,
  })

  const chunked = chunkPlainText(extracted.text)
  const chunkRes = await insertChunksAndEmbeddings({
    documentId,
    sourceId: source.id,
    botId: source.bot_id,
    tenantId: job.tenant_id,
    chunks: chunked,
    citationUrl: `file://${source.file_name ?? "pdf"}`,
    citationTitle: source.file_name ?? extracted.title,
  })

  const { error: sourceUpdateError } = await admin
    .from("sources")
    .update({
      status: "ready",
      content_hash: crypto.createHash("sha256").update(extracted.text).digest("hex"),
    })
    .eq("id", source.id)
  if (sourceUpdateError) throw sourceUpdateError

  await admin.from("bots").update({ status: "ready" }).eq("id", source.bot_id)

  return {
    pagesDiscovered: extracted.pages,
    pagesIndexed: extracted.pages > 0 ? extracted.pages : 1,
    chunksCreated: chunkRes.chunksCreated,
    tokensEmbedded: chunkRes.tokensEmbedded,
  }
}

async function processFileLikeSource(source: SourceRow) {
  throw new Error(`Source type '${source.type}' is not supported for indexing.`)
}

export async function processIndexingJob(jobId: string) {
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
      metrics = await processUrlSource(claimedJob, sourceRow)
    } else if (sourceRow.type === "pdf") {
      metrics = await processPdfSource(claimedJob, sourceRow)
    } else {
      await processFileLikeSource(sourceRow)
      metrics = { pagesDiscovered: 0, pagesIndexed: 0, chunksCreated: 0, tokensEmbedded: 0 }
    }

    const { error: doneError } = await admin
      .from("indexing_jobs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        pages_discovered: metrics.pagesDiscovered,
        pages_indexed: metrics.pagesIndexed,
        chunks_created: metrics.chunksCreated,
        tokens_embedded: metrics.tokensEmbedded,
      })
      .eq("id", claimedJob.id)
    if (doneError) throw doneError

    return { skipped: false as const, ...metrics }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown indexing error"
    await admin
      .from("sources")
      .update({ status: "failed" })
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
