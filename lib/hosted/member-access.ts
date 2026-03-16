import { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = ReturnType<typeof createAdminClient>

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const maybe = error as { code?: string | null; message?: string | null }
  return (
    maybe.code === "42P01" ||
    String(maybe.message ?? "").toLowerCase().includes("does not exist")
  )
}

export async function isHostedBotAccessBlocked(
  admin: AdminClient,
  tenantId: string,
  botId: string,
  userId: string
) {
  const { data, error } = await admin
    .from("bot_hosted_access_blocks")
    .select("bot_id")
    .eq("tenant_id", tenantId)
    .eq("bot_id", botId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) {
      // Before DB patch is applied, keep legacy behavior (default allow).
      return false
    }
    throw error
  }

  return Boolean(data)
}
