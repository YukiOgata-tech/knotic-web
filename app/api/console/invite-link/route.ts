import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getAppUrl } from "@/lib/env"

export async function GET(request: NextRequest) {
  const inviteId = request.nextUrl.searchParams.get("inviteId")?.trim()
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId is required" }, { status: 400 })
  }

  // Verify session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  // Fetch invite and verify it belongs to a tenant the user is an editor of
  const { data: invite, error: inviteError } = await admin
    .from("tenant_member_invites")
    .select("id, tenant_id, email, status")
    .eq("id", inviteId)
    .eq("status", "pending")
    .maybeSingle()

  if (inviteError || !invite) {
    return NextResponse.json({ error: "invite not found" }, { status: 404 })
  }

  // Check user is editor of this tenant
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("role")
    .eq("tenant_id", invite.tenant_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!membership || membership.role !== "editor") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  // Generate fresh token and refresh expiry
  const token = `inv_${crypto.randomBytes(24).toString("base64url")}`
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  const { error: updateError } = await admin
    .from("tenant_member_invites")
    .update({
      token_hash: tokenHash,
      expires_at: expiresAt,
      invited_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inviteId)
    .eq("tenant_id", invite.tenant_id)

  if (updateError) {
    return NextResponse.json({ error: "failed to refresh invite" }, { status: 500 })
  }

  const appUrl = getAppUrl().replace(/\/$/, "")
  const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(token)}`

  return NextResponse.json({ inviteUrl, expiresAt })
}
