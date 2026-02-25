type Role = "user" | "assistant"

export type ConversationTurn = {
  role: Role
  content: string
}

export type GenerateAnswerParams = {
  model: string
  fallbackModel?: string | null
  systemPrompt: string
  userPrompt: string
  conversation?: ConversationTurn[]
  maxOutputTokens?: number
}

type ResponsesUsage = {
  input_tokens?: number
  output_tokens?: number
}

function getOpenAiApiKey() {
  const value = process.env.OPENAI_API_KEY
  if (!value) {
    throw new Error("Missing environment variable: OPENAI_API_KEY")
  }
  return value
}

function normalizeTurns(conversation: ConversationTurn[] | undefined) {
  const turns = (conversation ?? [])
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: [{ type: "input_text", text: item.content.slice(0, 4000) }],
    }))
  return turns
}

async function callResponsesApi(params: {
  model: string
  systemPrompt: string
  userPrompt: string
  conversation?: ConversationTurn[]
  maxOutputTokens?: number
}) {
  const apiKey = getOpenAiApiKey()
  const input = [
    {
      role: "system",
      content: [{ type: "input_text", text: params.systemPrompt }],
    },
    ...normalizeTurns(params.conversation),
    {
      role: "user",
      content: [{ type: "input_text", text: params.userPrompt }],
    },
  ]

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      input,
      max_output_tokens: params.maxOutputTokens ?? 900,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Responses API failed (${response.status}): ${body}`)
  }

  const body = (await response.json()) as {
    output_text?: string
    usage?: ResponsesUsage
  }

  const text = body.output_text?.trim() ?? ""
  return {
    text,
    usage: body.usage ?? {},
  }
}

export async function generateAnswer(params: GenerateAnswerParams) {
  try {
    const primary = await callResponsesApi({
      model: params.model,
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      conversation: params.conversation,
      maxOutputTokens: params.maxOutputTokens,
    })
    return {
      model: params.model,
      text: primary.text,
      usage: primary.usage,
    }
  } catch (error) {
    if (!params.fallbackModel || params.fallbackModel === params.model) {
      throw error
    }
    const fallback = await callResponsesApi({
      model: params.fallbackModel,
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      conversation: params.conversation,
      maxOutputTokens: params.maxOutputTokens,
    })
    return {
      model: params.fallbackModel,
      text: fallback.text,
      usage: fallback.usage,
    }
  }
}

