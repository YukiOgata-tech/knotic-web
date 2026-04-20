import crypto from "node:crypto"

import { STORAGE_BUCKET_ARTIFACTS } from "@/lib/indexing/config"
import { createAdminClient } from "@/lib/supabase/admin"

function artifactPath(tenantId: string, sourceId: string, kind: "raw" | "text", suffix: string) {
  return `${tenantId}/${sourceId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${kind}.${suffix}`
}

export async function storeFileKnowledgeMarkdown(params: {
  tenantId: string
  botId: string
  sourceId: string
  title: string
  markdown: string
  rawBytes: number
}) {
  const admin = createAdminClient()
  const textPath = artifactPath(params.tenantId, params.sourceId, "text", "md")
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET_ARTIFACTS)
    .upload(textPath, Buffer.from(params.markdown, "utf-8"), {
      contentType: "text/markdown; charset=utf-8",
      upsert: false,
    })

  if (uploadError) {
    throw new Error(
      `Storage upload failed for ${textPath}. Ensure bucket '${STORAGE_BUCKET_ARTIFACTS}' exists.`
    )
  }

  const { error: upsertError } = await admin.from("source_pages").upsert(
    {
      source_id: params.sourceId,
      tenant_id: params.tenantId,
      bot_id: params.botId,
      canonical_url: `file://${params.sourceId}/knowledge.md`,
      title: `${params.title} のナレッジ化テキスト`,
      status_code: 200,
      content_hash: crypto.createHash("sha256").update(params.markdown).digest("hex"),
      raw_path: null,
      text_path: textPath,
      raw_bytes: params.rawBytes,
      text_bytes: Buffer.byteLength(params.markdown, "utf-8"),
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "source_id,canonical_url" }
  )

  if (upsertError) throw upsertError

  return { textPath }
}
