import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getStripeClient, mapStripeSubscriptionStatus } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login?next=/console/billing", request.url))
    }

    const admin = createAdminClient()
    const { data: membership } = await admin
      .from("tenant_memberships")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    if (!membership || membership.role !== "editor") {
      return NextResponse.redirect(new URL("/console/billing?error=permission_denied", request.url))
    }

    const tenantId = membership.tenant_id as string
    const operationalStatuses = new Set(["trialing", "active", "past_due", "unpaid"])
    const { data: subRow } = await admin
      .from("subscriptions")
      .select("id, provider_subscription_id, status")
      .eq("tenant_id", tenantId)
      .in("status", ["trialing", "active", "past_due", "unpaid", "canceled", "incomplete", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subRow?.provider_subscription_id) {
      return NextResponse.redirect(new URL("/console/billing?error=subscription_not_found", request.url))
    }
    if (!operationalStatuses.has(String(subRow.status ?? ""))) {
      return NextResponse.redirect(new URL("/console/billing?error=subscription_not_operational", request.url))
    }

    const stripe = getStripeClient()
    const updated = await stripe.subscriptions.update(subRow.provider_subscription_id, {
      cancel_at_period_end: true,
    })

    await admin
      .from("subscriptions")
      .update({
        status: mapStripeSubscriptionStatus(updated.status),
        cancel_at_period_end: Boolean(updated.cancel_at_period_end),
      })
      .eq("id", subRow.id)

    return NextResponse.redirect(new URL("/console/billing?notice=cancel_scheduled", request.url))
  } catch (error) {
    console.error("[stripe.subscription.cancel]", error)
    return NextResponse.redirect(new URL("/console/billing?error=cancel_failed", request.url))
  }
}
