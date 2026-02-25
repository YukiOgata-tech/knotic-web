import { CHUNK_OVERLAP_CHARS, MAX_CHUNK_CHARS } from "@/lib/indexing/config"

export type ChunkItem = {
  index: number
  text: string
  estimatedTokens: number
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4))
}

export function chunkPlainText(text: string): ChunkItem[] {
  const normalized = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim()
  if (!normalized) return []

  const chunks: ChunkItem[] = []
  let start = 0
  let index = 0

  while (start < normalized.length) {
    const end = Math.min(start + MAX_CHUNK_CHARS, normalized.length)
    const piece = normalized.slice(start, end).trim()
    if (piece) {
      chunks.push({
        index,
        text: piece,
        estimatedTokens: estimateTokens(piece),
      })
      index += 1
    }

    if (end >= normalized.length) break
    start = Math.max(0, end - CHUNK_OVERLAP_CHARS)
  }

  return chunks
}

