import { createAdminClient } from "@/lib/supabase/admin"
import { assertTenantCanUseHostedPage } from "@/lib/billing/limits"
import { createClient } from "@/lib/supabase/server"
import { isHostedBotAccessBlocked } from "@/lib/hosted/member-access"

export type HostedBotContext = {
  id: string
  tenant_id: string
  public_id: string
  name: string
  status: string
  is_public: boolean
  access_mode: "public" | "internal" | null
  require_auth_for_hosted: boolean | null
  force_stopped: boolean | null
  force_stop_reason: string | null
  history_turn_limit: number | null
  ai_model: string | null
  ai_fallback_model: string | null
  ai_max_output_tokens: number | null
}

export async function requireHostedMemberContext(botPublicId: string) {
  const admin = createAdminClient()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("authentication_required")
  }

  const { data: bot } = await admin
    .from("bots")
    .select(
      "id, tenant_id, public_id, name, status, is_public, access_mode, require_auth_for_hosted, force_stopped, force_stop_reason, history_turn_limit, ai_model, ai_fallback_model, ai_max_output_tokens"
    )
    .eq("public_id", botPublicId)
    .maybeSingle()

  if (!bot) throw new Error("bot_not_found")

  const requiresInternal = bot.access_mode === "internal" || Boolean(bot.require_auth_for_hosted)
  if (!requiresInternal) throw new Error("internal_mode_required")

  if (bot.force_stopped) {
    throw new Error(bot.force_stop_reason ?? "bot_force_stopped")
  }

  const { data: tenantRow } = await admin
    .from("tenants")
    .select("id, force_stopped, force_stop_reason")
    .eq("id", bot.tenant_id)
    .maybeSingle()

  if (tenantRow?.force_stopped) {
    throw new Error(tenantRow.force_stop_reason ?? "tenant_force_stopped")
  }

  if (bot.status !== "ready" && bot.status !== "running") {
    throw new Error("bot_not_ready")
  }

  await assertTenantCanUseHostedPage(bot.tenant_id, bot.id)

  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("tenant_id", bot.tenant_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!membership) throw new Error("membership_required")

  const blocked = await isHostedBotAccessBlocked(admin, bot.tenant_id, bot.id, user.id)
  if (blocked) throw new Error("bot_access_denied")

  return {
    user,
    membership: membership as { tenant_id: string; role: "editor" | "reader" },
    bot: bot as HostedBotContext,
  }
}
