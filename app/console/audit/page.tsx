import { firstParam, fmtDate } from "@/app/console/_lib/ui"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchAuditLogs, requireConsoleContext } from "@/app/console/_lib/data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const ACTION_OPTIONS = [
  "",
  "bot.create",
  "bot.public.toggle",
  "bot.hosted_config.update",
  "source.url.add",
  "source.pdf.add",
  "indexing.queue",
  "widget.token.rotate",
  "widget.allowed_origins.update",
  "api_key.create",
  "api_key.revoke",
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
          <CardTitle>監査ログ</CardTitle>
          <CardDescription>運用操作の証跡を時系列で確認できます。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
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
              監査ログテーブル未適用です。`supabase/patch-20260226-audit-and-ops.sql` を実行してください。
            </p>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs">{fmtDate(row.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.target_type}
                    {row.target_id ? ` / ${row.target_id}` : ""}
                  </TableCell>
                  <TableCell className="text-xs">{row.actor_user_id ?? "-"}</TableCell>
                  <TableCell className="max-w-[360px] text-xs text-muted-foreground">
                    <code className="whitespace-pre-wrap break-all">
                      {JSON.stringify(row.after_json ?? row.metadata ?? {})}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!auditError && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">条件に一致する監査イベントはありません。</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
