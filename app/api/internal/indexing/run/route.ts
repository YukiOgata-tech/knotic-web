import { NextRequest, NextResponse } from "next/server"

import { processQueuedIndexingJobs } from "@/lib/indexing/pipeline"

function isAuthorized(request: NextRequest) {
  const secret = process.env.INDEXER_RUNNER_SECRET
  if (!secret) return false

  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  return auth.slice("Bearer ".length) === secret
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number }
  const limit = typeof body.limit === "number" ? body.limit : 2

  try {
    const results = await processQueuedIndexingJobs(limit)
    const okCount = results.filter((item) => item.ok).length
    return NextResponse.json({
      ok: true,
      processed: results.length,
      succeeded: okCount,
      failed: results.length - okCount,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Indexing run failed" },
      { status: 500 }
    )
  }
}

