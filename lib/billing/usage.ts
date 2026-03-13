import { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = ReturnType<typeof createAdminClient>

type IncrementUsageDailyInput = {
  tenantId: string
  botId: string
  usageDate: string
  messages?: number
  tokensIn?: number
  tokensOut?: number
}

export type UsageIncrementResult = {
  counterSource: "rpc" | "fallback_update" | "fallback_insert" | "fallback_retry_update" | "failed"
  rpcError: string | null
  fallbackError: string | null
}

function clampToNonNegativeInt(value: number | undefined) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.trunc(value as number))
}

export async function incrementUsageDailySafe(
  admin: AdminClient,
  input: IncrementUsageDailyInput
): Promise<UsageIncrementResult> {
  const messages = clampToNonNegativeInt(input.messages)
  const tokensIn = clampToNonNegativeInt(input.tokensIn)
  const tokensOut = clampToNonNegativeInt(input.tokensOut)

  const rpcResult = await admin.rpc("increment_usage_daily", {
    p_tenant_id: input.tenantId,
    p_bot_id: input.botId,
    p_usage_date: input.usageDate,
    p_messages: messages,
    p_tokens_in: tokensIn,
    p_tokens_out: tokensOut,
  })
  if (!rpcResult.error) {
    return {
      counterSource: "rpc",
      rpcError: null,
      fallbackError: null,
    }
  }

  const rpcError = rpcResult.error.message
  let fallbackError: string | null = null

  const { data: existingRow, error: selectError } = await admin
    .from("usage_daily")
    .select("id, messages_count, tokens_in, tokens_out")
    .eq("tenant_id", input.tenantId)
    .eq("bot_id", input.botId)
    .eq("usage_date", input.usageDate)
    .maybeSingle()

  if (selectError) {
    fallbackError = selectError.message
  }

  if (!selectError && existingRow?.id) {
    const { error: updateError } = await admin
      .from("usage_daily")
      .update({
        messages_count: Number(existingRow.messages_count ?? 0) + messages,
        tokens_in: Number(existingRow.tokens_in ?? 0) + tokensIn,
        tokens_out: Number(existingRow.tokens_out ?? 0) + tokensOut,
      })
      .eq("id", existingRow.id)
    if (!updateError) {
      return {
        counterSource: "fallback_update",
        rpcError,
        fallbackError,
      }
    }
    fallbackError = updateError.message
  }

  const { error: insertError } = await admin.from("usage_daily").insert({
    tenant_id: input.tenantId,
    bot_id: input.botId,
    usage_date: input.usageDate,
    messages_count: messages,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  })
  if (!insertError) {
    return {
      counterSource: "fallback_insert",
      rpcError,
      fallbackError,
    }
  }
  fallbackError = insertError.message

  const { data: retryRow, error: retrySelectError } = await admin
    .from("usage_daily")
    .select("id, messages_count, tokens_in, tokens_out")
    .eq("tenant_id", input.tenantId)
    .eq("bot_id", input.botId)
    .eq("usage_date", input.usageDate)
    .maybeSingle()

  if (retrySelectError) {
    fallbackError = retrySelectError.message
  }

  if (retryRow?.id) {
    const { error: retryUpdateError } = await admin
      .from("usage_daily")
      .update({
        messages_count: Number(retryRow.messages_count ?? 0) + messages,
        tokens_in: Number(retryRow.tokens_in ?? 0) + tokensIn,
        tokens_out: Number(retryRow.tokens_out ?? 0) + tokensOut,
      })
      .eq("id", retryRow.id)
    if (!retryUpdateError) {
      return {
        counterSource: "fallback_retry_update",
        rpcError,
        fallbackError,
      }
    }
    fallbackError = retryUpdateError.message
  }

  return {
    counterSource: "failed",
    rpcError,
    fallbackError,
  }
}
