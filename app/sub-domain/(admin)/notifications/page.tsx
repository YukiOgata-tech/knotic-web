import Link from "next/link"

import {
  clearNotificationAction,
  clearAllNotificationsForTenantAction,
  deleteNotificationAction,
} from "@/app/sub-domain/actions"
import { requirePlatformAdminContext } from "@/app/sub-domain/_lib/data"
import { ConfirmSubmitButton } from "@/app/sub-domain/_components/confirm-submit-button"
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

function LevelBadge({ level }: { level: string }) {
  if (level === "critical") return <Badge variant="destructive">critical</Badge>
  if (level === "warning") return <Badge className="bg-amber-500 text-white">warning</Badge>
  return <Badge variant="secondary">info</Badge>
}

type NotificationRow = {
  id: string
  tenant_id: string
  level: string
  kind: string
  title: string
  message: string
  created_at: string
  read_at: string | null
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  await requirePlatformAdminContext()

  const params = (await searchParams) ?? {}
  const notice = Array.isArray(params.notice) ? params.notice[0] : (params.notice ?? null)
  const error = Array.isArray(params.error) ? params.error[0] : (params.error ?? null)
  const levelFilter = Array.isArray(params.level) ? params.level[0] : (params.level ?? "all")
  const unreadOnly = (Array.isArray(params.unread) ? params.unread[0] : (params.unread ?? "")) === "1"
  const pageRaw = Array.isArray(params.page) ? params.page[0] : (params.page ?? "1")
  const page = Math.max(1, Number(pageRaw) || 1)
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const admin = createAdminClient()

  let query = admin
    .from("tenant_notifications")
    .select("id, tenant_id, level, kind, title, message, created_at, read_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (levelFilter !== "all") query = query.eq("level", levelFilter)
  if (unreadOnly) query = query.is("read_at", null)

  const { data: notifsRaw, count } = await query
  const notifs = (notifsRaw ?? []) as NotificationRow[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  // テナント名をまとめて取得
  const tenantIds = [...new Set(notifs.map((n) => n.tenant_id))]
  const tenantNameMap = new Map<string, string>()
  if (tenantIds.length > 0) {
    const { data: tenants } = await admin
      .from("tenants")
      .select("id, slug, display_name")
      .in("id", tenantIds)
    for (const t of tenants ?? []) {
      tenantNameMap.set(t.id, `${t.display_name}`)
    }
  }

  // テナントごとの未読件数（一括既読ボタン用）
  const unreadByTenant = new Map<string, number>()
  for (const n of notifs) {
    if (!n.read_at) unreadByTenant.set(n.tenant_id, (unreadByTenant.get(n.tenant_id) ?? 0) + 1)
  }

  function buildUrl(overrides: Record<string, string | number>) {
    const qs = new URLSearchParams()
    if (levelFilter !== "all") qs.set("level", levelFilter)
    if (unreadOnly) qs.set("unread", "1")
    qs.set("page", String(page))
    for (const [k, v] of Object.entries(overrides)) qs.set(k, String(v))
    return `/sub-domain/notifications?${qs.toString()}`
  }

  return (
    <div className="grid gap-4">
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>テナント通知一覧</CardTitle>
          <CardDescription>
            Bot上限・メッセージ上限超過・支払い失敗など、各テナントに発火した通知を確認・管理できます。
          </CardDescription>
        </CardHeader>

        {(notice || error) ? (
          <CardContent className="pb-3 pt-0">
            {notice ? (
              <p className="rounded-md border border-emerald-300/40 bg-emerald-100/60 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-200">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md border border-red-300/40 bg-red-100/60 px-3 py-2 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </p>
            ) : null}
          </CardContent>
        ) : null}

        <CardContent className="grid gap-3 pb-3">
          {/* フィルター */}
          <div className="flex flex-wrap gap-2">
            {(["all", "critical", "warning", "info"] as const).map((lv) => (
              <Button
                key={lv}
                asChild
                size="sm"
                variant={levelFilter === lv ? "default" : "outline"}
              >
                <Link href={buildUrl({ level: lv, page: 1 })}>
                  {lv === "all" ? "全て" : lv}
                </Link>
              </Button>
            ))}
            <Button
              asChild
              size="sm"
              variant={unreadOnly ? "default" : "outline"}
            >
              <Link href={`/sub-domain/notifications?level=${levelFilter}&unread=${unreadOnly ? "0" : "1"}&page=1`}>
                未読のみ
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString("ja-JP")} 件 · ページ {page} / {totalPages}
          </p>
        </CardContent>

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {notifs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              通知がありません。
            </p>
          ) : (
            <>
              {/* モバイル: カードリスト */}
              <div className="grid gap-2 p-4 sm:hidden">
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-4 ${n.read_at ? "border-black/10 bg-white/80 dark:border-white/10 dark:bg-slate-900/40" : "border-black/15 bg-white dark:border-white/15 dark:bg-slate-900/70"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <LevelBadge level={n.level} />
                        {!n.read_at ? <span className="size-2 rounded-full bg-blue-500 shrink-0" /> : null}
                      </div>
                      <p className="text-[11px] text-muted-foreground shrink-0">{fmtDate(n.created_at)}</p>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      {tenantNameMap.get(n.tenant_id) ?? n.tenant_id}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {!n.read_at ? (
                        <form action={clearNotificationAction}>
                          <input type="hidden" name="id" value={n.id} />
                          <Button type="submit" variant="outline" size="sm" className="h-7 text-xs">既読</Button>
                        </form>
                      ) : null}
                      <form action={deleteNotificationAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <ConfirmSubmitButton
                          description="この通知を削除します。よろしいですか？"
                          confirmLabel="削除する"
                          destructive
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          削除
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>

              {/* デスクトップ: テーブル */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">レベル</TableHead>
                      <TableHead>テナント</TableHead>
                      <TableHead>タイトル / メッセージ</TableHead>
                      <TableHead className="w-[130px]">発生日時</TableHead>
                      <TableHead className="w-[80px]">既読</TableHead>
                      <TableHead className="w-[140px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifs.map((n) => (
                      <TableRow key={n.id} className={n.read_at ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {!n.read_at ? <span className="size-1.5 rounded-full bg-blue-500 shrink-0" /> : null}
                            <LevelBadge level={n.level} />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Link
                            href={`/sub-domain/tenants/${n.tenant_id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {tenantNameMap.get(n.tenant_id) ?? n.tenant_id}
                          </Link>
                          {unreadByTenant.get(n.tenant_id) && !n.read_at ? (
                            <form action={clearAllNotificationsForTenantAction} className="mt-1">
                              <input type="hidden" name="tenant_id" value={n.tenant_id} />
                              <button type="submit" className="text-[10px] text-muted-foreground hover:text-foreground underline">
                                このテナントを一括既読
                              </button>
                            </form>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{n.kind}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{fmtDate(n.created_at)}</TableCell>
                        <TableCell className="text-xs">
                          {n.read_at ? (
                            <span className="text-muted-foreground">既読</span>
                          ) : (
                            <span className="font-medium text-blue-600 dark:text-blue-400">未読</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {!n.read_at ? (
                              <form action={clearNotificationAction}>
                                <input type="hidden" name="id" value={n.id} />
                                <Button type="submit" variant="outline" size="sm" className="h-7 text-xs">
                                  既読にする
                                </Button>
                              </form>
                            ) : null}
                            <form action={deleteNotificationAction}>
                              <input type="hidden" name="id" value={n.id} />
                              <ConfirmSubmitButton
                                description="この通知を削除します。よろしいですか？"
                                confirmLabel="削除する"
                                destructive
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                              >
                                削除
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </TableCell>
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
