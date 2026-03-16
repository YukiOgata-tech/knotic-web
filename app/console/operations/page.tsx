import { runIndexingWorkerAction, queueIndexAction } from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, fetchOperationSummary, requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam, fmtDate } from "@/app/console/_lib/ui"
import { AuditPreviewModal } from "@/app/console/operations/audit-preview-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Activity, AlertTriangle, Database, MessagesSquare, ShieldCheck } from "lucide-react"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const ACTION_LABELS: Record<string, string> = {
  "bot.create": "Bot作成",
  "bot.public.toggle": "Bot公開設定変更",
  "bot.identity.update": "Bot情報更新",
  "bot.hosted_config.update": "Hosted設定更新",
  "source.url.add": "URLソース追加",
  "source.pdf.add": "PDFソース追加",
  "indexing.queue": "ナレッジ読み込み登録",
  "widget.token.rotate": "Widgetトークン再発行",
  "widget.allowed_origins.update": "Widget許可オリジン更新",
  "api_key.create": "APIキー発行",
  "api_key.revoke": "APIキー失効",
  "tenant.create": "テナント作成",
  "tenant.profile.update": "テナント情報更新",
  "tenant.ai_settings.update": "AI設定更新",
  "tenant.member.invite.create": "メンバー招待",
  "tenant.member.invite.revoke": "招待取り消し",
  "auth.email.update.requested": "メールアドレス変更申請",
  "auth.password.updated": "パスワード変更",
  "audit.test.write": "監査ログテスト",
  "platform.impersonation.start": "閲覧モード開始（管理者）",
  "platform.impersonation.stop": "閲覧モード終了（管理者）",
  "platform.tenant.force_stop.enable": "テナント強制停止（管理者）",
  "platform.tenant.force_stop.disable": "テナント強制停止解除（管理者）",
  "platform.bot.force_stop.enable": "Bot強制停止（管理者）",
  "platform.bot.force_stop.disable": "Bot強制停止解除（管理者）",
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

function formatMbFromBytes(bytes: number | null | undefined) {
  if (typeof bytes !== "number" || bytes <= 0) return "-"
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function ConsoleOperationsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)
  const issuedApiKey = firstParam(params.issued_api_key)
  const widgetToken = firstParam(params.widget_token)

  const { membership } = await requireConsoleContext()
  if (!membership) return null

  const [ops, data] = await Promise.all([
    fetchOperationSummary(membership.tenant_id),
    fetchConsoleData(membership.tenant_id),
  ])
  const isEditor = membership.role === "editor"

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} issuedApiKey={issuedApiKey} widgetToken={widgetToken} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>メッセージ（本日）</CardDescription>
            <CardTitle className="text-2xl">{ops.messagesToday.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>メッセージ（7日）</CardDescription>
            <CardTitle className="text-2xl">{ops.messages7d.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>Bot稼働</CardDescription>
            <CardTitle className="text-2xl">
              {ops.botReady} / {ops.botTotal}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>未読通知</CardDescription>
            <CardTitle className="text-2xl">{ops.unreadNotifications}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
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

        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
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
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              ナレッジ読み込み状況（過去7日）
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm font-medium sm:text-lg">
            <p>待機中: {ops.jobsQueued}</p>
            <p>実行中: {ops.jobsRunning}</p>
            <p>完了（7日）: {ops.jobsDone7d}</p>
            <p>失敗（7日）: {ops.jobsFailed7d}</p>
            <p>ソース失敗件数: {ops.sourceFailed}</p>
            <p>ソース処理中件数: {ops.sourceRunning}</p>
          </CardContent>
        </Card>

        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" />
              直近の監査イベント
            </CardTitle>
            <CardDescription>設定変更・公開切替・トークン操作などの記録（最新5件）</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {ops.auditError ? (
              <p className="rounded-md bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                監査ログの読み込みに失敗しました。サポートにお問い合わせください。
              </p>
            ) : null}
            {ops.recentAudit.map((event) => (
              <div
                key={event.id}
                className="rounded-md border border-black/20 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{ACTION_LABELS[event.action] ?? event.action}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {event.action}
                  </Badge>
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
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <AuditPreviewModal rows={ops.auditLast24h} auditError={ops.auditError} />
              <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                <Link href="/console/audit">監査ログページへ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>ソース運用（統合）</CardTitle>
          <CardDescription>
            全Botのソースデータを横断管理します。Botごとの追加は各Bot設定のAIタブで行えます。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-xl border border-black/20 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-slate-900/50">
            <p>
              現在のデータ使用量: {data.storageUsedMb.toLocaleString()} MB
              {data.currentPlan?.max_storage_mb ? ` / 上限 ${data.currentPlan.max_storage_mb.toLocaleString()} MB` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              上限超過時は新規PDF追加・ナレッジ更新が停止されます。不要ソースを整理して上限内へ戻してください。
            </p>
          </div>

          <form action={runIndexingWorkerAction} className="rounded-xl border border-black/20 p-4 dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/operations" />
            <h3 className="font-medium">ナレッジ手動読み込み</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              待機中のURLソースを1件読み込みます。
            </p>
            <Button type="submit" className="mt-3 rounded-full" disabled={!isEditor}>
              読み込みを実行
            </Button>
          </form>

          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Bot</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>サイズ</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sources.map((source) => {
                const bot = data.bots.find((item) => item.id === source.bot_id)
                return (
                  <TableRow key={source.id}>
                    <TableCell className="max-w-[320px] truncate">{source.url ?? source.file_name ?? "-"}</TableCell>
                    <TableCell>{bot?.name ?? "-"}</TableCell>
                    <TableCell>{source.type}</TableCell>
                    <TableCell>{formatMbFromBytes(source.file_size_bytes)}</TableCell>
                    <TableCell>{
                      source.status === "indexed" ? "読み込み済み" :
                      source.status === "queued" ? "待機中" :
                      source.status === "running" ? "処理中" :
                      source.status === "failed" ? "失敗" :
                      source.status === "pending" ? "保留中" :
                      source.status
                    }</TableCell>
                    <TableCell>
                      <form action={queueIndexAction}>
                        <input type="hidden" name="redirect_to" value="/console/operations" />
                        <input type="hidden" name="source_id" value={source.id} />
                        <input type="hidden" name="bot_id" value={source.bot_id ?? ""} />
                        <Button type="submit" size="sm" variant="outline" disabled={!isEditor}>
                          ナレッジを更新
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>

          <div className="grid gap-2 rounded-lg border border-black/20 p-3 text-xs text-muted-foreground dark:border-white/10">
            <p>BotごとのURL/PDF追加は各Bot設定画面の「AI設定」タブで行ってください。</p>
            <p>ここでは全ソース横断の監視とナレッジ更新を管理します。</p>
          </div>
        </CardContent>
      </Card>

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
