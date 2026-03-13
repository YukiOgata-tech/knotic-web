import Link from "next/link"
import { CreditCard, Mail } from "lucide-react"

import { TenantActiveToggle } from "@/app/sub-domain/_components/tenant-active-toggle"
import { OverrideActiveToggle } from "@/app/sub-domain/_components/override-active-toggle"

import {
  disableContractOverrideAction,
  inviteUserToTenantAction,
  setBotForceStopAction,
  setTenantForceStopAction,
  startImpersonationAction,
  upsertContractOverrideAction,
  upsertTenantMembershipAction,
} from "@/app/sub-domain/actions"
import { fetchPlatformTenantDetail } from "@/app/sub-domain/_lib/data"
import { ConfirmSubmitButton } from "@/app/sub-domain/_components/confirm-submit-button"
import { StripeCheckoutLink } from "@/app/sub-domain/_components/stripe-checkout-link"
import { TenantTabNav } from "@/app/sub-domain/_components/tenant-tab-nav"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const VALID_TABS = ["overview", "billing", "members", "bots"] as const
type Tab = (typeof VALID_TABS)[number]

export default async function PlatformTenantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant_id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { tenant_id } = await params
  const query = (await searchParams) ?? {}
  const notice = Array.isArray(query.notice) ? query.notice[0] : (query.notice ?? null)
  const error = Array.isArray(query.error) ? query.error[0] : (query.error ?? null)
  const tabRaw = Array.isArray(query.tab) ? query.tab[0] : (query.tab ?? "overview")
  const tab: Tab = (VALID_TABS as readonly string[]).includes(tabRaw) ? (tabRaw as Tab) : "overview"

  const detail = await fetchPlatformTenantDetail(tenant_id)
  const redirectPath = `/sub-domain/tenants/${tenant_id}`

  return (
    <div className="grid gap-4">
      {/* ── テナントヘッダー ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                <Link href="/sub-domain" className="hover:underline">管理コンソール</Link>
                <span className="mx-1">/</span>
                テナント詳細
              </p>
              <h1 className="mt-1 truncate text-xl font-bold">{detail.tenant.display_name}</h1>
              <p className="mt-0.5 break-all text-xs text-muted-foreground">
                {detail.tenant.slug}
                <span className="mx-1.5 opacity-40">·</span>
                <span className="font-mono">{detail.tenant.id}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {detail.tenant.active ? (
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-700 dark:text-emerald-400">有効</Badge>
              ) : (
                <Badge variant="secondary">無効</Badge>
              )}
              {detail.tenant.force_stopped ? <Badge variant="destructive">強制停止中</Badge> : null}
              <form action={startImpersonationAction}>
                <input type="hidden" name="tenant_id" value={tenant_id} />
                <input type="hidden" name="redirect_to" value={redirectPath} />
                <ConfirmSubmitButton
                  variant="outline"
                  size="sm"
                  description="このテナントとして代理閲覧を開始します。操作は読み取り専用です（1時間で自動終了）。よろしいですか？"
                  confirmLabel="開始する"
                >
                  代理閲覧
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        </CardHeader>

        {/* KPI */}
        <CardContent className="grid gap-3 pb-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "アクティブメンバー", value: detail.memberships.filter((m) => m.is_active).length },
              { label: "Bots", value: detail.bots.length },
              { label: "30日メッセージ", value: detail.usage30dMessages.toLocaleString("ja-JP") },
              { label: "30日トークン(out)", value: detail.usage30dTokensOut.toLocaleString("ja-JP") },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-black/10 p-3 dark:border-white/10">
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {(notice || error) && (
            <div className="grid gap-2">
              {notice && (
                <p className="rounded-md border border-emerald-300/40 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
                  {notice}
                </p>
              )}
              {error && (
                <p className="rounded-md border border-red-300/40 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </p>
              )}
            </div>
          )}
        </CardContent>

        {/* タブナビ */}
        <div className="mt-4">
          <TenantTabNav tenantId={tenant_id} current={tab} />
        </div>
      </Card>

      {/* ── タブコンテンツ ── */}

      {/* 概要タブ */}
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* テナント強制停止 */}
          <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">テナント強制停止</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">現在の状態:</span>
                {detail.tenant.force_stopped ? (
                  <Badge variant="destructive">停止中</Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">稼働中</Badge>
                )}
              </div>
              {detail.tenant.force_stop_reason && (
                <p className="text-xs text-muted-foreground">
                  理由: {detail.tenant.force_stop_reason}
                </p>
              )}
              <form action={setTenantForceStopAction} className="grid gap-2">
                <input type="hidden" name="redirect_to" value={`${redirectPath}?tab=overview`} />
                <input type="hidden" name="tenant_id" value={tenant_id} />
                <Input name="reason" placeholder="停止理由（任意）" defaultValue={detail.tenant.force_stop_reason ?? ""} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={Boolean(detail.tenant.force_stopped)} className="size-4" />
                  tenantを強制停止する
                </label>
                <ConfirmSubmitButton
                  variant="outline"
                  destructive={!detail.tenant.force_stopped}
                  description={
                    detail.tenant.force_stopped
                      ? "テナントの強制停止を解除します。全ボットの応答が再開されます。よろしいですか？"
                      : "テナントを強制停止します。即座に全ボットの応答がブロックされます。よろしいですか？"
                  }
                  confirmLabel="更新する"
                  className="w-fit"
                >
                  停止状態を更新
                </ConfirmSubmitButton>
              </form>
            </CardContent>
          </Card>

          {/* テナント有効化状態 */}
          <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">テナント有効化状態</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-xs text-muted-foreground">
                有効 = 稼働中、無効 = 解約済み扱い。force_stop とは異なり、通常の解約・アーカイブ処理に使用します。
              </p>
              <TenantActiveToggle
                tenantId={tenant_id}
                active={detail.tenant.active}
                redirectTo={`${redirectPath}?tab=overview`}
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                ※ 無効化しても Stripe サブスクリプションは自動キャンセルされません。Stripe Dashboard での操作も別途必要です。
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 契約・請求タブ */}
      {tab === "billing" && (
        <div className="grid gap-4">
          {/* 現在の契約状況 */}
          <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">現在の契約状況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Stripe</p>
                  {detail.tenant.subscription ? (
                    <div className="space-y-1.5 text-sm">
                      <Badge variant="outline">{detail.tenant.subscription.status}</Badge>
                      <p className="font-medium">{detail.tenant.subscription.plan_name ?? detail.tenant.subscription.plan_code ?? "-"}</p>
                      <p className="text-muted-foreground">{fmtYen(detail.tenant.subscription.monthly_price_jpy)} / 月</p>
                      <p className="text-xs text-muted-foreground">更新: {fmtDate(detail.tenant.subscription.current_period_end)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Stripe契約なし</p>
                  )}
                </div>
                <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">手動オーバーライド</p>
                  {detail.tenant.override ? (
                    <div className="space-y-1.5 text-sm">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={detail.tenant.override.is_active ? "default" : "outline"}>
                          {detail.tenant.override.billing_mode}
                        </Badge>
                        {!detail.tenant.override.is_active && (
                          <Badge variant="secondary">無効</Badge>
                        )}
                      </div>
                      <p className="font-medium">{detail.tenant.override.plan_name ?? detail.tenant.override.plan_code ?? "-"}</p>
                      <p className="text-muted-foreground">{fmtYen(detail.tenant.override.monthly_price_jpy)} / 月</p>
                      <p className="text-xs text-muted-foreground">status: {detail.tenant.override.status}</p>
                      <p className="text-xs text-muted-foreground">until: {fmtDate(detail.tenant.override.effective_until)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">未設定</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Override 編集 */}
          <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">手動オーバーライド 設定・更新</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form action={upsertContractOverrideAction} className="grid gap-3">
                <input type="hidden" name="redirect_to" value={`${redirectPath}?tab=billing`} />
                <input type="hidden" name="tenant_id" value={tenant_id} />
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">plan_id</label>
                  <select
                    name="plan_id"
                    required
                    defaultValue={detail.tenant.override?.plan_id ? String(detail.tenant.override.plan_id) : ""}
                    className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                  >
                    <option value="" disabled>プランを選択</option>
                    {detail.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.code}) - {fmtYen(plan.monthly_price_jpy)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">status</label>
                    <select
                      name="status"
                      defaultValue={detail.tenant.override?.status ?? "active"}
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
                      defaultValue={detail.tenant.override?.billing_mode ?? "invoice"}
                      className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                    >
                      <option value="stripe">stripe</option>
                      <option value="invoice">invoice（請求書）</option>
                      <option value="bank_transfer">bank_transfer（振込）</option>
                      <option value="manual">manual</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">effective_from (ISO)</label>
                    <Input name="effective_from" placeholder="2026-03-01T00:00:00+09:00" defaultValue={detail.tenant.override?.effective_from ?? ""} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">effective_until (ISO)</label>
                    <Input name="effective_until" placeholder="2027-03-01T00:00:00+09:00" defaultValue={detail.tenant.override?.effective_until ?? ""} />
                  </div>
                </div>
                <Textarea name="notes" rows={2} defaultValue={detail.tenant.override?.notes ?? ""} placeholder="契約メモ・請求条件" />
                <OverrideActiveToggle defaultChecked={Boolean(detail.tenant.override?.is_active ?? true)} />
                <div className="flex flex-wrap gap-2">
                  <ConfirmSubmitButton
                    description="契約オーバーライドを更新します。Stripe の契約とは独立してプラン制限が変更されます。よろしいですか？"
                    confirmLabel="保存する"
                  >
                    Overrideを保存
                  </ConfirmSubmitButton>
                  <form action={disableContractOverrideAction}>
                    <input type="hidden" name="redirect_to" value={`${redirectPath}?tab=billing`} />
                    <input type="hidden" name="tenant_id" value={tenant_id} />
                    <ConfirmSubmitButton
                      variant="outline"
                      destructive
                      description="契約オーバーライドを無効化します。Stripe の契約状態に基づく制限に戻ります。よろしいですか？"
                      confirmLabel="無効化する"
                    >
                      Overrideを無効化
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Stripe 決済URL */}
          <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4" />
                Stripe 決済URL発行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                このテナントオーナー宛の Stripe Checkout セッションを発行します。URLを顧客に共有すると、顧客が自分で決済を完了できます。有効期限は発行から約24時間です。
              </p>
              <StripeCheckoutLink tenantId={tenant_id} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* メンバータブ */}
      {tab === "members" && (
        <div className="grid gap-4">
          {/* メンバー一覧 */}
          <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                メンバー一覧
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  （{detail.memberships.filter((m) => m.is_active).length} 名有効）
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {/* モバイル */}
              <div className="divide-y divide-black/5 sm:hidden dark:divide-white/5">
                {detail.memberships.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">メンバーなし</p>
                ) : (
                  detail.memberships.map((m) => (
                    <div key={`${m.user_id}-${m.created_at}`} className="flex items-start justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{m.user_email ?? "-"}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{m.user_id.slice(0, 16)}…</p>
                        <p className="text-[11px] text-muted-foreground">{fmtDateShort(m.created_at)}</p>
                      </div>
                      <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                        <span className={`text-[10px] ${m.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {m.is_active ? "有効" : "無効"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* デスクトップ */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>状態</TableHead>
                      <TableHead>追加日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.memberships.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                          メンバーなし
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.memberships.map((m) => (
                        <TableRow key={`${m.user_id}-${m.created_at}`}>
                          <TableCell>
                            <p className="text-sm">{m.user_email ?? "-"}</p>
                            <p className="font-mono text-xs text-muted-foreground">{m.user_id}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{m.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${m.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                              {m.is_active ? "有効" : "無効"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* 招待メール送信 */}
            <Card className="border-blue-200/60 bg-blue-50/40 dark:border-blue-500/20 dark:bg-blue-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="size-4 text-blue-600 dark:text-blue-400" />
                  招待メール送信
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-xs text-muted-foreground">
                  未登録のメールアドレスに招待メールを送信します。受信者がリンクをクリックしてパスワードを設定するとアカウントが作成され、このテナントへのアクセス権が自動で付与されます。既登録アドレスの場合はメンバーシップのみ付与されます。
                </p>
                <form action={inviteUserToTenantAction} className="grid gap-2">
                  <input type="hidden" name="redirect_to" value={`${redirectPath}?tab=members`} />
                  <input type="hidden" name="tenant_id" value={tenant_id} />
                  <Input name="email" type="email" placeholder="invite@example.com" required />
                  <select name="role" defaultValue="editor" className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900">
                    <option value="editor">editor（操作可能）</option>
                    <option value="reader">reader（閲覧のみ）</option>
                  </select>
                  <ConfirmSubmitButton
                    description="指定のメールアドレスに招待メールを送信します。未登録の場合はアカウントを作成してメールを送信します。よろしいですか？"
                    confirmLabel="招待メールを送信"
                  >
                    招待メールを送信
                  </ConfirmSubmitButton>
                </form>
              </CardContent>
            </Card>

            {/* 既存アカウントへの権限付与 */}
            <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">権限付与・変更</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-xs text-muted-foreground">
                  登録済みのアカウントにテナントへのアクセス権を付与または変更します。
                </p>
                <form action={upsertTenantMembershipAction} className="grid gap-2">
                  <input type="hidden" name="redirect_to" value={`${redirectPath}?tab=members`} />
                  <input type="hidden" name="tenant_id" value={tenant_id} />
                  <Input name="user_email" type="email" placeholder="user@example.com" required />
                  <select name="role" defaultValue="editor" className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900">
                    <option value="editor">editor（操作可能）</option>
                    <option value="reader">reader（閲覧のみ）</option>
                  </select>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" name="is_active" defaultChecked className="size-4" />
                    membershipを有効化
                  </label>
                  <ConfirmSubmitButton
                    description="ユーザー権限を更新します。指定メールアドレスのユーザーにアクセス権を付与または変更します。よろしいですか？"
                    confirmLabel="保存する"
                  >
                    権限を保存
                  </ConfirmSubmitButton>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bot管理タブ */}
      {tab === "bots" && (
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Bot一覧
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                （{detail.bots.length} 件）
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {/* モバイル */}
            <div className="divide-y divide-black/5 sm:hidden dark:divide-white/5">
              {detail.bots.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Botがありません</p>
              ) : (
                detail.bots.map((bot) => (
                  <div key={bot.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{bot.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{bot.public_id}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[10px]">{bot.status}</Badge>
                        {bot.force_stopped ? <Badge variant="destructive" className="text-[10px]">停止中</Badge> : null}
                      </div>
                    </div>
                    <form action={setBotForceStopAction} className="mt-3 grid gap-2">
                      <input type="hidden" name="redirect_to" value={`${redirectPath}?tab=bots`} />
                      <input type="hidden" name="tenant_id" value={tenant_id} />
                      <input type="hidden" name="bot_id" value={bot.id} />
                      <Input name="reason" placeholder="停止理由（任意）" defaultValue={bot.force_stop_reason ?? ""} className="h-9 text-xs" />
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input type="checkbox" name="enabled" defaultChecked={Boolean(bot.force_stopped)} className="size-3.5" />
                          強制停止する
                        </label>
                        <ConfirmSubmitButton
                          size="sm"
                          variant="outline"
                          destructive={!bot.force_stopped}
                          description={
                            bot.force_stopped
                              ? `Bot「${bot.name}」の強制停止を解除します。よろしいですか？`
                              : `Bot「${bot.name}」を強制停止します。即座に応答がブロックされます。よろしいですか？`
                          }
                          confirmLabel="更新する"
                        >
                          更新
                        </ConfirmSubmitButton>
                      </div>
                    </form>
                  </div>
                ))
              )}
            </div>

            {/* デスクトップ */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>公開 / access_mode</TableHead>
                    <TableHead>強制停止制御</TableHead>
                    <TableHead className="whitespace-nowrap">作成日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.bots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                        Botがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.bots.map((bot) => (
                      <TableRow key={bot.id}>
                        <TableCell>
                          <p className="font-medium">{bot.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{bot.public_id}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">{bot.status}</Badge>
                            {bot.force_stopped && <Badge variant="destructive" className="text-xs">停止中</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <p>{bot.is_public ? "public" : "private"}</p>
                          <p>{bot.access_mode ?? "-"}</p>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <form action={setBotForceStopAction} className="grid gap-1.5">
                            <input type="hidden" name="redirect_to" value={`${redirectPath}?tab=bots`} />
                            <input type="hidden" name="tenant_id" value={tenant_id} />
                            <input type="hidden" name="bot_id" value={bot.id} />
                            <Input name="reason" placeholder="停止理由" defaultValue={bot.force_stop_reason ?? ""} className="h-8 text-xs" />
                            <label className="inline-flex items-center gap-1.5 text-xs">
                              <input type="checkbox" name="enabled" defaultChecked={Boolean(bot.force_stopped)} className="size-3" />
                              強制停止する
                            </label>
                            <ConfirmSubmitButton
                              size="sm"
                              variant="outline"
                              destructive={!bot.force_stopped}
                              description={
                                bot.force_stopped
                                  ? `Bot「${bot.name}」の強制停止を解除します。よろしいですか？`
                                  : `Bot「${bot.name}」を強制停止します。即座に応答がブロックされます。よろしいですか？`
                              }
                              confirmLabel="更新する"
                              className="w-fit text-xs"
                            >
                              更新
                            </ConfirmSubmitButton>
                          </form>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(bot.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
