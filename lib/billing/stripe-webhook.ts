import Stripe from "stripe"

import { createAdminClient } from "@/lib/supabase/admin"
import { mapStripeSubscriptionStatus, resolvePlanCodeFromPriceId } from "@/lib/stripe"

type AdminClient = ReturnType<typeof createAdminClient>

function toIsoFromUnix(value: number | null | undefined) {
  if (!value) return null
  return new Date(value * 1000).toISOString()
}

async function findTenantIdByCustomer(admin: AdminClient, customerId: string) {
  const { data } = await admin
    .from("billing_customers")
    .select("tenant_id")
    .eq("provider", "stripe")
    .eq("provider_customer_id", customerId)
    .maybeSingle()

  return (data?.tenant_id as string | undefined) ?? null
}

async function findPlanIdByCode(admin: AdminClient, code: string) {
  const { data } = await admin
    .from("plans")
    .select("id")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle()

  return (data?.id as number | undefined) ?? null
}

async function upsertSubscriptionFromStripe(admin: AdminClient, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
  const metadataTenantId = subscription.metadata?.tenant_id ?? null
  const tenantId = metadataTenantId || (await findTenantIdByCustomer(admin, customerId))

  if (!tenantId) {
    throw new Error("tenant_id not resolved from stripe subscription")
  }

  const firstPriceId = subscription.items.data[0]?.price?.id
  const planCode = firstPriceId ? resolvePlanCodeFromPriceId(firstPriceId) : null
  if (!planCode) {
    throw new Error(`plan code not resolved from price id: ${firstPriceId ?? "(none)"}`)
  }

  const planId = await findPlanIdByCode(admin, planCode)
  if (!planId) {
    throw new Error(`plan not found for code: ${planCode}`)
  }

  const sub = subscription as unknown as {
    current_period_start?: number
    current_period_end?: number
    trial_end?: number
  }

  await admin.from("subscriptions").upsert(
    {
      tenant_id: tenantId,
      plan_id: planId,
      provider: "stripe",
      provider_subscription_id: subscription.id,
      status: mapStripeSubscriptionStatus(subscription.status),
      current_period_start: toIsoFromUnix(sub.current_period_start),
      current_period_end: toIsoFromUnix(sub.current_period_end),
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      trial_ends_at: toIsoFromUnix(sub.trial_end),
    },
    { onConflict: "provider_subscription_id" }
  )

  return tenantId
}

async function markSubscriptionStatusByProviderId(
  admin: AdminClient,
  providerSubscriptionId: string,
  nextStatus: "active" | "past_due" | "unpaid"
) {
  await admin
    .from("subscriptions")
    .update({ status: nextStatus })
    .eq("provider", "stripe")
    .eq("provider_subscription_id", providerSubscriptionId)
}

async function createTenantNotificationSafe(
  admin: AdminClient,
  tenantId: string,
  level: "info" | "warning" | "critical",
  kind: string,
  title: string,
  message: string,
  dedupeKey: string,
  metadata?: Record<string, unknown>
) {
  try {
    await admin.from("tenant_notifications").upsert(
      {
        tenant_id: tenantId,
        level,
        kind,
        title,
        message,
        dedupe_key: dedupeKey,
        metadata: metadata ?? {},
      },
      { onConflict: "dedupe_key" }
    )
  } catch {
    // no-op
  }
}

export async function processStripeEvent(
  admin: AdminClient,
  stripe: Stripe,
  event: Stripe.Event
): Promise<{ tenantId: string | null }> {
  let tenantId: string | null = null

  switch (event.type) {
    case "customer.created":
    case "customer.updated": {
      const customer = event.data.object as Stripe.Customer
      tenantId = customer.metadata?.tenant_id ?? null
      if (tenantId) {
        await admin.from("billing_customers").upsert(
          {
            tenant_id: tenantId,
            provider: "stripe",
            provider_customer_id: customer.id,
            billing_email: customer.email,
          },
          { onConflict: "tenant_id" }
        )
      }
      break
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
      tenantId =
        (session.metadata?.tenant_id as string | undefined) ??
        (session.client_reference_id as string | undefined) ??
        null

      if (customerId && tenantId) {
        await admin.from("billing_customers").upsert(
          {
            tenant_id: tenantId,
            provider: "stripe",
            provider_customer_id: customerId,
            billing_email: session.customer_details?.email ?? null,
          },
          { onConflict: "tenant_id" }
        )
      }

      if (typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        tenantId = await upsertSubscriptionFromStripe(admin, subscription)
      }
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      tenantId = await upsertSubscriptionFromStripe(admin, subscription)

      if (event.type === "customer.subscription.deleted" && tenantId) {
        await createTenantNotificationSafe(
          admin,
          tenantId,
          "info",
          "subscription_canceled",
          "契約が停止されました",
          "契約が停止状態になりました。必要に応じて再契約してください。",
          `sub_canceled:${tenantId}:${subscription.id}`,
          { provider_subscription_id: subscription.id }
        )
      }
      break
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice
      const invoiceAny = invoice as unknown as {
        subscription?: string | { id?: string }
        customer?: string | { id?: string }
      }
      const subId =
        typeof invoiceAny.subscription === "string"
          ? invoiceAny.subscription
          : invoiceAny.subscription?.id
      const customerId =
        typeof invoiceAny.customer === "string" ? invoiceAny.customer : invoiceAny.customer?.id
      if (subId) {
        await markSubscriptionStatusByProviderId(admin, subId, "active")
      }
      if (customerId) {
        tenantId = await findTenantIdByCustomer(admin, customerId)
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const invoiceAny = invoice as unknown as {
        id?: string
        subscription?: string | { id?: string }
        customer?: string | { id?: string }
      }
      const subId =
        typeof invoiceAny.subscription === "string"
          ? invoiceAny.subscription
          : invoiceAny.subscription?.id
      const customerId =
        typeof invoiceAny.customer === "string" ? invoiceAny.customer : invoiceAny.customer?.id
      if (subId) {
        await markSubscriptionStatusByProviderId(admin, subId, "past_due")
      }
      if (customerId) {
        tenantId = await findTenantIdByCustomer(admin, customerId)
        if (tenantId) {
          await createTenantNotificationSafe(
            admin,
            tenantId,
            "critical",
            "invoice_payment_failed",
            "支払いに失敗しました",
            "請求の支払いに失敗しました。カード情報をご確認ください。",
            `invoice_failed:${tenantId}:${invoiceAny.id ?? "unknown"}`,
            { invoice_id: invoiceAny.id ?? null, subscription_id: subId }
          )
        }
      }
      break
    }

    default:
      break
  }

  return { tenantId }
}

function calcNextRetryAt(attemptCount: number) {
  const minutes = Math.min(360, Math.max(1, 2 ** attemptCount))
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export async function recordBillingEventResult(params: {
  admin: AdminClient
  event: Stripe.Event
  tenantId: string | null
  success: boolean
  errorMessage?: string | null
  prevAttemptCount?: number
}) {
  const { admin, event, tenantId, success, errorMessage, prevAttemptCount = 0 } = params
  const attemptCount = prevAttemptCount + 1

  const payload = {
    tenant_id: tenantId,
    provider: "stripe",
    provider_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
    processed_at: success ? new Date().toISOString() : null,
    processing_error: success ? null : errorMessage ?? "processing failed",
    attempt_count: attemptCount,
    last_attempt_at: new Date().toISOString(),
    next_retry_at: success ? null : calcNextRetryAt(attemptCount),
  }

  try {
    await admin.from("billing_events").upsert(payload, { onConflict: "provider_event_id" })
  } catch {
    await admin.from("billing_events").insert({
      tenant_id: tenantId,
      provider: "stripe",
      provider_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      processed_at: success ? new Date().toISOString() : null,
    })
  }
}
