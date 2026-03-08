// Supabase Edge Function: index-url
// Handles URL indexing (raw text extraction) with SSE progress streaming.
// Invoked from the browser after /api/v1/index-url-init creates the source + job.
//
// To switch to Vercel Pro (inline SSE route), update handleUrlSubmit in
// hosted-config-editor.tsx to call /api/v1/index-url directly instead of this function.

import {
  type AdminClient,
  type PageResult,
  type SendFn,
  artifactPath,
  createAdminClient,
  createEdgeFunctionHandler,
  fetchPage,
  runIndexingPipeline,
  uploadArtifact,
  upsertSourcePage,
} from "../_shared/indexing.ts"

type SseEvent =
  | { type: "fetching_sitemap" }
  | { type: "sitemap_ready"; total: number }
  | { type: "single_page" }
  | { type: "page_progress"; done: number; total: number }
  | { type: "syncing_openai" }
  | { type: "source_ready" }
  | { type: "error"; message: string }

async function fetchAndStorePage(
  admin: AdminClient,
  params: { pageUrl: string; tenantId: string; sourceId: string; botId: string },
  _send: SendFn
): Promise<PageResult | null> {
  const page = await fetchPage(params.pageUrl)
  if (!page.text) return null

  const rawPath = artifactPath(params.tenantId, params.sourceId, "raw", "html")
  const textPath = artifactPath(params.tenantId, params.sourceId, "text", "txt")
  await uploadArtifact(admin, rawPath, page.rawHtml, "text/html; charset=utf-8")
  await uploadArtifact(admin, textPath, page.text, "text/plain; charset=utf-8")

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
    textBytes: new TextEncoder().encode(page.text).byteLength,
  })

  return {
    contentHash: page.contentHash,
    section: [`## ${page.title ?? page.url}`, `URL: ${page.url}`, "", page.text].join("\n"),
  }
}

async function processJob(admin: AdminClient, jobId: string, send: SendFn) {
  const typedSend = send as (event: SseEvent) => void
  await runIndexingPipeline({
    admin,
    jobId,
    send,
    lockDurationMs: 10 * 60 * 1000,
    indexMode: "raw",
    fileExtension: "txt",
    fetchAndProcessPage: fetchAndStorePage,
    onChunkDone: (done, total) => typedSend({ type: "page_progress", done, total }),
  })
}

Deno.serve(createEdgeFunctionHandler(processJob))
