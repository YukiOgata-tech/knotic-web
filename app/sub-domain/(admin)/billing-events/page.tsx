import Link from "next/link"

import { requirePlatformAdminContext } from "@/app/sub-domain/_lib/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const PER_PAGE = 50

function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("ja-JP")
}

type BillingEventRow = {
  id: number
  tenant_id: string | null
  event_type: string
  processed_at: string | null
  processing_error: string | null
  attempt_count: number
  last_attempt_at: string | null
  created_at: string
}

export default async function BillingEventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  await requirePlatformAdminContext()

  const params = (await searchParams) ?? {}
  const modeRaw = Array.isArray(params.mode) ? params.mode[0] : (params.mode ?? "failed")
  const mode = modeRaw === "all" ? "all" : "failed"
  const pageRaw = Array.isArray(params.page) ? params.page[0] : (params.page ?? "1")
  const page = Math.max(1, Number(pageRaw) || 1)
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const admin = createAdminClient()

  let query = admin
    .from("billing_events")
    .select("id, tenant_id, event_type, processed_at, processing_error, attempt_count, last_attempt_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (mode === "failed") {
    query = query.or("processed_at.is.null,processing_error.not.is.null")
  }

  const { data: eventsRaw, count } = await query
  const events = (eventsRaw ?? []) as BillingEventRow[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  // テナント名をまとめて取得
  const tenantIds = [...new Set(events.map((e) => e.tenant_id).filter(Boolean))] as string[]
  const tenantNameMap = new Map<string, string>()
  if (tenantIds.length > 0) {
    const { data: tenants } = await admin
      .from("tenants")
      .select("id, slug, display_name")
      .in("id", tenantIds)
    for (const t of tenants ?? []) {
      tenantNameMap.set(t.id, `${t.display_name} (${t.slug})`)
    }
  }

  function buildUrl(overrides: Record<string, string | number>) {
    const qs = new URLSearchParams()
    qs.set("mode", mode)
    qs.set("page", String(page))
    for (const [k, v] of Object.entries(overrides)) qs.set(k, String(v))
    return `/sub-domain/billing-events?${qs.toString()}`
  }

  return (
    <div className="grid gap-4">
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>支払いイベント確認</CardTitle>
          <CardDescription>
            処理に失敗した、または未処理のStripeイベントを確認できます。Stripeダッシュボードと照合して対応してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pb-3">
          {/* フィルター */}
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              variant={mode === "failed" ? "default" : "outline"}
            >
              <Link href={buildUrl({ mode: "failed", page: 1 })}>失敗・未処理のみ</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={mode === "all" ? "default" : "outline"}
            >
              <Link href={buildUrl({ mode: "all", page: 1 })}>全て表示</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString("ja-JP")} 件 · ページ {page} / {totalPages}
          </p>
        </CardContent>

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {events.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {mode === "failed" ? "失敗・未処理のイベントはありません。" : "イベントがありません。"}
            </p>
          ) : (
            <>
              {/* モバイル: カードリスト */}
              <div className="grid gap-2 p-4 sm:hidden">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-medium">{ev.event_type}</p>
                      <Badge variant={ev.processed_at ? "default" : "destructive"} className="text-[10px] shrink-0">
                        {ev.processed_at ? "処理済" : "未処理"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ev.tenant_id ? (tenantNameMap.get(ev.tenant_id) ?? ev.tenant_id) : "テナント不明"}
                    </p>
                    {ev.processing_error ? (
                      <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400 break-all">
                        {ev.processing_error}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      試行 {ev.attempt_count}回 · {fmtDate(ev.created_at)}
                    </p>
                  </div>
                ))}
              </div>

              {/* デスクトップ: テーブル */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>イベントタイプ</TableHead>
                      <TableHead>テナント</TableHead>
                      <TableHead>状態</TableHead>
                      <TableHead>エラー内容</TableHead>
                      <TableHead>試行</TableHead>
                      <TableHead>発生日時</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-mono text-xs">{ev.event_type}</TableCell>
                        <TableCell className="text-xs">
                          {ev.tenant_id ? (
                            <Link
                              href={`/sub-domain/tenants/${ev.tenant_id}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {tenantNameMap.get(ev.tenant_id) ?? ev.tenant_id}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">不明</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ev.processed_at ? "default" : "destructive"} className="text-xs">
                            {ev.processed_at ? "処理済" : "未処理"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {ev.processing_error ? (
                            <p className="truncate text-xs text-red-600 dark:text-red-400" title={ev.processing_error}>
                              {ev.processing_error}
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{ev.attempt_count}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{fmtDate(ev.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>

        {totalPages > 1 ? (
          <CardContent className="pt-0">
            <div className="flex items-center justify-center gap-2">
              {page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildUrl({ page: page - 1 })}>← 前へ</Link>
                </Button>
              ) : null}
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              {page < totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildUrl({ page: page + 1 })}>次へ →</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}
