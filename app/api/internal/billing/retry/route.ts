import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { processStripeEvent, recordBillingEventResult } from "@/lib/billing/stripe-webhook"
import { getStripeClient } from "@/lib/stripe"

function getRunnerSecret() {
  return process.env.BILLING_RUNNER_SECRET || process.env.INDEXER_RUNNER_SECRET || null
}

function hasValidRunnerAuth(request: NextRequest) {
  const secret = getRunnerSecret()
  if (!secret) return false
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  return auth.slice("Bearer ".length).trim() === secret
}

export async function POST(request: NextRequest) {
  if (!hasValidRunnerAuth(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const stripe = getStripeClient()

  const nowIso = new Date().toISOString()
  const { data: rows, error } = await admin
    .from("billing_events")
    .select("provider_event_id, payload, attempt_count")
    .is("processed_at", null)
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order("created_at", { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let ok = 0
  let failed = 0

  for (const row of rows ?? []) {
    const event = row.payload as unknown as Stripe.Event
    let tenantId: string | null = null
    let processingError: string | null = null

    try {
      const processed = await processStripeEvent(admin, stripe, event)
      tenantId = processed.tenantId
      ok += 1
    } catch (retryError) {
      failed += 1
      processingError = retryError instanceof Error ? retryError.message : "retry failed"
    }

    await recordBillingEventResult({
      admin,
      event,
      tenantId,
      success: !processingError,
      errorMessage: processingError,
      prevAttemptCount: Number(row.attempt_count ?? 0),
    })
  }

  return NextResponse.json({ ok: true, total: rows?.length ?? 0, succeeded: ok, failed })
}
