import { testAuditLogAction } from "@/app/console/actions"
import { firstParam } from "@/app/console/_lib/ui"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchAuditLogs, requireConsoleContext } from "@/app/console/_lib/data"
import { getTenantPlanSnapshot } from "@/lib/billing/limits"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuditLogList } from "@/app/console/audit/audit-log-list"
import { AuditExportButton } from "@/app/console/audit/audit-export-button"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const ACTION_OPTIONS = [
  "",
  "bot.create",
  "bot.public.toggle",
  "bot.identity.update",
  "bot.hosted_config.update",
  "source.url.add",
  "source.pdf.add",
  "indexing.queue",
  "widget.token.rotate",
  "widget.allowed_origins.update",
  "api_key.create",
  "api_key.revoke",
  "audit.test.write",
  "tenant.ai_settings.update",
]

const TARGET_OPTIONS = ["", "tenant", "bot", "source", "bot_public_token", "tenant_api_key"]

export default async function ConsoleAuditPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)
  const action = firstParam(params.action) ?? ""
  const targetType = firstParam(params.target_type) ?? ""

  const { membership } = await requireConsoleContext()
  if (!membership) return null

  const plan = await getTenantPlanSnapshot(membership.tenant_id).catch(() => null)
  const retentionDays = plan?.planCode === "lite" ? 7 : 30

  const { rows, error: auditError } = await fetchAuditLogs(membership.tenant_id, {
    action: action || undefined,
    targetType: targetType || undefined,
    limit: 150,
  })

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} />

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>監査ログ</CardTitle>
              <CardDescription>運用操作の証跡を時系列で確認できます。</CardDescription>
            </div>
            <AuditExportButton action={action || undefined} targetType={targetType || undefined} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <form action={testAuditLogAction} className="rounded-lg border border-black/20 p-3 text-sm dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/audit" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                監査ログ書き込みテスト: 押下すると `audit.test.write` を1件作成し、結果を通知します。
              </p>
              <button
                type="submit"
                className="rounded-md border border-black/15 px-3 py-2 text-xs hover:bg-slate-50 dark:border-white/15 dark:hover:bg-slate-800"
              >
                監査ログテスト実行
              </button>
            </div>
          </form>

          <form className="grid gap-2 rounded-lg border border-black/20 p-3 text-sm dark:border-white/10 md:grid-cols-3">
            <input type="hidden" name="" value="" />
            <label className="grid gap-1">
              <span>Action</span>
              <select
                name="action"
                defaultValue={action}
                className="rounded-md border border-black/15 bg-white px-3 py-2 text-slate-900 [color-scheme:light] dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]"
              >
                {ACTION_OPTIONS.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value || "all"}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span>Target</span>
              <select
                name="target_type"
                defaultValue={targetType}
                className="rounded-md border border-black/15 bg-white px-3 py-2 text-slate-900 [color-scheme:light] dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]"
              >
                {TARGET_OPTIONS.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value || "all"}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" className="rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-slate-50 dark:border-white/15 dark:hover:bg-slate-800">
                絞り込み
              </button>
            </div>
          </form>

          {auditError ? (
            <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              監査ログの読み込みに失敗しました。しばらく時間をおいて再試行するか、サポートにお問い合わせください。
            </p>
          ) : null}

          <p className="text-right text-[11px] text-muted-foreground">
            現在のプランでは過去 <span className="font-medium">{retentionDays}日間</span> のログを保持します。
          </p>

          <AuditLogList rows={rows} />
        </CardContent>
      </Card>
    </div>
  )
}
