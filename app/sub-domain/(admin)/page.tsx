import Link from "next/link"
import { Plus } from "lucide-react"

import {
  startImpersonationAction,
  upsertContractOverrideAction,
  upsertTenantMembershipAction,
  disableContractOverrideAction,
} from "@/app/sub-domain/actions"
import { fetchPlatformDashboard } from "@/app/sub-domain/_lib/data"
import { ConfirmSubmitButton } from "@/app/sub-domain/_components/confirm-submit-button"
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

function fmtDateShort(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("ja-JP")
}

function fmtYen(value: number | null | undefined) {
  if (typeof value !== "number") return "-"
  return `¥${value.toLocaleString("ja-JP")}`
}

export default async function PlatformAdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const qRaw = params.q
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw
  const noticeRaw = params.notice
  const errorRaw = params.error
  const notice = Array.isArray(noticeRaw) ? noticeRaw[0] : noticeRaw
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw

  const { tenants, plans } = await fetchPlatformDashboard(q)

  return (
    <div className="grid gap-4">
      {/* ── ヘッダー & 検索 ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>Platform Console</CardTitle>
          <CardDescription>
            契約者一覧、手動契約（Stripe非依存）、契約者ユーザー権限の付与を管理します。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
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
          <form className="flex flex-col gap-2 sm:flex-row sm:items-end" method="get">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                契約者検索（slug / display_name）
              </label>
              <Input name="q" defaultValue={q ?? ""} placeholder="例: acme" />
            </div>
            <Button type="submit" className="w-full sm:w-auto">検索</Button>
          </form>
        </CardContent>
      </Card>

      {/* ── テナント一覧 ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Tenants</CardTitle>
              <CardDescription>Stripe契約と手動オーバーライドの両方を同時表示します。</CardDescription>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href="/sub-domain/tenants/new">
                <Plus className="size-4" />
                テナントを作成
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* ── モバイル: カードリスト ── */}
          <div className="grid gap-2 p-4 sm:hidden">
            {tenants.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">テナントが見つかりません</p>
            ) : (
              tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{tenant.display_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{tenant.slug}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      {!tenant.active ? <Badge variant="secondary" className="text-[10px]">無効</Badge> : null}
                      {tenant.force_stopped ? <Badge variant="destructive" className="text-[10px]">停止中</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-black/10 p-2 dark:border-white/10">
                      <p className="mb-1 text-[10px] text-muted-foreground">Stripe</p>
                      {tenant.subscription ? (
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="text-[10px]">{tenant.subscription.status}</Badge>
                          <p className="text-xs">{tenant.subscription.plan_name ?? tenant.subscription.plan_code ?? "-"}</p>
                          <p className="text-[11px] text-muted-foreground">{fmtYen(tenant.subscription.monthly_price_jpy)}/月</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">なし</p>
                      )}
                    </div>
                    <div className="rounded-lg border border-black/10 p-2 dark:border-white/10">
                      <p className="mb-1 text-[10px] text-muted-foreground">Override</p>
                      {tenant.override ? (
                        <div className="space-y-0.5">
                          <Badge variant={tenant.override.is_active ? "default" : "outline"} className="text-[10px]">
                            {tenant.override.billing_mode}
                          </Badge>
                          <p className="text-xs">{tenant.override.plan_name ?? tenant.override.plan_code ?? "-"}</p>
                          <p className="text-[11px] text-muted-foreground">{tenant.override.status}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">未設定</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground">
                      メンバー {tenant.member_count} · {fmtDateShort(tenant.created_at)}
                    </p>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/sub-domain/tenants/${tenant.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        詳細を開く →
                      </Link>
                      <form action={startImpersonationAction}>
                        <input type="hidden" name="tenant_id" value={tenant.id} />
                        <input type="hidden" name="redirect_to" value="/sub-domain" />
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          代理閲覧
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── デスクトップ: テーブル ── */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>契約者</TableHead>
                  <TableHead>現契約</TableHead>
                  <TableHead>手動オーバーライド</TableHead>
                  <TableHead>メンバー数</TableHead>
                  <TableHead>作成日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="whitespace-normal">
                      <p className="font-medium">{tenant.display_name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{tenant.id}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/sub-domain/tenants/${tenant.id}`}
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          詳細を開く
                        </Link>
                        {!tenant.active ? <Badge variant="secondary">無効</Badge> : null}
                        {tenant.force_stopped ? <Badge variant="destructive">強制停止中</Badge> : null}
                      </div>
                      <form action={startImpersonationAction} className="mt-2">
                        <input type="hidden" name="tenant_id" value={tenant.id} />
                        <input type="hidden" name="redirect_to" value="/sub-domain" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20"
                        >
                          代理閲覧を開始
                        </button>
                      </form>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {tenant.subscription ? (
                        <div className="space-y-1 text-xs">
                          <Badge variant="outline">{tenant.subscription.status}</Badge>
                          <p>{tenant.subscription.plan_name ?? tenant.subscription.plan_code ?? "-"}</p>
                          <p>{fmtYen(tenant.subscription.monthly_price_jpy)} / 月</p>
                          <p>更新: {fmtDate(tenant.subscription.current_period_end)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Stripe契約なし</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {tenant.override ? (
                        <div className="space-y-1 text-xs">
                          <Badge variant={tenant.override.is_active ? "default" : "outline"}>
                            {tenant.override.billing_mode}
                          </Badge>
                          <p>{tenant.override.plan_name ?? tenant.override.plan_code ?? "-"}</p>
                          <p>{fmtYen(tenant.override.monthly_price_jpy)} / 月</p>
                          <p>status: {tenant.override.status}</p>
                          <p>until: {fmtDate(tenant.override.effective_until)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">未設定</span>
                      )}
                    </TableCell>
                    <TableCell>{tenant.member_count}</TableCell>
                    <TableCell>{fmtDate(tenant.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 手動契約・権限フォーム ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle>手動契約オーバーライド</CardTitle>
            <CardDescription>
              銀行振込/請求書契約など、Stripe外の運用でもプラン制御できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertContractOverrideAction} className="grid gap-3">
              <input type="hidden" name="redirect_to" value="/sub-domain" />
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">tenant_id</label>
                <Input name="tenant_id" placeholder="UUID" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">plan_id</label>
                <select
                  name="plan_id"
                  required
                  className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                  defaultValue=""
                >
                  <option value="" disabled>プランを選択</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.code}) - {fmtYen(plan.monthly_price_jpy)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">status</label>
                  <select
                    name="status"
                    defaultValue="active"
                    className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                  >
                    {["trialing", "active", "past_due", "unpaid", "canceled", "paused", "incomplete"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">billing_mode</label>
                  <select
                    name="billing_mode"
                    defaultValue="bank_transfer"
                    className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                  >
                    <option value="stripe">stripe</option>
                    <option value="bank_transfer">bank_transfer</option>
                    <option value="invoice">invoice</option>
                    <option value="manual">manual</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">effective_from (ISO)</label>
                  <Input name="effective_from" placeholder="2026-03-01T00:00:00+09:00" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">effective_until (ISO)</label>
                  <Input name="effective_until" placeholder="2026-04-01T00:00:00+09:00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">備考</label>
                <Textarea name="notes" rows={3} placeholder="契約メモ・請求条件" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked className="size-4" />
                overrideを有効化
              </label>
              <ConfirmSubmitButton description="この内容で契約オーバーライドを保存します。既存のオーバーライドがある場合は上書きされます。よろしいですか？">
                契約オーバーライドを保存
              </ConfirmSubmitButton>
            </form>

            <form
              action={disableContractOverrideAction}
              className="mt-4 grid gap-2 border-t border-black/20 pt-4 dark:border-white/10"
            >
              <input type="hidden" name="redirect_to" value="/sub-domain" />
              <label className="text-xs text-muted-foreground">tenant_id（無効化対象）</label>
              <Input name="tenant_id" placeholder="UUID" required />
              <ConfirmSubmitButton
                description="指定したテナントの契約オーバーライドを無効化します。プラン制限がStripeサブスクリプションに戻ります。よろしいですか？"
                confirmLabel="無効化する"
                destructive
                variant="outline"
              >
                このtenantのoverrideを無効化
              </ConfirmSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle>契約者ユーザー権限の付与</CardTitle>
            <CardDescription>
              Stripe契約状態に依存せず、契約者に console の editor/reader を付与します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertTenantMembershipAction} className="grid gap-3">
              <input type="hidden" name="redirect_to" value="/sub-domain" />
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">tenant_id</label>
                <Input name="tenant_id" placeholder="UUID" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">ユーザーEmail（登録済み）</label>
                <Input name="user_email" type="email" placeholder="user@example.com" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">role</label>
                <select
                  name="role"
                  defaultValue="editor"
                  className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                >
                  <option value="editor">editor (操作可能)</option>
                  <option value="reader">reader (閲覧のみ)</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked className="size-4" />
                membershipを有効化
              </label>
              <ConfirmSubmitButton description="指定したテナントにユーザーの権限を付与・更新します。既存メンバーシップがある場合は上書きされます。よろしいですか？">
                権限を保存
              </ConfirmSubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
