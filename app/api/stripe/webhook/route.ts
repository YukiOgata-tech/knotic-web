import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { processStripeEvent, recordBillingEventResult } from "@/lib/billing/stripe-webhook"
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const admin = createAdminClient()
  const stripe = getStripeClient()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "missing stripe-signature" }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, getStripeWebhookSecret())
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid signature" },
      { status: 400 }
    )
  }

  const { data: existing } = await admin
    .from("billing_events")
    .select("id, processed_at, attempt_count")
    .eq("provider_event_id", event.id)
    .maybeSingle()

  if (existing?.processed_at) {
    return NextResponse.json({ ok: true, deduplicated: true })
  }

  let tenantId: string | null = null
  let processingError: string | null = null

  try {
    const processed = await processStripeEvent(admin, stripe, event)
    tenantId = processed.tenantId
  } catch (error) {
    processingError = error instanceof Error ? error.message : "webhook processing failed"
  }

  await recordBillingEventResult({
    admin,
    event,
    tenantId,
    success: !processingError,
    errorMessage: processingError,
    prevAttemptCount: Number(existing?.attempt_count ?? 0),
  })

  if (processingError) {
    return NextResponse.json({ error: processingError }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
