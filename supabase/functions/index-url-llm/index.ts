// Supabase Edge Function: index-url-llm
// Same pipeline as index-url, but adds an LLM structuring step (gpt-4o-mini)
// after raw text extraction. The structured content is stored in artifacts
// and synced to OpenAI File Search.
//
// System prompt forbids over-summarization; the LLM is instructed to faithfully
// extract ALL content from the page without hallucination.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2"
import crypto from "node:crypto"

// ─── Config ────────────────────────────────────────────────────────────────

const MAX_CRAWL_PAGES_PER_JOB = 50
const STORAGE_BUCKET_ARTIFACTS = "source-artifacts"
const FETCH_CONCURRENCY = 3
const USER_AGENT = "Mozilla/5.0 (compatible; knotic-indexer/1.0; +https://knotic.make-it-tech.com)"

const LLM_STRUCTURE_SYSTEM_PROMPT = `あなたはWebページ情報の構造化アシスタントです。提供されたWebページのテキストから、すべての情報を忠実に抽出・整理してください。

【必須ルール】
- 過度な要約・省略は絶対禁止。ページ内のすべての情報を網羅すること
- 本文に存在しない情報を追加・創作しないこと（ハルシネーション厳禁）
- このLLMはページの内容をAIが完全把握するための情報整理ツールとして動作しており、回答品質に直結する
- 構造化形式: 見出し（##/###）・箇条書き・番号付きリストを適切に使用
- 日本語・英語どちらのページでも、原文の言語を維持して整理すること
- 数値・固有名詞・URLなどの具体的情報は必ず保持すること`

// ─── Supabase ───────────────────────────────────────────────────────────────

function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// ─── OpenAI ─────────────────────────────────────────────────────────────────

function getOpenAiApiKey() {
  const key = Deno.env.get("OPENAI_API_KEY")?.trim()
  if (!key) throw new Error("Missing OPENAI_API_KEY in Edge Function environment.")
  return key
}

async function openAiFetch(path: string, init: RequestInit) {
  const res = await fetch(`https://api.openai.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI API failed (${res.status}) ${path}: ${body}`)
  }
  return res
}

// ─── LLM Structuring ─────────────────────────────────────────────────────────

async function structureWithLLM(pageUrl: string, rawText: string): Promise<string> {
  const truncatedText = rawText.slice(0, 28000)
  const res = await openAiFetch("/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: LLM_STRUCTURE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `以下のWebページテキストをすべての情報を保持しながら整理してください。\n\nページURL: ${pageUrl}\n\n---\n${truncatedText}`,
        },
      ],
      max_tokens: 4000,
      temperature: 0,
    }),
  })
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error("LLM structuring returned empty content.")
  return content
}

// ─── HTML Utilities (inlined from lib/indexing/html.ts) ─────────────────────

const TRACKING_QUERY_KEYS = new Set([
  "fbclid", "gclid", "dclid", "msclkid", "yclid", "mc_cid", "mc_eid",
])

const ROBOTS_CACHE = new Map<string, string | null>()

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
}

function stripHtmlToText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  const withBreaks = withoutScripts
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
  return decodeHtmlEntities(
    withBreaks
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match) return null
  return decodeHtmlEntities(match[1].replace(/\s+/g, " ").trim())
}

function stripTrackingParams(url: URL) {
  const deleteKeys: string[] = []
  for (const key of url.searchParams.keys()) {
    const lower = key.toLowerCase()
    if (lower.startsWith("utm_") || TRACKING_QUERY_KEYS.has(lower)) deleteKeys.push(key)
  }
  for (const key of deleteKeys) url.searchParams.delete(key)
}

function normalizeUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl)
    parsed.hash = ""
    stripTrackingParams(parsed)
    return parsed.toString()
  } catch {
    return rawUrl
  }
}

function extractCanonicalUrl(html: string, baseUrl: string) {
  const match = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i)
  if (!match) return null
  const hrefMatch = match[0].match(/href=["']([^"']+)["']/i)
  const href = hrefMatch?.[1]?.trim()
  if (!href) return null
  try {
    return normalizeUrl(new URL(href, baseUrl).toString())
  } catch {
    return null
  }
}

function wildcardToRegExp(pattern: string) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp("^" + escaped.replace(/\*/g, ".*") + "$")
}

function matchRobotsPath(rulePath: string, targetPath: string) {
  if (!rulePath) return false
  if (rulePath === "/") return true
  if (rulePath.includes("*")) return wildcardToRegExp(rulePath).test(targetPath)
  return targetPath.startsWith(rulePath)
}

function parseRobotsRules(robotsText: string) {
  const lines = robotsText
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)
  type RuleBlock = { agents: string[]; allow: string[]; disallow: string[] }
  const blocks: RuleBlock[] = []
  let current: RuleBlock | null = null
  for (const line of lines) {
    const idx = line.indexOf(":")
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()
    if (key === "user-agent") {
      if (!current || current.allow.length > 0 || current.disallow.length > 0) {
        current = { agents: [], allow: [], disallow: [] }
        blocks.push(current)
      }
      current.agents.push(value.toLowerCase())
      continue
    }
    if (!current) continue
    if (key === "allow") current.allow.push(value)
    if (key === "disallow") current.disallow.push(value)
  }
  return blocks
}

function selectRobotsBlock(robotsText: string) {
  const blocks = parseRobotsRules(robotsText)
  const targetAgent = USER_AGENT.toLowerCase()
  let best: ReturnType<typeof parseRobotsRules>[number] | null = null
  let bestScore = -1
  for (const block of blocks) {
    for (const agent of block.agents) {
      const normalized = agent.trim()
      let score = -1
      if (normalized === "*") score = 1
      else if (targetAgent.includes(normalized)) score = normalized.length + 1
      if (score > bestScore) { best = block; bestScore = score }
    }
  }
  return best
}

async function fetchWithRetry(url: string, init: RequestInit, maxAttempts = 3) {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 250 * attempt))
          continue
        }
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250 * attempt))
        continue
      }
      throw error
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed")
}

async function fetchRobotsTxt(origin: string) {
  if (ROBOTS_CACHE.has(origin)) return ROBOTS_CACHE.get(origin) ?? null
  try {
    const response = await fetchWithRetry(`${origin}/robots.txt`, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT, Accept: "text/plain,*/*;q=0.1" },
    })
    if (!response.ok) { ROBOTS_CACHE.set(origin, null); return null }
    const text = await response.text()
    ROBOTS_CACHE.set(origin, text)
    return text
  } catch {
    ROBOTS_CACHE.set(origin, null)
    return null
  }
}

async function assertCrawlAllowed(targetUrl: string) {
  const parsed = new URL(targetUrl)
  const robotsText = await fetchRobotsTxt(parsed.origin)
  if (!robotsText) return
  const block = selectRobotsBlock(robotsText)
  if (!block) return
  const path = `${parsed.pathname}${parsed.search}` || "/"
  let matchedAllowLen = -1
  let matchedDisallowLen = -1
  for (const rule of block.allow) {
    if (matchRobotsPath(rule, path)) matchedAllowLen = Math.max(matchedAllowLen, rule.length)
  }
  for (const rule of block.disallow) {
    if (!rule) continue
    if (matchRobotsPath(rule, path)) matchedDisallowLen = Math.max(matchedDisallowLen, rule.length)
  }
  if (matchedDisallowLen > matchedAllowLen) {
    throw new Error(`robots.txt disallow: ${normalizeUrl(targetUrl)}`)
  }
}

function parseSitemapUrls(xml: string, maxUrls: number): string[] {
  const urls = new Set<string>()
  const regex = /<loc>([\s\S]*?)<\/loc>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(xml)) !== null) {
    const value = match[1]?.trim()
    if (!value) continue
    urls.add(normalizeUrl(value))
    if (urls.size >= maxUrls) break
  }
  return [...urls]
}

function filterUrlsByHost(seedUrl: string, urls: string[]) {
  try {
    const seed = new URL(seedUrl)
    const host = seed.host.toLowerCase()
    return urls.filter((value) => {
      try { return new URL(value).host.toLowerCase() === host } catch { return false }
    })
  } catch {
    return urls
  }
}

type CrawlPage = {
  url: string
  title: string | null
  statusCode: number
  rawHtml: string
  text: string
  contentHash: string
}

async function fetchPage(url: string): Promise<CrawlPage> {
  const normalized = normalizeUrl(url)
  await assertCrawlAllowed(normalized)
  const response = await fetchWithRetry(normalized, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  })
  const statusCode = response.status
  if (statusCode === 403) throw new Error(`アクセスが拒否されました (403): ${normalized}`)
  if (statusCode === 404) throw new Error(`ページが見つかりません (404): ${normalized}`)
  if (statusCode >= 400) throw new Error(`HTTPエラー (${statusCode}): ${normalized}`)
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase()
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`サポートされていないコンテンツタイプ: ${contentType || "不明"} (${normalized})`)
  }
  const rawHtml = await response.text()
  const title = extractTitle(rawHtml)
  const fallbackUrl = normalizeUrl(response.url || normalized)
  const canonicalUrl = extractCanonicalUrl(rawHtml, fallbackUrl)
  const finalUrl = canonicalUrl ?? fallbackUrl
  const text = stripHtmlToText(rawHtml)
  const contentHash = crypto.createHash("sha256").update(text).digest("hex")
  return { url: finalUrl, title, statusCode, rawHtml, text, contentHash }
}

// ─── SSE Event Types ──────────────────────────────────────────────────────────

type SseEvent =
  | { type: "fetching_sitemap" }
  | { type: "sitemap_ready"; total: number }
  | { type: "single_page" }
  | { type: "page_progress"; done: number; total: number }
  | { type: "structuring_llm"; done: number; total: number }
  | { type: "syncing_openai" }
  | { type: "source_ready" }
  | { type: "error"; message: string }

// ─── Pipeline Helpers ─────────────────────────────────────────────────────────

function maybeSitemap(url: string) {
  try {
    const path = new URL(url).pathname.toLowerCase()
    return path.endsWith(".xml") || /(?:^|\/)sitemap(?:[-_]index)?$/.test(path)
  } catch {
    return url.toLowerCase().endsWith(".xml")
  }
}

function artifactPath(tenantId: string, sourceId: string, kind: "raw" | "text" | "llm", suffix: string) {
  return `${tenantId}/${sourceId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${kind}.${suffix}`
}

type AdminClient = ReturnType<typeof createAdminClient>

async function uploadArtifact(admin: AdminClient, path: string, content: string, contentType: string) {
  const { error } = await admin.storage
    .from(STORAGE_BUCKET_ARTIFACTS)
    .upload(path, new TextEncoder().encode(content), { contentType, upsert: false })
  if (error) {
    // Non-fatal: storage artifacts are for debugging only; OpenAI sync is the critical path.
    console.warn(`Storage upload skipped for ${path}: ${error.message}`)
  }
}

async function upsertSourcePage(admin: AdminClient, params: {
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

// Fetches a page, structures it with LLM, and stores artifacts + source_page row.
async function fetchStructureAndStorePage(
  admin: AdminClient,
  params: { pageUrl: string; tenantId: string; sourceId: string; botId: string }
): Promise<{ contentHash: string; section: string } | null> {
  const page = await fetchPage(params.pageUrl)
  if (!page.text) return null

  // LLM structuring step
  const structuredText = await structureWithLLM(page.url, page.text)

  const rawPath = artifactPath(params.tenantId, params.sourceId, "raw", "html")
  const textPath = artifactPath(params.tenantId, params.sourceId, "llm", "md")
  await uploadArtifact(admin, rawPath, page.rawHtml, "text/html; charset=utf-8")
  await uploadArtifact(admin, textPath, structuredText, "text/plain; charset=utf-8")

  const textBytes = new TextEncoder().encode(structuredText).byteLength
  await upsertSourcePage(admin, {
    sourceId: params.sourceId,
    tenantId: params.tenantId,
    botId: params.botId,
    canonicalUrl: page.url,
    title: page.title,
    statusCode: page.statusCode,
    contentHash: page.contentHash,
    rawPath,
    textPath,
    rawBytes: new TextEncoder().encode(page.rawHtml).byteLength,
    textBytes,
  })
  return {
    contentHash: page.contentHash,
    section: [`## ${page.title ?? page.url}`, `URL: ${page.url}`, "", structuredText].join("\n"),
  }
}

// ─── OpenAI File Search Sync ──────────────────────────────────────────────────

function toSafeFileName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]/g, "_")
}

async function ensureVectorStore(admin: AdminClient, botId: string, botPublicId: string) {
  const { data: row } = await admin
    .from("bots")
    .select("id, file_search_provider, file_search_vector_store_id")
    .eq("id", botId)
    .maybeSingle()

  if (!row) throw new Error("Bot not found while ensuring vector store.")

  const existingId = (row as any).file_search_vector_store_id as string | null
  if (existingId) return { vectorStoreId: existingId }

  const createdRes = await openAiFetch("/vector_stores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `knotic-bot-${botPublicId}`,
      metadata: { bot_id: botId, bot_public_id: botPublicId },
    }),
  })
  const created = (await createdRes.json()) as { id?: string }
  const vectorStoreId = String(created.id ?? "")
  if (!vectorStoreId) throw new Error("OpenAI vector store creation returned empty id.")

  await admin.from("bots").update({
    file_search_provider: "openai",
    file_search_vector_store_id: vectorStoreId,
  }).eq("id", botId)

  return { vectorStoreId }
}

async function syncSourceText(admin: AdminClient, params: {
  botId: string
  botPublicId: string
  sourceId: string
  sourceLabel: string
  text: string
}) {
  const { vectorStoreId } = await ensureVectorStore(admin, params.botId, params.botPublicId)

  const { data: sourceRow } = await admin
    .from("sources")
    .select("id, file_search_file_id")
    .eq("id", params.sourceId)
    .maybeSingle()

  const previousFileId = String(
    ((sourceRow as any)?.file_search_file_id) ?? ""
  ) || null

  const form = new FormData()
  form.set("purpose", "assistants")
  const blob = new Blob(
    [[`# ${params.sourceLabel}`, "", params.text].join("\n")],
    { type: "text/plain;charset=utf-8" }
  )
  form.set("file", blob, toSafeFileName(`url-${params.sourceId}.md`))

  const uploadedRes = await openAiFetch("/files", { method: "POST", body: form })
  const uploaded = (await uploadedRes.json()) as { id?: string }
  const fileId = String(uploaded.id ?? "")
  if (!fileId) throw new Error("OpenAI file upload returned empty id.")

  await openAiFetch(`/vector_stores/${encodeURIComponent(vectorStoreId)}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  })

  if (previousFileId) {
    try {
      await openAiFetch(
        `/vector_stores/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(previousFileId)}`,
        { method: "DELETE" }
      )
    } catch { /* best effort */ }
  }

  await admin.from("sources").update({
    file_search_provider: "openai",
    file_search_file_id: fileId,
    file_search_last_synced_at: new Date().toISOString(),
    file_search_error: null,
  }).eq("id", params.sourceId)
}

// ─── Main Job Processor ───────────────────────────────────────────────────────

async function processJob(admin: AdminClient, jobId: string, send: (event: SseEvent) => void) {
  const workerId = `edge-llm-${crypto.randomUUID().slice(0, 8)}`

  const { data: job } = await admin
    .from("indexing_jobs")
    .select("id, tenant_id, bot_id, source_id, status")
    .eq("id", jobId)
    .maybeSingle()

  if (!job || !job.source_id) throw new Error("Indexing job not found or source is empty.")
  if ((job as any).status !== "queued") return

  const { data: claimed } = await admin
    .from("indexing_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      worker_id: workerId,
      lock_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 min for LLM calls
      error_message: null,
    })
    .eq("id", (job as any).id)
    .eq("status", "queued")
    .select("id, tenant_id, bot_id, source_id")
    .maybeSingle()

  if (!claimed) return // Already claimed by another worker

  const claimedAny = claimed as any

  const { data: source } = await admin
    .from("sources")
    .select("id, bot_id, type, url, file_path, file_name")
    .eq("id", claimedAny.source_id)
    .single()

  if (!source || (source as any).type !== "url" || !(source as any).url) {
    throw new Error("Source not found or not a URL source.")
  }

  const sourceAny = source as any

  try {
    let pageUrls: string[]

    if (maybeSitemap(sourceAny.url)) {
      send({ type: "fetching_sitemap" })
      const sitemapRes = await fetchWithRetry(sourceAny.url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml,*/*;q=0.8" },
      })
      const discovered = filterUrlsByHost(
        sourceAny.url,
        parseSitemapUrls(await sitemapRes.text(), MAX_CRAWL_PAGES_PER_JOB)
      )
      pageUrls = discovered.length ? discovered : [sourceAny.url]
      send({ type: "sitemap_ready", total: pageUrls.length })
    } else {
      send({ type: "single_page" })
      pageUrls = [sourceAny.url]
    }

    const pageHashes: string[] = []
    const aggregatedSections: string[] = []
    let pagesIndexed = 0
    // Keep reference for error surfacing below
    let lastResults: PromiseSettledResult<{ contentHash: string; section: string } | null>[] = []

    for (let i = 0; i < pageUrls.length; i += FETCH_CONCURRENCY) {
      const chunk = pageUrls.slice(i, i + FETCH_CONCURRENCY)
      const results = await Promise.allSettled(
        chunk.map((pageUrl) =>
          fetchStructureAndStorePage(admin, {
            pageUrl,
            tenantId: String(claimedAny.tenant_id),
            sourceId: String(sourceAny.id),
            botId: String(sourceAny.bot_id),
          })
        )
      )
      lastResults = results as typeof lastResults
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          pageHashes.push(result.value.contentHash)
          aggregatedSections.push(result.value.section)
          pagesIndexed++
        }
      }
      send({ type: "structuring_llm", done: pagesIndexed, total: pageUrls.length })
    }

    if (aggregatedSections.length === 0) {
      const firstRejected = lastResults.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined
      const detail = firstRejected
        ? ` (${firstRejected.reason instanceof Error ? firstRejected.reason.message : String(firstRejected.reason)})`
        : ""
      throw new Error(`URLからテキストを取得できませんでした。ページにテキストが含まれているか確認してください。${detail}`)
    }

    send({ type: "syncing_openai" })

    const { data: bot } = await admin
      .from("bots")
      .select("id, public_id, name")
      .eq("id", sourceAny.bot_id)
      .maybeSingle()
    if (!(bot as any)?.public_id) throw new Error("Bot public_id is missing while syncing file search.")

    const botAny = bot as any

    await syncSourceText(admin, {
      botId: String(sourceAny.bot_id),
      botPublicId: String(botAny.public_id),
      sourceId: String(sourceAny.id),
      sourceLabel: String(sourceAny.url ?? botAny.name ?? "URL source"),
      text: aggregatedSections.join("\n\n---\n\n"),
    })

    await admin.from("sources").update({
      status: "ready",
      index_mode: "llm",
      content_hash: crypto.createHash("sha256").update(pageHashes.join("|")).digest("hex"),
    }).eq("id", sourceAny.id)

    await admin.from("bots").update({ status: "ready" }).eq("id", sourceAny.bot_id)

    await admin.from("indexing_jobs").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      pages_discovered: pageUrls.length,
      pages_indexed: pagesIndexed,
    }).eq("id", claimedAny.id)

    send({ type: "source_ready" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown indexing error"
    await admin.from("sources").update({ status: "failed", file_search_error: message })
      .eq("id", claimedAny.source_id)
    await admin.from("indexing_jobs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: message,
    }).eq("id", claimedAny.id)
    throw error
  }
}

// ─── Edge Function Handler ────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS })
  }

  let body: { jobId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400, headers: CORS_HEADERS })
  }

  const { jobId } = body
  if (!jobId) {
    return Response.json({ error: "jobId は必須です。" }, { status: 400, headers: CORS_HEADERS })
  }

  const admin = createAdminClient()

  // Auth: jobId (UUID) acts as an unguessable one-time token.
  // Jobs are created only by authenticated editors via /api/v1/index-url-init.
  const { data: job } = await admin
    .from("indexing_jobs")
    .select("id, tenant_id, status")
    .eq("id", jobId)
    .maybeSingle()

  if (!job) {
    return Response.json({ error: "ジョブが見つかりません。" }, { status: 404, headers: CORS_HEADERS })
  }

  // Stream SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SseEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch { /* controller closed */ }
      }

      try {
        await processJob(admin, jobId, send)
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "エラーが発生しました。" })
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
})
