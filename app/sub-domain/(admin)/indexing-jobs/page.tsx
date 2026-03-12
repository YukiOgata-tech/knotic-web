import Link from "next/link"

import { fetchIndexingJobStats } from "@/app/sub-domain/_lib/data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ja-JP")
}

function fmtDuration(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return "-"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (Number.isNaN(ms) || ms < 0) return "-"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.round(ms / 60000)}m`
}

function statusBadge(status: string) {
  switch (status) {
    case "queued":
      return <Badge variant="secondary">queued</Badge>
    case "running":
      return <Badge className="bg-blue-500 text-white">running</Badge>
    case "completed":
      return <Badge className="bg-emerald-600 text-white">completed</Badge>
    case "failed":
      return <Badge variant="destructive">failed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default async function IndexingJobsPage() {
  const { rows, counts } = await fetchIndexingJobStats()

  const statusOrder = ["queued", "running", "failed", "completed"]

  return (
    <div className="grid gap-4">
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>インデックスジョブ監視</CardTitle>
          <CardDescription>
            直近7日間のステータス集計と最新100件のジョブ一覧。queued/running が滞留していないか確認してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statusOrder.map((status) => (
              <div key={status} className="rounded-md border border-black/20 p-3 dark:border-white/10">
                <p className="text-xs text-muted-foreground">{status}</p>
                <p className={`text-2xl font-semibold ${status === "failed" && (counts[status] ?? 0) > 0 ? "text-red-600 dark:text-red-400" : ""} ${status === "queued" && (counts[status] ?? 0) > 10 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                  {(counts[status] ?? 0).toLocaleString("ja-JP")}
                </p>
                <p className="text-[11px] text-muted-foreground">過去7日間</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>直近ジョブ（最新100件）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ステータス</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>依頼日時</TableHead>
                  <TableHead>所要時間</TableHead>
                  <TableHead>pages_indexed</TableHead>
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
                      <TableCell>{statusBadge(row.status)}</TableCell>
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
                          : row.started_at
                            ? "実行中"
                            : "-"}
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
    </div>
  )
}
