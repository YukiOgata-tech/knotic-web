import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getStripeClient, getStripePriceMap } from "@/lib/stripe"
import type { PlanCode } from "@/lib/stripe"
import { getAppUrl } from "@/lib/env"

const VALID_PLAN_CODES = new Set<PlanCode>(["lite", "standard", "pro"])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const admin = createAdminClient()

    const { data: adminRow } = await admin
      .from("platform_admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!adminRow?.is_active) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const body = await request.json()
    const tenantId = String(body.tenant_id ?? "").trim()
    const planCode = String(body.plan_code ?? "").trim() as PlanCode

    if (!tenantId || !VALID_PLAN_CODES.has(planCode)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }

    const { data: tenant } = await admin
      .from("tenants")
      .select("id, display_name, owner_user_id")
      .eq("id", tenantId)
      .maybeSingle()

    if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 })

    // オーナーのメールアドレスを取得
    const { data: ownerData } = await admin.auth.admin.getUserById(tenant.owner_user_id)
    const ownerEmail = ownerData?.user?.email ?? undefined

    const stripe = getStripeClient()

    // Stripe customer を取得または作成
    let providerCustomerId: string | null = null
    const { data: customerRow } = await admin
      .from("billing_customers")
      .select("provider_customer_id")
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .maybeSingle()

    if (customerRow?.provider_customer_id) {
      providerCustomerId = customerRow.provider_customer_id as string
    } else {
      const customer = await stripe.customers.create({
        email: ownerEmail,
        name: tenant.display_name,
        metadata: { tenant_id: tenantId },
      })
      providerCustomerId = customer.id

      await admin.from("billing_customers").upsert(
        {
          tenant_id: tenantId,
          provider: "stripe",
          provider_customer_id: customer.id,
          billing_email: ownerEmail ?? null,
        },
        { onConflict: "tenant_id" }
      )
    }

    const priceMap = getStripePriceMap()
    const priceId = priceMap[planCode]
    const appUrl = getAppUrl().replace(/\/$/, "")

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: providerCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/console/billing?notice=checkout_success`,
      cancel_url: `${appUrl}/console/billing?error=checkout_canceled`,
      client_reference_id: tenantId,
      allow_promotion_codes: true,
      metadata: { tenant_id: tenantId, plan_code: planCode },
      subscription_data: {
        metadata: { tenant_id: tenantId, plan_code: planCode },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: "checkout_url_missing" }, { status: 500 })
    }

    return NextResponse.json({
      url: session.url,
      plan_code: planCode,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error("[admin.stripe-checkout-link]", error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
