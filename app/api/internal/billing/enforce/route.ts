import { NextRequest, NextResponse } from "next/server"

import { enforceAllTenantPlanLimits, enforceTenantPlanLimits } from "@/lib/billing/enforcement"

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

// Vercel Cron からの GET リクエストを受け付ける（毎日 03:00 UTC）
export async function GET(request: NextRequest) {
  if (request.headers.get("x-vercel-cron") !== "1") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const results = await enforceAllTenantPlanLimits()
    const summary = {
      totalTenants: results.length,
      apiKeysRevoked: results.reduce((s, r) => s + r.apiKeysRevoked, 0),
      botOverLimit: results.filter((r) => r.botOverLimit > 0).length,
      storageOver: results.filter((r) => r.storageOverBytes > 0).length,
      hostedOverLimit: results.filter((r) => r.hostedOverLimit > 0).length,
    }
    console.log("[billing/enforce] cron completed", summary)
    return NextResponse.json({ ok: true, mode: "batch", ...summary })
  } catch (err) {
    console.error("[billing/enforce] cron failed", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

type EnforceRequest = {
  tenantId?: string
  limit?: number
}

export async function POST(request: NextRequest) {
  if (!hasValidRunnerAuth(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as EnforceRequest
  const tenantId = body.tenantId?.trim()

  if (tenantId) {
    const result = await enforceTenantPlanLimits(tenantId)
    return NextResponse.json({ ok: true, mode: "single", result })
  }

  const results = await enforceAllTenantPlanLimits({ limit: body.limit })
  return NextResponse.json({
    ok: true,
    mode: "batch",
    totalTenants: results.length,
    results,
  })
}
