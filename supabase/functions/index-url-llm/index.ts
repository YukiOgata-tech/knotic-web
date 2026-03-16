// Supabase Edge Function: index-url-llm
// LLM indexing mode: Readability extraction for all pages → combine → 1 LLM call.
//
// Pipeline:
//   1. Discover pages via sitemap (no page limit)
//   2. Fetch all pages in parallel batches, apply Readability extraction per page
//   3. Combine all extracted Markdown into one document
//   4. Pass combined content to LLM (5-mini) in a single call for structuring
//   5. Upload LLM-structured result to OpenAI File Search

import {
  type AdminClient,
  type SendFn,
  createEdgeFunctionHandler,
  deduplicateSections,
  fetchExtractAndStorePage,
  openAiFetch,
  runIndexingPipeline,
} from "../_shared/indexing.ts"

// ── LLM Config ────────────────────────────────────────────────────────────────

const LLM_STRUCTURE_MODEL = "gpt-4o-mini"

// gpt-4o-mini supports 128k token context. Readability-extracted text is
// already clean Markdown, so 400k chars — well within limits for typical sites.
// Truncate only if the site is unusually large.
const LLM_INPUT_CHAR_LIMIT = 400_000

const LLM_MAX_OUTPUT_TOKENS = 16_000

const LLM_STRUCTURE_SYSTEM_PROMPT = `あなたはWebサイトの情報を整理するアシスタントです。
複数ページのReadability抽出済みMarkdownが入力されます。これをサイト全体のナレッジベースとして再構成してください。

【必須ルール】
- 過度な要約・省略は絶対禁止。すべての情報を網羅すること
- 本文に存在しない情報を追加・創作しないこと（ハルシネーション厳禁）
- 重複している内容（複数ページに同じ文章）は1回だけ残すこと
- 構造化形式: 見出し（##/###）・箇条書き・番号付きリストを適切に使用
- 日本語・英語どちらのページでも、原文の言語を維持して整理すること
- 数値・固有名詞・URLなどの具体的情報は必ず保持すること`

// ── SSE Event Types ───────────────────────────────────────────────────────────

type SseEvent =
  | { type: "fetching_sitemap" }
  | { type: "sitemap_ready"; total: number }
  | { type: "single_page" }
  | { type: "page_progress"; done: number; total: number }
  | { type: "structuring_llm" }
  | { type: "llm_input_truncated"; charCount: number; limit: number }
  | { type: "llm_output_truncated" }
  | { type: "syncing_openai" }
  | { type: "source_ready" }
  | { type: "error"; message: string }

// ── Single LLM Pass on Combined Content ──────────────────────────────────────

async function restructureWithLLM(combined: string, send: SendFn): Promise<string> {
  const typedSend = send as (event: SseEvent) => void

  const inputTruncated = combined.length > LLM_INPUT_CHAR_LIMIT
  const inputText = inputTruncated ? combined.slice(0, LLM_INPUT_CHAR_LIMIT) : combined

  if (inputTruncated) {
    typedSend({ type: "llm_input_truncated", charCount: combined.length, limit: LLM_INPUT_CHAR_LIMIT })
  }

  typedSend({ type: "structuring_llm" })

  const res = await openAiFetch("/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_STRUCTURE_MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text: LLM_STRUCTURE_SYSTEM_PROMPT }] },
        { role: "user", content: [{ type: "input_text", text: `以下はサイト全ページのReadability抽出済みコンテンツです。ナレッジベースとして再構成してください。\n\n---\n\n${inputText}` }] },
      ],
      max_output_tokens: LLM_MAX_OUTPUT_TOKENS,
    }),
  })

  const data = (await res.json()) as {
    output_text?: string
    status?: string
  }

  const content = data.output_text?.trim()
  if (!content) throw new Error("LLM structuring returned empty content.")

  if (data.status === "incomplete") {
    typedSend({ type: "llm_output_truncated" })
  }

  return content
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
    fetchAndProcessPage: fetchExtractAndStorePage,
    onChunkDone: (done, total) => typedSend({ type: "page_progress", done, total }),
    postProcessSections: deduplicateSections,
    transformContent: restructureWithLLM,
  })
}

Deno.serve(createEdgeFunctionHandler(processJob))
