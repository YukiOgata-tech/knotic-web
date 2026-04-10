import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  getStripeClient,
  getStripePriceMap,
  getStripeReturnUrls,
  mapStripeSubscriptionStatus,
  resolvePlanCodeFromPriceId,
  type PlanCode,
} from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

const PLAN_RANK: Record<PlanCode, number> = {
  starter: 0,
  lite: 1,
  standard: 2,
  pro: 3,
}

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

function isCustomerMissingError(error: unknown) {
  if (!(error instanceof Stripe.errors.StripeError)) return false
  if (error.code !== "resource_missing") return false
  // Stripe returns `param: "customer"` on session create and `param: "id"` on customer retrieve.
  if (error.param === "customer" || error.param === "id") return true
  return (
    error.statusCode === 404
  )
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const planCode = String(formData.get("plan_code") ?? "").trim() as PlanCode

    if (!(["starter", "lite", "standard", "pro"] as const).includes(planCode)) {
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
    const stripe = getStripeClient()

    const { data: activeSubscriptionRow } = await admin
      .from("subscriptions")
      .select("id, provider_subscription_id, status")
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .in("status", ["trialing", "active", "past_due", "unpaid", "incomplete", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeSubscriptionRow?.provider_subscription_id) {
      const existingSubscription = await stripe.subscriptions.retrieve(
        activeSubscriptionRow.provider_subscription_id
      )
      const currentItem = existingSubscription.items.data[0]
      const currentPriceId = currentItem?.price?.id ?? null
      const currentPlanCode = currentPriceId ? resolvePlanCodeFromPriceId(currentPriceId) : null

      if (!currentItem) {
        return NextResponse.redirect(new URL("/console/billing?error=subscription_item_missing", request.url), 303)
      }

      if (currentPriceId === priceId) {
        return NextResponse.redirect(new URL("/console/billing?notice=plan_already_current", request.url), 303)
      }

      if (!currentPriceId) {
        return NextResponse.redirect(new URL("/console/billing?error=subscription_item_missing", request.url), 303)
      }

      const existingScheduleId =
        typeof existingSubscription.schedule === "string"
          ? existingSubscription.schedule
          : existingSubscription.schedule?.id ?? null
      if (existingScheduleId) {
        const schedule = await stripe.subscriptionSchedules.retrieve(existingScheduleId)
        const nowSec = Math.floor(Date.now() / 1000)
        const hasFuturePhase = schedule.phases.some((phase) => Number(phase.start_date ?? 0) > nowSec)
        if (hasFuturePhase) {
          return NextResponse.redirect(new URL("/console/billing?notice=plan_change_already_scheduled", request.url), 303)
        }
      }

      const isDowngrade =
        currentPlanCode !== null && PLAN_RANK[planCode] < PLAN_RANK[currentPlanCode]

      if (isDowngrade) {
        const currentItemAny = currentItem as unknown as { current_period_end?: number }
        const existingSubscriptionAny = existingSubscription as unknown as { current_period_end?: number }
        let currentPeriodEnd =
          currentItemAny.current_period_end ??
          existingSubscriptionAny.current_period_end ??
          null

        if (!currentPeriodEnd) {
          const invoicesResource = stripe.invoices as unknown as {
            retrieveUpcoming?: (params: { subscription: string }) => Promise<unknown>
            createPreview?: (params: { subscription: string }) => Promise<unknown>
          }
          const upcomingInvoice = invoicesResource.retrieveUpcoming
            ? await invoicesResource.retrieveUpcoming({ subscription: existingSubscription.id })
            : invoicesResource.createPreview
              ? await invoicesResource.createPreview({ subscription: existingSubscription.id })
              : null
          const upcomingAny = upcomingInvoice as { period_end?: number } | null
          currentPeriodEnd = upcomingAny?.period_end ?? null
        }

        if (!currentPeriodEnd) {
          return NextResponse.redirect(new URL("/console/billing?error=subscription_item_missing", request.url), 303)
        }

        const scheduleId =
          typeof existingSubscription.schedule === "string" ? existingSubscription.schedule : null
        const schedule = scheduleId
          ? await stripe.subscriptionSchedules.retrieve(scheduleId)
          : await stripe.subscriptionSchedules.create({
              from_subscription: existingSubscription.id,
            })
        const scheduleAny = schedule as unknown as {
          current_phase?: {
            start_date?: number | null
          } | null
        }
        // Stripe仕様上、進行中フェーズのstart_dateは変更不可。
        // 既存スケジュールがある場合は現在フェーズの開始日時を維持して更新する。
        const currentPhaseStart = scheduleAny.current_phase?.start_date ?? null

        await stripe.subscriptionSchedules.update(schedule.id, {
          end_behavior: "release",
          phases: [
            {
              start_date: currentPhaseStart ?? "now",
              end_date: currentPeriodEnd,
              items: [
                {
                  price: currentPriceId,
                  quantity: currentItem.quantity ?? 1,
                },
              ],
              proration_behavior: "none",
            },
            {
              start_date: currentPeriodEnd,
              items: [
                {
                  price: priceId,
                  quantity: currentItem.quantity ?? 1,
                },
              ],
              proration_behavior: "none",
            },
          ],
        })

        return NextResponse.redirect(new URL("/console/billing?notice=plan_downgrade_scheduled", request.url), 303)
      }

      if (typeof existingSubscription.schedule === "string") {
        await stripe.subscriptionSchedules.release(existingSubscription.schedule)
      }

      const updated = await stripe.subscriptions.update(existingSubscription.id, {
        cancel_at_period_end: false,
        proration_behavior: "always_invoice",
        billing_cycle_anchor: "unchanged",
        items: [{ id: currentItem.id, price: priceId }],
        metadata: {
          ...(existingSubscription.metadata ?? {}),
          tenant_id: tenantId,
          plan_code: planCode,
        },
      })

      await admin
        .from("subscriptions")
        .update({
          status: mapStripeSubscriptionStatus(updated.status),
          cancel_at_period_end: Boolean(updated.cancel_at_period_end),
        })
        .eq("id", activeSubscriptionRow.id)

      return NextResponse.redirect(new URL("/console/billing?notice=plan_upgrade_prorated", request.url), 303)
    }

    const { data: tenantRow } = await admin
      .from("tenants")
      .select("display_name")
      .eq("id", tenantId)
      .maybeSingle()

    const createStripeCustomer = async () => {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: (tenantRow?.display_name as string | undefined) ?? undefined,
        metadata: {
          tenant_id: tenantId,
        },
      })
      await admin.from("billing_customers").upsert(
        {
          tenant_id: tenantId,
          provider: "stripe",
          provider_customer_id: customer.id,
          billing_email: user.email ?? null,
        },
        { onConflict: "tenant_id" }
      )
      return customer.id
    }

    let providerCustomerId: string | null = null
    const { data: customerRow } = await admin
      .from("billing_customers")
      .select("id, provider_customer_id")
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .maybeSingle()

    if (customerRow?.provider_customer_id) {
      const existingCustomerId = customerRow.provider_customer_id as string
      try {
        const existingCustomer = await stripe.customers.retrieve(existingCustomerId)
        providerCustomerId = existingCustomer.deleted ? await createStripeCustomer() : existingCustomerId
      } catch (error) {
        if (!isCustomerMissingError(error)) throw error
        providerCustomerId = await createStripeCustomer()
      }
    } else {
      providerCustomerId = await createStripeCustomer()
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


