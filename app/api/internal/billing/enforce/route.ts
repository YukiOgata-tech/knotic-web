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
