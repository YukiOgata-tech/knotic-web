import Link from "next/link"

import { fetchIndexingJobStats } from "@/app/sub-domain/_lib/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type IndexingErrorRow = {
  id: string
  type: string
  url: string | null
  file_name: string | null
  file_search_error: string
  updated_at: string
  bot_id: string
  bot_name: string
  tenant_id: string
  tenant_display_name: string
  tenant_slug: string
}

async function fetchIndexingErrors(): Promise<IndexingErrorRow[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("sources")
    .select("id, type, url, file_name, file_search_error, updated_at, bots(id, name, tenant_id, tenants(id, display_name, slug))")
    .not("file_search_error", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100)

  return ((data ?? []) as unknown as Array<{
    id: string
    type: string
    url: string | null
    file_name: string | null
    file_search_error: string
    updated_at: string
    bots: Array<{
      id: string
      name: string
      tenant_id: string
      tenants: Array<{ id: string; display_name: string; slug: string }>
    }>
  }>).map((row) => {
    const bot = row.bots?.[0] ?? null
    const tenant = bot?.tenants?.[0] ?? null
    return {
      id: row.id,
      type: row.type,
      url: row.url,
      file_name: row.file_name,
      file_search_error: row.file_search_error,
      updated_at: row.updated_at,
      bot_id: bot?.id ?? "",
      bot_name: bot?.name ?? "-",
      tenant_id: tenant?.id ?? "",
      tenant_display_name: tenant?.display_name ?? "-",
      tenant_slug: tenant?.slug ?? "-",
    }
  })
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ja-JP")
}

function fmtDateShort(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return `${date.toLocaleDateString("ja-JP")} ${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
}

function fmtDuration(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return "-"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (Number.isNaN(ms) || ms < 0) return "-"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.round(ms / 60000)}m`
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "queued":    return <Badge variant="secondary">queued</Badge>
    case "running":   return <Badge className="bg-blue-500 text-white">running</Badge>
    case "completed": return <Badge className="bg-emerald-600 text-white">completed</Badge>
    case "failed":    return <Badge variant="destructive">failed</Badge>
    default:          return <Badge variant="outline">{status}</Badge>
  }
}

export default async function IndexingJobsPage() {
  const [{ rows, counts }, errorRows] = await Promise.all([
    fetchIndexingJobStats(),
    fetchIndexingErrors(),
  ])
  const statusOrder = ["queued", "running", "failed", "completed"]

  return (
    <div className="grid gap-4">
      {/* ステータス集計 */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>インデックスジョブ監視</CardTitle>
          <CardDescription>
            直近7日間のステータス集計と最新100件のジョブ一覧。queued/running が滞留していないか確認してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statusOrder.map((status) => {
              const count = counts[status] ?? 0
              const isWarn = (status === "failed" && count > 0) || (status === "queued" && count > 10)
              return (
                <div key={status} className="rounded-xl border border-black/20 p-3 dark:border-white/10">
                  <p className="text-xs text-muted-foreground">{status}</p>
                  <p className={`text-2xl font-semibold ${isWarn ? "text-red-600 dark:text-red-400" : ""}`}>
                    {count.toLocaleString("ja-JP")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">過去7日間</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ジョブ一覧 */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>直近ジョブ（最新100件）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* ── モバイル: カードリスト ── */}
          <div className="grid gap-0 divide-y divide-black/5 sm:hidden dark:divide-white/5">
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">ジョブが見つかりません</p>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="grid gap-1.5 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={row.status} />
                    <span className="text-[11px] text-muted-foreground">{fmtDateShort(row.requested_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <Link
                      href={`/sub-domain/tenants/${row.tenant_id}`}
                      className="font-mono text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {row.tenant_id.slice(0, 12)}…
                    </Link>
                    <span>{row.job_type}</span>
                    <span>
                      {row.finished_at
                        ? fmtDuration(row.started_at, row.finished_at)
                        : row.started_at ? "実行中" : "-"}
                    </span>
                    {row.pages_indexed != null ? <span>{row.pages_indexed} pages</span> : null}
                  </div>
                  {row.error_message ? (
                    <p className="text-[11px] text-red-600 dark:text-red-400">
                      {row.error_message.slice(0, 100)}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {/* ── デスクトップ: テーブル ── */}
          <div className="hidden overflow-x-auto sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ステータス</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>依頼日時</TableHead>
                  <TableHead>所要時間</TableHead>
                  <TableHead>pages</TableHead>
                  <TableHead>エラー</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      ジョブが見つかりません
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell><StatusBadge status={row.status} /></TableCell>
                      <TableCell className="whitespace-normal text-xs">
                        <Link
                          href={`/sub-domain/tenants/${row.tenant_id}`}
                          className="font-mono text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {row.tenant_id.slice(0, 12)}…
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{row.job_type}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(row.requested_at)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.finished_at
                          ? fmtDuration(row.started_at, row.finished_at)
                          : row.started_at ? "実行中" : "-"}
                      </TableCell>
                      <TableCell className="text-xs">{row.pages_indexed}</TableCell>
                      <TableCell className="max-w-[200px] whitespace-normal text-[11px] text-red-700 dark:text-red-400">
                        {row.error_message ? row.error_message.slice(0, 120) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* ── インデックスエラー横断一覧 ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle>インデックスエラー一覧</CardTitle>
            {errorRows.length > 0 ? (
              <Badge variant="destructive">{errorRows.length}</Badge>
            ) : null}
          </div>
          <CardDescription>
            file_search_error が記録されているソースの一覧（最新100件）。エラー内容を確認してテナントへの連絡判断に使ってください。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {errorRows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              エラーのあるソースはありません。
            </p>
          ) : (
            <>
              {/* モバイル: カードリスト */}
              <div className="grid gap-0 divide-y divide-black/5 sm:hidden dark:divide-white/5">
                {errorRows.map((row) => (
                  <div key={row.id} className="grid gap-1.5 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px]">{row.type}</Badge>
                      <span className="text-[11px] text-muted-foreground">{fmtDateShort(row.updated_at)}</span>
                    </div>
                    <Link
                      href={`/sub-domain/tenants/${row.tenant_id}`}
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {row.tenant_display_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.bot_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.url ?? row.file_name ?? "-"}</p>
                    <p className="text-[11px] text-red-600 dark:text-red-400">{row.file_search_error.slice(0, 120)}</p>
                  </div>
                ))}
              </div>

              {/* デスクトップ: テーブル */}
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>テナント / Bot</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>URL / ファイル名</TableHead>
                      <TableHead>エラー内容</TableHead>
                      <TableHead className="whitespace-nowrap">更新日時</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-normal text-xs">
                          <Link
                            href={`/sub-domain/tenants/${row.tenant_id}`}
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {row.tenant_display_name}
                          </Link>
                          <p className="text-muted-foreground">{row.bot_name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{row.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] text-xs">
                          <p className="truncate text-muted-foreground" title={row.url ?? row.file_name ?? ""}>
                            {row.url ?? row.file_name ?? "-"}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[260px] whitespace-normal text-[11px] text-red-600 dark:text-red-400">
                          {row.file_search_error.slice(0, 160)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(row.updated_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
