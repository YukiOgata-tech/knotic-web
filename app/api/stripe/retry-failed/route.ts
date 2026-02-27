import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { processStripeEvent, recordBillingEventResult } from "@/lib/billing/stripe-webhook"
import { getStripeClient } from "@/lib/stripe"
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
    const nowIso = new Date().toISOString()

    const { data: rows } = await admin
      .from("billing_events")
      .select("provider_event_id, payload, attempt_count")
      .eq("tenant_id", tenantId)
      .is("processed_at", null)
      .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
      .order("created_at", { ascending: true })
      .limit(20)

    const stripe = getStripeClient()

    let failed = 0
    for (const row of rows ?? []) {
      const event = row.payload as unknown as Stripe.Event
      let resolvedTenantId: string | null = tenantId
      let processingError: string | null = null

      try {
        const processed = await processStripeEvent(admin, stripe, event)
        resolvedTenantId = processed.tenantId ?? tenantId
      } catch (retryError) {
        failed += 1
        processingError = retryError instanceof Error ? retryError.message : "retry failed"
      }

      await recordBillingEventResult({
        admin,
        event,
        tenantId: resolvedTenantId,
        success: !processingError,
        errorMessage: processingError,
        prevAttemptCount: Number(row.attempt_count ?? 0),
      })
    }

    if (failed > 0) {
      return NextResponse.redirect(new URL(`/console/billing?error=retry_partial_failed_${failed}`, request.url), 303)
    }

    return NextResponse.redirect(new URL("/console/billing?notice=retry_success", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/console/billing?error=retry_failed", request.url), 303)
  }
}
