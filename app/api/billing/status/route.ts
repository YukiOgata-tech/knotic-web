import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ authenticated: false, hasActiveSubscription: false })
  }

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ authenticated: true, hasActiveSubscription: false })
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id")
    .eq("tenant_id", membership.tenant_id)
    .in("status", ["trialing", "active", "past_due", "unpaid"])
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    authenticated: true,
    hasActiveSubscription: Boolean(subscription),
  })
}
