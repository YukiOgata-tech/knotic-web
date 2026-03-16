// Supabase Edge Function: index-url
// Standard indexing mode: Readability-style extraction + cross-page deduplication.
// No LLM calls — fast enough for full-site crawls without timeout risk.
//
// Pipeline:
//   1. Discover pages via sitemap (max 100 pages)
//   2. Fetch each page, remove noise, extract <main>/<article>, convert to Markdown
//   3. Deduplicate identical paragraphs across pages (removes site-wide boilerplate)
//   4. Upload combined Markdown to OpenAI File Search

import {
  type AdminClient,
  type SendFn,
  createEdgeFunctionHandler,
  deduplicateSections,
  fetchExtractAndStorePage,
  runIndexingPipeline,
} from "../_shared/indexing.ts"

type SseEvent =
  | { type: "fetching_sitemap" }
  | { type: "sitemap_ready"; total: number }
  | { type: "single_page" }
  | { type: "page_progress"; done: number; total: number }
  | { type: "syncing_openai" }
  | { type: "source_ready" }
  | { type: "error"; message: string }

async function processJob(admin: AdminClient, jobId: string, send: SendFn) {
  const typedSend = send as (event: SseEvent) => void
  await runIndexingPipeline({
    admin,
    jobId,
    send,
    lockDurationMs: 10 * 60 * 1000,
    indexMode: "raw",
    fileExtension: "md",
    fetchAndProcessPage: fetchExtractAndStorePage,
    onChunkDone: (done, total) => typedSend({ type: "page_progress", done, total }),
    postProcessSections: deduplicateSections,
    maxPages: 100,
  })
}

Deno.serve(createEdgeFunctionHandler(processJob))
