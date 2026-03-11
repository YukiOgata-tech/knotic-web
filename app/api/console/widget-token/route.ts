import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

import { writeAuditLog } from "@/app/console/_lib/audit"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { bot_id?: string; bot_public_id?: string }
  const botId = body.bot_id?.trim()
  const botPublicId = body.bot_public_id?.trim()
  if (!botId || !botPublicId) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!membership || membership.role !== "editor")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = createAdminClient()
  const { data: bot } = await admin
    .from("bots")
    .select("id")
    .eq("id", botId)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle()

  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })

  const rawToken = `knotic_wgt_${crypto.randomBytes(18).toString("base64url")}`
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")

  await admin
    .from("bot_public_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("bot_id", botId)
    .is("revoked_at", null)

  const { error } = await admin.from("bot_public_tokens").insert({
    bot_id: botId,
    public_token_hash: tokenHash,
    allowed_origins: [],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog(supabase, {
    tenantId: membership.tenant_id,
    action: "widget.token.rotate",
    targetType: "bot",
    targetId: botId,
    after: { bot_public_id: botPublicId, token_last4: rawToken.slice(-4) },
  })

  return NextResponse.json({ token: rawToken })
}
