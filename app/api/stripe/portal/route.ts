import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getStripeClient, getStripeReturnUrls } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login?next=/console/billing", request.url), 303)
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
      return NextResponse.redirect(new URL("/console/billing?error=permission_denied", request.url), 303)
    }

    const tenantId = membership.tenant_id as string

    const { data: customerRow } = await admin
      .from("billing_customers")
      .select("provider_customer_id")
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .maybeSingle()

    if (!customerRow?.provider_customer_id) {
      return NextResponse.redirect(new URL("/console/billing?error=customer_not_found", request.url), 303)
    }

    const stripe = getStripeClient()
    const urls = getStripeReturnUrls()
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerRow.provider_customer_id as string,
      return_url: urls.portalReturn,
    })

    return NextResponse.redirect(portal.url, 303)
  } catch (error) {
    console.error("[stripe.portal]", error)
    return NextResponse.redirect(new URL("/console/billing?error=portal_failed", request.url), 303)
  }
}

