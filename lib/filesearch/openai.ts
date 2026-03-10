import { createAdminClient } from "@/lib/supabase/admin"
import { toApiModelName } from "@/lib/llm/responses"

export const ALLOWED_FILE_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "pptx", "tex",
  "txt", "md", "html", "css", "json",
  "c", "cpp", "cs", "go", "java", "js", "ts", "py", "rb", "rs", "sh", "php",
  "csv", "xlsx", "xls",
])

export const SPREADSHEET_EXTENSIONS = new Set(["csv", "xlsx", "xls"])

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  tex: "text/x-tex",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  css: "text/css",
  json: "application/json",
  c: "text/x-c",
  cpp: "text/x-c++",
  cs: "text/x-csharp",
  go: "text/x-go",
  java: "text/x-java",
  js: "text/javascript",
  ts: "text/typescript",
  py: "text/x-python",
  rb: "text/x-ruby",
  rs: "text/x-rust",
  sh: "text/x-sh",
  php: "text/x-php",
}

function getOpenAiApiKey() {
  const value = process.env.OPENAI_API_KEY?.trim()
  if (!value) {
    throw new Error("Missing environment variable: OPENAI_API_KEY")
  }
  return value
}

async function openAiFetch(path: string, init: RequestInit) {
  const response = await fetch(`https://api.openai.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI API failed (${response.status}) ${path}: ${body}`)
  }

  return response
}

type EnsureStoreResult = {
  vectorStoreId: string
}

async function trySelectBotStore(botId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("bots")
    .select("id, file_search_provider, file_search_vector_store_id")
    .eq("id", botId)
    .maybeSingle()

  if (error) {
    if ((error as { code?: string }).code === "42703") {
      throw new Error(
        "bots.file_search_vector_store_id が未作成です。最新 schema.sql の ALTER TABLE を適用してください。"
      )
    }
    throw error
  }

  return (data ?? null) as {
    id: string
    file_search_provider: string | null
    file_search_vector_store_id: string | null
  } | null
}

export async function getBotOpenAiVectorStoreId(botId: string): Promise<string | null> {
  try {
    const row = await trySelectBotStore(botId)
    if (!row) return null
    if (row.file_search_provider && row.file_search_provider !== "openai") return null
    return row.file_search_vector_store_id ?? null
  } catch {
    return null
  }
}

export async function ensureOpenAiVectorStoreForBot(botId: string, botPublicId: string): Promise<EnsureStoreResult> {
  const admin = createAdminClient()
  const row = await trySelectBotStore(botId)
  if (!row) {
    throw new Error("Bot not found while ensuring vector store.")
  }

  if (row.file_search_vector_store_id) {
    return { vectorStoreId: row.file_search_vector_store_id }
  }

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
  if (!vectorStoreId) {
    throw new Error("OpenAI vector store creation returned empty id.")
  }

  const { error: updateError } = await admin
    .from("bots")
    .update({
      file_search_provider: "openai",
      file_search_vector_store_id: vectorStoreId,
    })
    .eq("id", botId)

  if (updateError) {
    if ((updateError as { code?: string }).code === "42703") {
      throw new Error(
        "bots.file_search_provider / file_search_vector_store_id が未作成です。最新 schema.sql を適用してください。"
      )
    }
    throw updateError
  }

  return { vectorStoreId }
}

function toSafeFileName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]/g, "_")
}

async function uploadTextAsFile(params: {
  filename: string
  text: string
}) {
  const form = new FormData()
  form.set("purpose", "assistants")
  const blob = new Blob([params.text], { type: "text/plain;charset=utf-8" })
  form.set("file", blob, toSafeFileName(params.filename))

  const uploadedRes = await openAiFetch("/files", {
    method: "POST",
    body: form,
  })
  const uploaded = (await uploadedRes.json()) as { id?: string }
  const fileId = String(uploaded.id ?? "")
  if (!fileId) {
    throw new Error("OpenAI file upload returned empty id.")
  }
  return fileId
}

async function attachFileToVectorStore(vectorStoreId: string, fileId: string) {
  await openAiFetch(`/vector_stores/${encodeURIComponent(vectorStoreId)}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  })
}

async function detachFileFromVectorStore(vectorStoreId: string, fileId: string) {
  try {
    await openAiFetch(`/vector_stores/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    })
  } catch {
    // Best effort only.
  }
}

export async function syncSourceTextToOpenAiFileSearch(params: {
  botId: string
  botPublicId: string
  sourceId: string
  sourceType: "url" | "pdf" | "file"
  sourceLabel: string
  text: string
}) {
  const admin = createAdminClient()
  const { vectorStoreId } = await ensureOpenAiVectorStoreForBot(params.botId, params.botPublicId)

  const { data: sourceRow, error: sourceSelectError } = await admin
    .from("sources")
    .select("id, file_search_file_id")
    .eq("id", params.sourceId)
    .maybeSingle()

  if (sourceSelectError) {
    if ((sourceSelectError as { code?: string }).code === "42703") {
      throw new Error("sources.file_search_file_id が未作成です。最新 schema.sql を適用してください。")
    }
    throw sourceSelectError
  }

  const previousFileId = String((sourceRow as { file_search_file_id?: string | null } | null)?.file_search_file_id ?? "") || null

  const fileId = await uploadTextAsFile({
    filename: `${params.sourceType}-${params.sourceId}.txt`,
    text: [`# ${params.sourceLabel}`, "", params.text].join("\n"),
  })
  await attachFileToVectorStore(vectorStoreId, fileId)

  if (previousFileId) {
    await detachFileFromVectorStore(vectorStoreId, previousFileId)
  }

  const { error: sourceUpdateError } = await admin
    .from("sources")
    .update({
      file_search_provider: "openai",
      file_search_file_id: fileId,
      file_search_last_synced_at: new Date().toISOString(),
      file_search_error: null,
    })
    .eq("id", params.sourceId)

  if (sourceUpdateError) {
    if ((sourceUpdateError as { code?: string }).code === "42703") {
      throw new Error(
        "sources.file_search_* カラムが未作成です。最新 schema.sql の ALTER TABLE を適用してください。"
      )
    }
    throw sourceUpdateError
  }

  return { vectorStoreId, fileId }
}

export async function cleanupSourceFromOpenAiFileSearch(params: {
  vectorStoreId: string | null
  fileId: string | null
}) {
  const { vectorStoreId, fileId } = params
  if (!fileId) return

  if (vectorStoreId) {
    try {
      await openAiFetch(
        `/vector_stores/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(fileId)}`,
        { method: "DELETE" }
      )
    } catch { /* best effort */ }
  }

  try {
    await openAiFetch(`/files/${encodeURIComponent(fileId)}`, { method: "DELETE" })
  } catch { /* best effort */ }
}

export async function syncBinaryFileToOpenAiFileSearch(params: {
  botId: string
  botPublicId: string
  sourceId: string
  filename: string
  buffer: Buffer
}) {
  const admin = createAdminClient()
  const { vectorStoreId } = await ensureOpenAiVectorStoreForBot(params.botId, params.botPublicId)

  const { data: sourceRow, error: sourceSelectError } = await admin
    .from("sources")
    .select("id, file_search_file_id")
    .eq("id", params.sourceId)
    .maybeSingle()

  if (sourceSelectError) throw sourceSelectError

  const previousFileId = String((sourceRow as { file_search_file_id?: string | null } | null)?.file_search_file_id ?? "") || null

  const ext = params.filename.split(".").pop()?.toLowerCase() ?? "bin"
  const mimeType = MIME_BY_EXT[ext] ?? "application/octet-stream"

  const form = new FormData()
  form.set("purpose", "assistants")
  const blob = new Blob([new Uint8Array(params.buffer)], { type: mimeType })
  form.set("file", blob, toSafeFileName(params.filename))

  const uploadedRes = await openAiFetch("/files", {
    method: "POST",
    body: form,
  })
  const uploaded = (await uploadedRes.json()) as { id?: string }
  const fileId = String(uploaded.id ?? "")
  if (!fileId) throw new Error("OpenAI file upload returned empty id.")

  await attachFileToVectorStore(vectorStoreId, fileId)

  if (previousFileId) {
    await detachFileFromVectorStore(vectorStoreId, previousFileId)
  }

  const { error: sourceUpdateError } = await admin
    .from("sources")
    .update({
      file_search_provider: "openai",
      file_search_file_id: fileId,
      file_search_last_synced_at: new Date().toISOString(),
      file_search_error: null,
    })
    .eq("id", params.sourceId)

  if (sourceUpdateError) throw sourceUpdateError

  return { vectorStoreId, fileId }
}

function extractTextFromOutput(output: unknown): string {
  if (!Array.isArray(output)) return ""
  const parts: string[] = []
  for (const item of output) {
    if (!item || typeof item !== "object") continue
    const obj = item as Record<string, unknown>
    if (obj.type !== "message") continue
    const content = obj.content
    if (!Array.isArray(content)) continue
    for (const block of content) {
      if (!block || typeof block !== "object") continue
      const b = block as Record<string, unknown>
      if (b.type === "output_text" && typeof b.text === "string") {
        parts.push(b.text)
      }
    }
  }
  return parts.join("\n").trim()
}

function collectFileCitationIds(value: unknown, out: string[]) {
  if (!value || typeof value !== "object") return
  if (Array.isArray(value)) {
    for (const item of value) collectFileCitationIds(item, out)
    return
  }

  const obj = value as Record<string, unknown>
  const type = typeof obj.type === "string" ? obj.type : ""
  const fileId = typeof obj.file_id === "string" ? obj.file_id : ""
  if (type.includes("file") && fileId) {
    out.push(fileId)
  }

  for (const key of Object.keys(obj)) {
    collectFileCitationIds(obj[key], out)
  }
}

export type FileSearchAnswer = {
  text: string
  usage: {
    input_tokens?: number
    output_tokens?: number
  }
  citationFileIds: string[]
}

export async function answerWithOpenAiFileSearch(params: {
  vectorStoreId: string
  model: string
  fallbackModel?: string | null
  instructions: string
  message: string
  conversation?: Array<{ role: "user" | "assistant"; content: string }>
  maxOutputTokens?: number
}) {
  const tryCall = async (model: string): Promise<FileSearchAnswer> => {
    // instructions は input[] の外で渡す（ユーザー入力と明確に分離）
    const input = [
      ...(params.conversation ?? []).map((turn) => ({
        role: turn.role,
        content: [{ type: turn.role === "assistant" ? "output_text" : "input_text", text: turn.content.slice(0, 4000) }],
      })),
      {
        role: "user",
        content: [{ type: "input_text", text: params.message }],
      },
    ]

    const res = await openAiFetch("/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: params.instructions,
        input,
        tools: [
          {
            type: "file_search",
            vector_store_ids: [params.vectorStoreId],
            max_num_results: 8,
          },
        ],
        tool_choice: "auto",
        max_output_tokens: params.maxOutputTokens ?? 900,
      }),
    })

    const body = (await res.json()) as {
      output_text?: string
      usage?: { input_tokens?: number; output_tokens?: number }
      output?: unknown
    }

    const citationFileIdsRaw: string[] = []
    collectFileCitationIds(body.output, citationFileIdsRaw)
    const citationFileIds = [...new Set(citationFileIdsRaw)]

    // output_text がトップレベルにない場合は output[] から手動で抽出する
    const rawText = body.output_text?.trim() || extractTextFromOutput(body.output)

    // OpenAI が自動挿入する引用マーカー【N:title】を除去する
    // 引用情報は citations 配列として別途返すためテキスト中には不要
    const text = rawText.replace(/【\d+:[^】]*】/g, "").replace(/  +/g, " ").trim()

    return {
      text,
      usage: body.usage ?? {},
      citationFileIds,
    }
  }

  const apiModel = toApiModelName(params.model)
  const apiFallbackModel = params.fallbackModel ? toApiModelName(params.fallbackModel) : undefined

  try {
    const primary = await tryCall(apiModel)
    return { model: params.model, ...primary }
  } catch (error) {
    if (!apiFallbackModel || apiFallbackModel === apiModel) {
      throw error
    }
    const fallback = await tryCall(apiFallbackModel)
    return { model: params.fallbackModel!, ...fallback }
  }
}
