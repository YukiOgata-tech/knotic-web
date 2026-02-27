import Link from "next/link"

import { disableContractOverrideAction, setBotForceStopAction, setTenantForceStopAction, startImpersonationAction, upsertContractOverrideAction, upsertTenantMembershipAction } from "@/app/sub-domain/actions"
import { fetchPlatformTenantDetail } from "@/app/sub-domain/_lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ja-JP")
}

function fmtYen(value: number | null | undefined) {
  if (typeof value !== "number") return "-"
  return `¥${value.toLocaleString("ja-JP")}`
}

export default async function PlatformTenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant_id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { tenant_id } = await params
  const query = (await searchParams) ?? {}
  const noticeRaw = query.notice
  const errorRaw = query.error
  const notice = Array.isArray(noticeRaw) ? noticeRaw[0] : noticeRaw
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw

  const detail = await fetchPlatformTenantDetail(tenant_id)
  const redirectPath = `/sub-domain/tenants/${tenant_id}`

  return (
    <div className="grid gap-4">
      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>{detail.tenant.display_name}</span>
            <Link href="/sub-domain" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              一覧へ戻る
            </Link>
          </CardTitle>
          <CardDescription>
            slug: {detail.tenant.slug} / tenant_id: {detail.tenant.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {detail.tenant.force_stopped ? <Badge variant="destructive">Tenant停止中</Badge> : <Badge variant="outline">Tenant稼働中</Badge>}
            <form action={startImpersonationAction}>
              <input type="hidden" name="tenant_id" value={tenant_id} />
              <input type="hidden" name="redirect_to" value={redirectPath} />
              <Button type="submit" variant="outline" size="sm">代理閲覧を開始</Button>
            </form>
          </div>
          {notice ? <p className="rounded-md border border-emerald-300/40 bg-emerald-100/60 px-3 py-2 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-200">{notice}</p> : null}
          {error ? <p className="rounded-md border border-red-300/40 bg-red-100/60 px-3 py-2 text-red-900 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">{error}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-black/10 p-3 dark:border-white/10">
              <p className="text-xs text-muted-foreground">メンバー</p>
              <p className="text-lg font-semibold">{detail.memberships.filter((m) => m.is_active).length}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3 dark:border-white/10">
              <p className="text-xs text-muted-foreground">Bots</p>
              <p className="text-lg font-semibold">{detail.bots.length}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3 dark:border-white/10">
              <p className="text-xs text-muted-foreground">30日メッセージ</p>
              <p className="text-lg font-semibold">{detail.usage30dMessages.toLocaleString("ja-JP")}</p>
            </div>
            <div className="rounded-md border border-black/10 p-3 dark:border-white/10">
              <p className="text-xs text-muted-foreground">30日tokens_out</p>
              <p className="text-lg font-semibold">{detail.usage30dTokensOut.toLocaleString("ja-JP")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle>契約情報</CardTitle>
            <CardDescription>Stripe契約と手動オーバーライドを併記</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="rounded-md border border-black/10 p-3 dark:border-white/10">
              <p className="mb-1 text-xs text-muted-foreground">Stripe</p>
              {detail.tenant.subscription ? (
                <div className="space-y-1">
                  <Badge variant="outline">{detail.tenant.subscription.status}</Badge>
                  <p>{detail.tenant.subscription.plan_name ?? detail.tenant.subscription.plan_code ?? "-"}</p>
                  <p>{fmtYen(detail.tenant.subscription.monthly_price_jpy)} / 月</p>
                  <p>更新: {fmtDate(detail.tenant.subscription.current_period_end)}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Stripe契約なし</p>
              )}
            </div>

            <div className="rounded-md border border-black/10 p-3 dark:border-white/10">
              <p className="mb-1 text-xs text-muted-foreground">Override</p>
              {detail.tenant.override ? (
                <div className="space-y-1">
                  <Badge variant={detail.tenant.override.is_active ? "default" : "outline"}>{detail.tenant.override.billing_mode}</Badge>
                  <p>{detail.tenant.override.plan_name ?? detail.tenant.override.plan_code ?? "-"}</p>
                  <p>{fmtYen(detail.tenant.override.monthly_price_jpy)} / 月</p>
                  <p>status: {detail.tenant.override.status}</p>
                  <p>from: {fmtDate(detail.tenant.override.effective_from)}</p>
                  <p>until: {fmtDate(detail.tenant.override.effective_until)}</p>
                  <p>updated: {fmtDate(detail.tenant.override.updated_at)}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">未設定</p>
              )}
            </div>

            <form action={upsertContractOverrideAction} className="grid gap-2 border-t border-black/10 pt-4 dark:border-white/10">
              <input type="hidden" name="redirect_to" value={redirectPath} />
              <input type="hidden" name="tenant_id" value={tenant_id} />
              <label className="text-xs text-muted-foreground">plan_id</label>
              <select
                name="plan_id"
                required
                defaultValue={detail.tenant.override?.plan_id ? String(detail.tenant.override.plan_id) : ""}
                className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
              >
                <option value="" disabled>プランを選択</option>
                {detail.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} ({plan.code}) - {fmtYen(plan.monthly_price_jpy)}</option>
                ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">status</label>
                  <select name="status" defaultValue={detail.tenant.override?.status ?? "active"} className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900">
                    {["trialing", "active", "past_due", "unpaid", "canceled", "paused", "incomplete"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">billing_mode</label>
                  <select name="billing_mode" defaultValue={detail.tenant.override?.billing_mode ?? "bank_transfer"} className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900">
                    <option value="stripe">stripe</option>
                    <option value="bank_transfer">bank_transfer</option>
                    <option value="invoice">invoice</option>
                    <option value="manual">manual</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input name="effective_from" placeholder="effective_from (ISO)" defaultValue={detail.tenant.override?.effective_from ?? ""} />
                <Input name="effective_until" placeholder="effective_until (ISO)" defaultValue={detail.tenant.override?.effective_until ?? ""} />
              </div>
              <Textarea name="notes" rows={3} defaultValue={detail.tenant.override?.notes ?? ""} placeholder="契約メモ" />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked={Boolean(detail.tenant.override?.is_active ?? true)} className="size-4" />
                overrideを有効化
              </label>
              <Button type="submit">Overrideを保存</Button>
            </form>

            <div className="rounded-md border border-black/10 p-3 dark:border-white/10">
              <p className="mb-2 text-xs text-muted-foreground">テナント強制停止</p>
              <p className="mb-2 text-xs text-muted-foreground">現在: {detail.tenant.force_stopped ? "停止中" : "稼働中"}</p>
              <form action={setTenantForceStopAction} className="grid gap-2">
                <input type="hidden" name="redirect_to" value={redirectPath} />
                <input type="hidden" name="tenant_id" value={tenant_id} />
                <Input name="reason" placeholder="停止理由（任意）" defaultValue={detail.tenant.force_stop_reason ?? ""} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={Boolean(detail.tenant.force_stopped)} className="size-4" />
                  tenantを強制停止する
                </label>
                <Button type="submit" variant="outline">テナント停止状態を更新</Button>
              </form>
            </div>

            <form action={disableContractOverrideAction}>
              <input type="hidden" name="redirect_to" value={redirectPath} />
              <input type="hidden" name="tenant_id" value={tenant_id} />
              <Button type="submit" variant="outline">Overrideを無効化</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle>ユーザー権限</CardTitle>
            <CardDescription>tenant_memberships の編集</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>作成日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.memberships.map((m) => (
                  <TableRow key={`${m.user_id}-${m.created_at}`}>
                    <TableCell className="whitespace-normal">
                      <p>{m.user_email ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">{m.user_id}</p>
                    </TableCell>
                    <TableCell>{m.role}</TableCell>
                    <TableCell>{m.is_active ? "true" : "false"}</TableCell>
                    <TableCell>{fmtDate(m.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <form action={upsertTenantMembershipAction} className="grid gap-2 border-t border-black/10 pt-4 dark:border-white/10">
              <input type="hidden" name="redirect_to" value={redirectPath} />
              <input type="hidden" name="tenant_id" value={tenant_id} />
              <Input name="user_email" type="email" placeholder="user@example.com" required />
              <select name="role" defaultValue="editor" className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900">
                <option value="editor">editor</option>
                <option value="reader">reader</option>
              </select>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked className="size-4" />
                membershipを有効化
              </label>
              <Button type="submit">ユーザー権限を保存</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>Bots</CardTitle>
          <CardDescription>テナント配下のBot一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>public_id</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>公開</TableHead>
                <TableHead>access_mode</TableHead>
                <TableHead>停止</TableHead>
                <TableHead>作成日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.bots.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>{bot.name}</TableCell>
                  <TableCell>{bot.public_id}</TableCell>
                  <TableCell>{bot.status}</TableCell>
                  <TableCell>{bot.is_public ? "public" : "private"}</TableCell>
                  <TableCell>{bot.access_mode ?? "-"}</TableCell>
                  <TableCell className="min-w-[240px]">
                    <form action={setBotForceStopAction} className="grid gap-1">
                      <input type="hidden" name="redirect_to" value={redirectPath} />
                      <input type="hidden" name="tenant_id" value={tenant_id} />
                      <input type="hidden" name="bot_id" value={bot.id} />
                      <Input name="reason" placeholder="理由" defaultValue={bot.force_stop_reason ?? ""} className="h-8 text-xs" />
                      <label className="inline-flex items-center gap-1 text-xs">
                        <input type="checkbox" name="enabled" defaultChecked={Boolean(bot.force_stopped)} className="size-3" />停止
                      </label>
                      <button type="submit" className="rounded border border-black/15 px-2 py-1 text-xs dark:border-white/20">更新</button>
                    </form>
                  </TableCell>
                  <TableCell>{fmtDate(bot.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
