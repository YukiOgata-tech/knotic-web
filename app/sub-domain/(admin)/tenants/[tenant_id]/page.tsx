import Link from "next/link"
import { CreditCard, Mail } from "lucide-react"

import {
  disableContractOverrideAction,
  inviteUserToTenantAction,
  setBotForceStopAction,
  setTenantActiveAction,
  setTenantForceStopAction,
  startImpersonationAction,
  upsertContractOverrideAction,
  upsertTenantMembershipAction,
} from "@/app/sub-domain/actions"
import { fetchPlatformTenantDetail } from "@/app/sub-domain/_lib/data"
import { ConfirmSubmitButton } from "@/app/sub-domain/_components/confirm-submit-button"
import { StripeCheckoutLink } from "@/app/sub-domain/_components/stripe-checkout-link"
import { Badge } from "@/components/ui/badge"
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
      {/* ── ヘッダー ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="truncate">{detail.tenant.display_name}</CardTitle>
              <p className="mt-0.5 break-all text-xs text-muted-foreground">
                slug: {detail.tenant.slug}
              </p>
              <p className="break-all text-[11px] text-muted-foreground">
                id: {detail.tenant.id}
              </p>
            </div>
            <Link
              href="/sub-domain"
              className="shrink-0 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              ← 一覧へ
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {detail.tenant.active ? (
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-700 dark:text-emerald-400">
                有効
              </Badge>
            ) : (
              <Badge variant="secondary">無効（解約済み）</Badge>
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
                代理閲覧を開始
              </ConfirmSubmitButton>
            </form>
          </div>

          {notice ? (
            <p className="rounded-md border border-emerald-300/40 bg-emerald-100/60 px-3 py-2 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-200">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-red-300/40 bg-red-100/60 px-3 py-2 text-red-900 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </p>
          ) : null}

          {/* KPI */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "メンバー", value: detail.memberships.filter((m) => m.is_active).length },
              { label: "Bots", value: detail.bots.length },
              { label: "30日メッセージ", value: detail.usage30dMessages.toLocaleString("ja-JP") },
              { label: "30日tokens_out", value: detail.usage30dTokensOut.toLocaleString("ja-JP") },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-black/20 p-3 dark:border-white/10">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 契約情報 & ユーザー権限 ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 契約情報 */}
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle>契約情報</CardTitle>
            <CardDescription>Stripe契約と手動オーバーライドを併記</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {/* Stripe / Override 状況 */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-black/20 p-3 dark:border-white/10">
                <p className="mb-1 text-xs text-muted-foreground">Stripe</p>
                {detail.tenant.subscription ? (
                  <div className="space-y-1">
                    <Badge variant="outline">{detail.tenant.subscription.status}</Badge>
                    <p className="text-sm">{detail.tenant.subscription.plan_name ?? detail.tenant.subscription.plan_code ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">{fmtYen(detail.tenant.subscription.monthly_price_jpy)} / 月</p>
                    <p className="text-xs text-muted-foreground">更新: {fmtDate(detail.tenant.subscription.current_period_end)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Stripe契約なし</p>
                )}
              </div>
              <div className="rounded-xl border border-black/20 p-3 dark:border-white/10">
                <p className="mb-1 text-xs text-muted-foreground">Override</p>
                {detail.tenant.override ? (
                  <div className="space-y-1">
                    <Badge variant={detail.tenant.override.is_active ? "default" : "outline"}>
                      {detail.tenant.override.billing_mode}
                    </Badge>
                    <p className="text-sm">{detail.tenant.override.plan_name ?? detail.tenant.override.plan_code ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">{fmtYen(detail.tenant.override.monthly_price_jpy)} / 月</p>
                    <p className="text-xs text-muted-foreground">status: {detail.tenant.override.status}</p>
                    <p className="text-xs text-muted-foreground">until: {fmtDate(detail.tenant.override.effective_until)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">未設定</p>
                )}
              </div>
            </div>

            {/* Override 編集フォーム */}
            <form action={upsertContractOverrideAction} className="grid gap-3 border-t border-black/20 pt-4 dark:border-white/10">
              <p className="text-xs font-medium text-muted-foreground">Override を設定・更新</p>
              <input type="hidden" name="redirect_to" value={redirectPath} />
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
                <Input name="effective_from" placeholder="effective_from (ISO)" defaultValue={detail.tenant.override?.effective_from ?? ""} />
                <Input name="effective_until" placeholder="effective_until (ISO)" defaultValue={detail.tenant.override?.effective_until ?? ""} />
              </div>
              <Textarea name="notes" rows={2} defaultValue={detail.tenant.override?.notes ?? ""} placeholder="契約メモ" />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked={Boolean(detail.tenant.override?.is_active ?? true)} className="size-4" />
                overrideを有効化
              </label>
              <ConfirmSubmitButton description="契約オーバーライドを更新します。Stripe の契約とは独立してプラン制限が変更されます。よろしいですか？" confirmLabel="保存する">
                Overrideを保存
              </ConfirmSubmitButton>
            </form>

            <form action={disableContractOverrideAction} className="flex">
              <input type="hidden" name="redirect_to" value={redirectPath} />
              <input type="hidden" name="tenant_id" value={tenant_id} />
              <ConfirmSubmitButton
                variant="outline"
                destructive
                description="契約オーバーライドを無効化します。Stripe の契約状態（または無契約）に基づく制限に戻ります。よろしいですか？"
                confirmLabel="無効化する"
              >
                Overrideを無効化
              </ConfirmSubmitButton>
            </form>

            {/* 強制停止 */}
            <div className="rounded-xl border border-black/20 p-3 dark:border-white/10">
              <p className="mb-1 text-xs font-medium text-muted-foreground">テナント強制停止</p>
              <p className="mb-2 text-xs text-muted-foreground">現在: {detail.tenant.force_stopped ? "停止中" : "稼働中"}</p>
              <form action={setTenantForceStopAction} className="grid gap-2">
                <input type="hidden" name="redirect_to" value={redirectPath} />
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
                >
                  テナント停止状態を更新
                </ConfirmSubmitButton>
              </form>
            </div>

            {/* 有効化状態 */}
            <div className="rounded-xl border border-black/20 p-3 dark:border-white/10">
              <p className="mb-1 text-xs font-medium text-muted-foreground">テナント有効化状態</p>
              <p className="mb-2 text-xs text-muted-foreground">
                {detail.tenant.active
                  ? "現在有効（稼働中）。無効化するとテナントは解約済み扱いになります。"
                  : "現在無効（解約済み）。force_stop とは異なり、通常の解約・アーカイブ処理に使用します。"}
              </p>
              <form action={setTenantActiveAction} className="grid gap-2">
                <input type="hidden" name="redirect_to" value={redirectPath} />
                <input type="hidden" name="tenant_id" value={tenant_id} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={detail.tenant.active} className="size-4" />
                  テナントを有効にする
                </label>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  ※ 無効化しても Stripe サブスクリプションは自動キャンセルされません。Stripe Dashboard での操作も必要です。
                </p>
                <ConfirmSubmitButton
                  variant="outline"
                  destructive={detail.tenant.active}
                  description={
                    detail.tenant.active
                      ? "テナントを無効化します。解約済み扱いになります。Stripe 側の操作は別途必要です。よろしいですか？"
                      : "テナントを有効化します。よろしいですか？"
                  }
                  confirmLabel="更新する"
                  className="w-fit"
                >
                  有効化状態を更新
                </ConfirmSubmitButton>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* ユーザー権限 */}
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader className="pb-3">
            <CardTitle>ユーザー権限</CardTitle>
            <CardDescription>招待メール送信・既存アカウントへの権限付与</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* メンバーリスト: モバイル */}
            <div className="sm:hidden">
              {detail.memberships.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">メンバーなし</p>
              ) : (
                <div className="grid gap-2">
                  {detail.memberships.map((m) => (
                    <div
                      key={`${m.user_id}-${m.created_at}`}
                      className="flex items-start justify-between rounded-xl border border-black/10 p-3 dark:border-white/10"
                    >
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
                  ))}
                </div>
              )}
            </div>

            {/* メンバーリスト: デスクトップ */}
            <div className="hidden sm:block">
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
            </div>

            {/* 招待メール送信 */}
            <div className="grid gap-3 rounded-xl border border-blue-200/60 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">招待メール送信</p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                未登録のメールアドレスに招待メールを送信します。受信者がリンクをクリックしてパスワードを設定するとアカウントが作成され、このテナントへのアクセス権が自動で付与されます。既登録アドレスの場合はメンバーシップのみ付与されます。
              </p>
              <form action={inviteUserToTenantAction} className="grid gap-2">
                <input type="hidden" name="redirect_to" value={redirectPath} />
                <input type="hidden" name="tenant_id" value={tenant_id} />
                <Input name="email" type="email" placeholder="invite@example.com" required />
                <select name="role" defaultValue="editor" className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900">
                  <option value="editor">editor（操作可能）</option>
                  <option value="reader">reader（閲覧のみ）</option>
                </select>
                <ConfirmSubmitButton
                  description="指定のメールアドレスに招待メールを送信します。未登録の場合はSupabaseがアカウントを作成してメールを送信します。よろしいですか？"
                  confirmLabel="招待メールを送信"
                >
                  招待メールを送信
                </ConfirmSubmitButton>
              </form>
            </div>

            {/* 既存アカウントへの権限付与 */}
            <form action={upsertTenantMembershipAction} className="grid gap-2 border-t border-black/20 pt-4 dark:border-white/10">
              <p className="text-xs font-medium text-muted-foreground">既存アカウントへの権限付与・変更</p>
              <input type="hidden" name="redirect_to" value={redirectPath} />
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
                description="ユーザー権限を更新します。指定メールアドレスのユーザーにテナントへのアクセス権を付与または変更します。よろしいですか？"
                confirmLabel="保存する"
              >
                ユーザー権限を保存
              </ConfirmSubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Stripe 決済URL ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Stripe 決済URL発行
          </CardTitle>
          <CardDescription>
            このテナントオーナー宛の Stripe Checkout セッションを発行します。URLを顧客に共有すると、顧客が自分で決済を完了できます。有効期限は発行から約24時間です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StripeCheckoutLink tenantId={tenant_id} />
        </CardContent>
      </Card>

      {/* ── Bots ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>Bots</CardTitle>
          <CardDescription>テナント配下のBot一覧</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* モバイル: カードリスト */}
          <div className="grid gap-0 divide-y divide-black/5 sm:hidden dark:divide-white/5">
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
                      <span className="text-[10px] text-muted-foreground">
                        {bot.is_public ? "public" : "private"}
                      </span>
                      {bot.force_stopped ? <Badge variant="destructive" className="text-[10px]">停止中</Badge> : null}
                    </div>
                  </div>
                  <form action={setBotForceStopAction} className="mt-3 grid gap-2">
                    <input type="hidden" name="redirect_to" value={redirectPath} />
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
                        className="text-xs"
                      >
                        更新
                      </ConfirmSubmitButton>
                    </div>
                  </form>
                </div>
              ))
            )}
          </div>

          {/* デスクトップ: テーブル */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>public_id</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>公開</TableHead>
                  <TableHead>access_mode</TableHead>
                  <TableHead>停止制御</TableHead>
                  <TableHead>作成日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell>{bot.name}</TableCell>
                    <TableCell className="font-mono text-xs">{bot.public_id}</TableCell>
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
                          <input type="checkbox" name="enabled" defaultChecked={Boolean(bot.force_stopped)} className="size-3" />
                          停止
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
                          className="text-xs"
                        >
                          更新
                        </ConfirmSubmitButton>
                      </form>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{fmtDate(bot.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
