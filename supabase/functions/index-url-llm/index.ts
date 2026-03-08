// Supabase Edge Function: index-url-llm
// Same pipeline as index-url, but adds an LLM structuring step (5-mini)
// after raw text extraction. The structured content is stored in artifacts
// and synced to OpenAI File Search.
//
// System prompt forbids over-summarization; the LLM is instructed to faithfully
// extract ALL content from the page without hallucination.

import {
  type AdminClient,
  type PageResult,
  type SendFn,
  artifactPath,
  createEdgeFunctionHandler,
  fetchPage,
  openAiFetch,
  runIndexingPipeline,
  uploadArtifact,
  upsertSourcePage,
} from "../_shared/indexing.ts"

// ── LLM Config ────────────────────────────────────────────────────────────────

const LLM_STRUCTURE_MODEL = "5-mini"
// 5-mini supports 128k+ token context (~500k chars). 100k chars keeps costs
// predictable while covering virtually all real-world pages.
const LLM_INPUT_CHAR_LIMIT = 100_000
// Raised from 4,000 to handle dense pages without output being cut mid-sentence.
const LLM_MAX_OUTPUT_TOKENS = 16_000

const LLM_STRUCTURE_SYSTEM_PROMPT = `あなたはWebページ情報の構造化アシスタントです。提供されたWebページのテキストから、すべての情報を忠実に抽出・整理してください。

【必須ルール】
- 過度な要約・省略は絶対禁止。ページ内のすべての情報を網羅すること
- 本文に存在しない情報を追加・創作しないこと（ハルシネーション厳禁）
- このLLMはページの内容をAIが完全把握するための情報整理ツールとして動作しており、回答品質に直結する
- 構造化形式: 見出し（##/###）・箇条書き・番号付きリストを適切に使用
- 日本語・英語どちらのページでも、原文の言語を維持して整理すること
- 数値・固有名詞・URLなどの具体的情報は必ず保持すること`

// ── SSE Event Types ───────────────────────────────────────────────────────────

type SseEvent =
  | { type: "fetching_sitemap" }
  | { type: "sitemap_ready"; total: number }
  | { type: "single_page" }
  | { type: "llm_structuring_page"; pageUrl: string }
  | { type: "structuring_llm"; done: number; total: number }
  | { type: "syncing_openai" }
  | { type: "source_ready" }
  | { type: "llm_input_truncated"; pageUrl: string; charCount: number; limit: number }
  | { type: "llm_output_truncated"; pageUrl: string }
  | { type: "error"; message: string }

// ── LLM Structuring ───────────────────────────────────────────────────────────

type LLMResult = {
  content: string
  inputTruncated: boolean
  outputTruncated: boolean
}

async function structureWithLLM(pageUrl: string, rawText: string): Promise<LLMResult> {
  const inputTruncated = rawText.length > LLM_INPUT_CHAR_LIMIT
  const inputText = inputTruncated ? rawText.slice(0, LLM_INPUT_CHAR_LIMIT) : rawText

  const res = await openAiFetch("/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_STRUCTURE_MODEL,
      messages: [
        { role: "system", content: LLM_STRUCTURE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `以下のWebページテキストをすべての情報を保持しながら整理してください。\n\nページURL: ${pageUrl}\n\n---\n${inputText}`,
        },
      ],
      max_tokens: LLM_MAX_OUTPUT_TOKENS,
      temperature: 0,
    }),
  })

  const data = (await res.json()) as {
    choices?: Array<{
      message?: { content?: string }
      finish_reason?: string
    }>
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error("LLM structuring returned empty content.")

  const outputTruncated = data.choices?.[0]?.finish_reason === "length"

  return { content, inputTruncated, outputTruncated }
}

// ── Page Processor ────────────────────────────────────────────────────────────

async function fetchStructureAndStorePage(
  admin: AdminClient,
  params: { pageUrl: string; tenantId: string; sourceId: string; botId: string },
  send: SendFn
): Promise<PageResult | null> {
  const typedSend = send as (event: SseEvent) => void
  const page = await fetchPage(params.pageUrl)
  if (!page.text) return null

  typedSend({ type: "llm_structuring_page", pageUrl: page.url })
  const llm = await structureWithLLM(page.url, page.text)

  if (llm.inputTruncated) {
    typedSend({
      type: "llm_input_truncated",
      pageUrl: page.url,
      charCount: page.text.length,
      limit: LLM_INPUT_CHAR_LIMIT,
    })
  }
  if (llm.outputTruncated) {
    typedSend({ type: "llm_output_truncated", pageUrl: page.url })
  }

  const rawPath = artifactPath(params.tenantId, params.sourceId, "raw", "html")
  const textPath = artifactPath(params.tenantId, params.sourceId, "llm", "md")
  await uploadArtifact(admin, rawPath, page.rawHtml, "text/html; charset=utf-8")
  await uploadArtifact(admin, textPath, llm.content, "text/plain; charset=utf-8")

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
    textBytes: new TextEncoder().encode(llm.content).byteLength,
  })

  return {
    contentHash: page.contentHash,
    section: [`## ${page.title ?? page.url}`, `URL: ${page.url}`, "", llm.content].join("\n"),
  }
}

// ── Job Entry Point ───────────────────────────────────────────────────────────

async function processJob(admin: AdminClient, jobId: string, send: SendFn) {
  const typedSend = send as (event: SseEvent) => void
  await runIndexingPipeline({
    admin,
    jobId,
    send,
    lockDurationMs: 20 * 60 * 1000,
    indexMode: "llm",
    fileExtension: "md",
    fetchAndProcessPage: fetchStructureAndStorePage,
    onChunkDone: (done, total) => typedSend({ type: "structuring_llm", done, total }),
  })
}

Deno.serve(createEdgeFunctionHandler(processJob))
