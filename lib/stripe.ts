import Stripe from "stripe"

import { getAppUrl } from "@/lib/env"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

type PlanCode = "lite" | "standard" | "pro"

let stripeClient: Stripe | null = null

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv(STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY"), {
      apiVersion: "2026-02-25.clover",
    })
  }
  return stripeClient
}

export function getStripeWebhookSecret() {
  return requireEnv(STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET")
}

export function getStripePriceMap() {
  return {
    lite: requireEnv(process.env.STRIPE_PRICE_LITE_MONTHLY, "STRIPE_PRICE_LITE_MONTHLY"),
    standard: requireEnv(process.env.STRIPE_PRICE_STANDARD_MONTHLY, "STRIPE_PRICE_STANDARD_MONTHLY"),
    pro: requireEnv(process.env.STRIPE_PRICE_PRO_MONTHLY, "STRIPE_PRICE_PRO_MONTHLY"),
  } as const
}

export function getStripePriceMapSafe() {
  return {
    lite: process.env.STRIPE_PRICE_LITE_MONTHLY ?? null,
    standard: process.env.STRIPE_PRICE_STANDARD_MONTHLY ?? null,
    pro: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
  } as const
}

export function resolvePlanCodeFromPriceId(priceId: string): PlanCode | null {
  const map = getStripePriceMapSafe()
  if (map.lite === priceId) return "lite"
  if (map.standard === priceId) return "standard"
  if (map.pro === priceId) return "pro"
  return null
}

export function getStripeReturnUrls() {
  const appUrl = getAppUrl().replace(/\/$/, "")
  return {
    success: `${appUrl}/console/billing?notice=checkout_success`,
    cancel: `${appUrl}/console/billing?error=checkout_canceled`,
    portalReturn: `${appUrl}/console/billing`,
  }
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status):
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused" {
  switch (status) {
    case "trialing":
      return "trialing"
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "unpaid":
      return "unpaid"
    case "paused":
      return "paused"
    case "incomplete":
    case "incomplete_expired":
    default:
      return "incomplete"
  }
}

export type { PlanCode }

