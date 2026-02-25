export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
export const EMBEDDING_DIMENSIONS = 1536
export const MAX_CRAWL_PAGES_PER_JOB = 50
export const MAX_CHUNK_CHARS = 1400
export const CHUNK_OVERLAP_CHARS = 180
export const STORAGE_BUCKET_ARTIFACTS = "source-artifacts"

export function getOpenAiApiKey() {
  const value = process.env.OPENAI_API_KEY
  if (!value) {
    throw new Error("Missing environment variable: OPENAI_API_KEY")
  }
  return value
}

export function getEmbeddingModel() {
  const configured = process.env.OPENAI_EMBEDDING_MODEL?.trim()
  if (!configured) return DEFAULT_EMBEDDING_MODEL
  if (configured !== DEFAULT_EMBEDDING_MODEL) return DEFAULT_EMBEDDING_MODEL
  return configured
}

