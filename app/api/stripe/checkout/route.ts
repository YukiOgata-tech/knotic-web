import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getStripeClient, getStripePriceMap, getStripeReturnUrls, type PlanCode } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

function toErrorCode(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    if (error.statusCode === 403) return "stripe_forbidden"
    if (error.statusCode === 401) return "stripe_unauthorized"
    if (error.code === "resource_missing") return "stripe_resource_missing"
    if (error.code === "invalid_request_error") return "stripe_invalid_request"
    return "stripe_error"
  }
  return "checkout_failed"
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const planCode = String(formData.get("plan_code") ?? "").trim() as PlanCode

    if (!(["lite", "standard", "pro"] as const).includes(planCode)) {
      return NextResponse.redirect(new URL("/console/billing?error=invalid_plan", request.url), 303)
    }

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
    const priceMap = getStripePriceMap()
    const priceId = priceMap[planCode]

    const { data: tenantRow } = await admin
      .from("tenants")
      .select("display_name")
      .eq("id", tenantId)
      .maybeSingle()

    let providerCustomerId: string | null = null
    const { data: customerRow } = await admin
      .from("billing_customers")
      .select("id, provider_customer_id")
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .maybeSingle()

    const stripe = getStripeClient()

    if (customerRow?.provider_customer_id) {
      providerCustomerId = customerRow.provider_customer_id as string
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: (tenantRow?.display_name as string | undefined) ?? undefined,
        metadata: {
          tenant_id: tenantId,
        },
      })
      providerCustomerId = customer.id

      await admin.from("billing_customers").upsert(
        {
          tenant_id: tenantId,
          provider: "stripe",
          provider_customer_id: customer.id,
          billing_email: user.email ?? null,
        },
        { onConflict: "tenant_id" }
      )
    }

    const urls = getStripeReturnUrls()

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: providerCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: urls.success,
      cancel_url: urls.cancel,
      client_reference_id: tenantId,
      metadata: {
        tenant_id: tenantId,
        plan_code: planCode,
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
          plan_code: planCode,
        },
      },
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return NextResponse.redirect(new URL("/console/billing?error=checkout_url_missing", request.url), 303)
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    console.error("[stripe.checkout]", error)
    return NextResponse.redirect(new URL(`/console/billing?error=${toErrorCode(error)}`, request.url), 303)
  }
}


