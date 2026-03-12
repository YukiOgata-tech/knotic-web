import Link from "next/link"

import { fetchAuditLogs } from "@/app/sub-domain/_lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ACTION_PREFIXES = [
  { value: "", label: "すべて" },
  { value: "platform.", label: "platform.*" },
  { value: "console.", label: "console.*" },
  { value: "bot.", label: "bot.*" },
  { value: "source.", label: "source.*" },
  { value: "billing.", label: "billing.*" },
]

function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ja-JP")
}

function actionBadgeVariant(action: string): "default" | "destructive" | "secondary" | "outline" {
  if (action.includes("force_stop") || action.includes("delete") || action.includes("revoke")) return "destructive"
  if (action.includes("platform.")) return "default"
  return "secondary"
}

const PER_PAGE = 50

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const tenantId = Array.isArray(params.tenant_id) ? params.tenant_id[0] : (params.tenant_id ?? "")
  const actionPrefix = Array.isArray(params.action) ? params.action[0] : (params.action ?? "")
  const pageRaw = Array.isArray(params.page) ? params.page[0] : (params.page ?? "1")
  const page = Math.max(1, Number(pageRaw) || 1)

  const { rows, total } = await fetchAuditLogs({
    tenantId: tenantId || undefined,
    actionPrefix: actionPrefix || undefined,
    page,
    perPage: PER_PAGE,
  })

  const totalPages = Math.ceil(total / PER_PAGE)

  function buildQuery(overrides: Record<string, string | number>) {
    const q = new URLSearchParams()
    if (tenantId) q.set("tenant_id", tenantId)
    if (actionPrefix) q.set("action", actionPrefix)
    q.set("page", String(page))
    for (const [k, v] of Object.entries(overrides)) {
      q.set(k, String(v))
    }
    return `/sub-domain/audit-logs?${q.toString()}`
  }

  return (
    <div className="grid gap-4">
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>監査ログ</CardTitle>
          <CardDescription>
            全テナント横断の操作ログ。platform.* はプラットフォーム管理操作、console.* はテナント操作を示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" action="/sub-domain/audit-logs" className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">tenant_id（任意）</label>
              <Input name="tenant_id" defaultValue={tenantId} placeholder="UUID" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">アクション種別</label>
              <select
                name="action"
                defaultValue={actionPrefix}
                className="h-10 rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
              >
                {ACTION_PREFIXES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <input type="hidden" name="page" value="1" />
            <Button type="submit">フィルタ適用</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/sub-domain/audit-logs">クリア</Link>
            </Button>
          </form>

          <div className="mt-3 text-xs text-muted-foreground">
            全 {total.toLocaleString("ja-JP")} 件 / ページ {page} / {Math.max(1, totalPages)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">日時</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead>操作者</TableHead>
                  <TableHead>アクション</TableHead>
                  <TableHead>対象</TableHead>
                  <TableHead>詳細</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      ログが見つかりません
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(row.created_at)}
                      </TableCell>
                      <TableCell className="whitespace-normal text-xs">
                        {row.tenant_slug ? (
                          <Link
                            href={`/sub-domain/tenants/${row.tenant_id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {row.tenant_slug}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{row.tenant_id.slice(0, 8)}…</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal text-xs text-muted-foreground">
                        {row.actor_email ?? (row.actor_user_id ? `${row.actor_user_id.slice(0, 8)}…` : "system")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionBadgeVariant(row.action)} className="whitespace-nowrap text-[11px]">
                          {row.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal text-xs">
                        <p className="text-muted-foreground">{row.target_type}</p>
                        {row.target_id ? (
                          <p className="font-mono text-[11px]">{row.target_id.slice(0, 12)}…</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[200px] whitespace-normal text-[11px] text-muted-foreground">
                        {Object.keys(row.metadata).length > 0
                          ? JSON.stringify(row.metadata).slice(0, 120)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildQuery({ page: page - 1 })}>← 前へ</Link>
            </Button>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildQuery({ page: page + 1 })}>次へ →</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
