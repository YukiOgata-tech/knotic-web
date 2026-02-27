import { Activity, AlertTriangle, Database, MessagesSquare, ShieldCheck } from "lucide-react"

import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchOperationSummary, requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam, fmtDate } from "@/app/console/_lib/ui"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function toRateLabel(value: number | null) {
  if (value == null) return "-"
  return `${Math.round(value)}%`
}

function toneByRate(value: number | null) {
  if (value == null) return "bg-slate-400"
  if (value >= 100) return "bg-red-500"
  if (value >= 80) return "bg-amber-500"
  return "bg-emerald-500"
}

export default async function ConsoleOperationsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)

  const { membership } = await requireConsoleContext()
  if (!membership) return null

  const ops = await fetchOperationSummary(membership.tenant_id)

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>メッセージ（本日）</CardDescription>
            <CardTitle className="text-2xl">{ops.messagesToday.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>メッセージ（7日）</CardDescription>
            <CardTitle className="text-2xl">{ops.messages7d.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>Bot稼働</CardDescription>
            <CardTitle className="text-2xl">{ops.botReady} / {ops.botTotal}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>未読通知</CardDescription>
            <CardTitle className="text-2xl">{ops.unreadNotifications}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessagesSquare className="size-4" />
              月間メッセージ利用率
            </CardTitle>
            <CardDescription>
              今月 {ops.messages30d.toLocaleString()} / 上限 {ops.monthlyLimit?.toLocaleString() ?? "-"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="h-2 rounded bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-2 rounded ${toneByRate(ops.monthlyUsageRate)}`}
                style={{ width: `${Math.min(100, Math.max(0, ops.monthlyUsageRate ?? 0))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">利用率: {toRateLabel(ops.monthlyUsageRate)}</p>
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4" />
              ストレージ利用率
            </CardTitle>
            <CardDescription>
              使用量 {ops.storageUsedMb.toLocaleString()} MB / 上限 {ops.storageLimitMb?.toLocaleString() ?? "-"} MB
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="h-2 rounded bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-2 rounded ${toneByRate(ops.storageUsageRate)}`}
                style={{ width: `${Math.min(100, Math.max(0, ops.storageUsageRate ?? 0))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">利用率: {toRateLabel(ops.storageUsageRate)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              インデックスジョブ（過去7日）
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>Queued: {ops.jobsQueued}</p>
            <p>Running: {ops.jobsRunning}</p>
            <p>Done: {ops.jobsDone7d}</p>
            <p>Failed: {ops.jobsFailed7d}</p>
            <p>Source失敗件数: {ops.sourceFailed}</p>
            <p>Source処理中件数: {ops.sourceRunning}</p>
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" />
              直近の監査イベント
            </CardTitle>
            <CardDescription>設定変更・公開切替・トークン操作などの記録</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {ops.auditError ? (
              <p className="rounded-md bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                監査ログテーブル未適用です。`supabase/patch-20260226-audit-and-ops.sql` を実行してください。
              </p>
            ) : null}
            {ops.recentAudit.map((event) => (
              <div key={event.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{event.action}</Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(event.created_at)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  target: {event.target_type}
                  {event.target_id ? ` / ${event.target_id}` : ""}
                </p>
              </div>
            ))}
            {!ops.auditError && ops.recentAudit.length === 0 ? (
              <p className="text-xs text-muted-foreground">監査イベントはまだありません。</p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {(ops.monthlyUsageRate ?? 0) >= 80 || (ops.storageUsageRate ?? 0) >= 80 ? (
        <Card className="border-amber-300/60 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" />
              運用アラート
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 dark:text-amber-200">
            <p>月間メッセージまたはストレージの利用率が80%を超えています。上限到達前に運用調整を推奨します。</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
