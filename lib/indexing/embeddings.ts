import { getEmbeddingModel, getOpenAiApiKey } from "@/lib/indexing/config"

type EmbeddingsResponse = {
  data: Array<{
    embedding: number[]
    index: number
  }>
}

export async function createEmbeddings(input: string[]) {
  if (!input.length) return []

  const apiKey = getOpenAiApiKey()
  const model = getEmbeddingModel()

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Embedding API request failed: ${message}`)
  }

  const body = (await response.json()) as EmbeddingsResponse
  return body.data.sort((a, b) => a.index - b.index).map((item) => item.embedding)
}

