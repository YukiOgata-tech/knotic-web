import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createTenantAction } from "@/app/sub-domain/actions"
import { fetchPlatformDashboard } from "@/app/sub-domain/_lib/data"
import { ConfirmSubmitButton } from "@/app/sub-domain/_components/confirm-submit-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function fmtYen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`
}

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const errorRaw = params.error
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw

  const { plans } = await fetchPlatformDashboard()

  return (
    <div className="grid gap-4">
      <div>
        <Link
          href="/sub-domain"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" />
          ダッシュボードに戻る
        </Link>
      </div>

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>テナントを作成</CardTitle>
          <CardDescription>
            既存のサインアップ済みユーザーをオーナーとして新規テナントを手動作成します。
            作成と同時に請求形態・契約プランを設定できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-md border border-red-300/40 bg-red-100/60 px-3 py-2 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <form action={createTenantAction} className="grid gap-6 max-w-lg">
            {/* テナント基本情報 */}
            <div className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">基本情報</p>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  表示名 <span className="text-red-500">*</span>
                </label>
                <Input name="display_name" placeholder="例: Acme Corporation" required />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  オーナーメールアドレス <span className="text-red-500">*</span>
                </label>
                <Input name="owner_email" type="email" placeholder="owner@example.com" required />
                <p className="mt-1 text-xs text-muted-foreground">
                  先にサインアップ済みのユーザーを指定してください。このユーザーがテナントの editor になります。
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">slug prefix（任意）</label>
                <Input name="slug" placeholder="例: acme（省略時は表示名から自動生成）" />
                <p className="mt-1 text-xs text-muted-foreground">
                  英小文字・数字・ハイフンのみ。一意性確保のため末尾に短いIDが付加されます。
                </p>
              </div>
            </div>

            {/* 請求形態 */}
            <div className="grid gap-4 rounded-md border border-black/15 p-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="setup_override" id="setup_override" className="size-4" />
                <label htmlFor="setup_override" className="text-sm font-medium">
                  作成時に請求形態・契約プランを設定する
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                チェックしない場合は無契約状態で作成されます。後からテナント詳細ページで設定できます。
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">プラン</label>
                <select
                  name="plan_id"
                  defaultValue=""
                  className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                >
                  <option value="">未設定</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.code}) — {fmtYen(plan.monthly_price_jpy)} / 月
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">請求形態</label>
                <select
                  name="billing_mode"
                  defaultValue="invoice"
                  className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                >
                  <option value="stripe">stripe（Stripe 決済）</option>
                  <option value="invoice">invoice（請求書払い）</option>
                  <option value="bank_transfer">bank_transfer（銀行振込）</option>
                  <option value="manual">manual（手動管理）</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  stripe 以外を選択した場合、Stripe サブスクリプションとは独立してプラン制限が適用されます。
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">備考・契約メモ（任意）</label>
                <Textarea name="notes" rows={2} placeholder="契約条件、担当者名、特記事項など" />
              </div>
            </div>

            <div className="flex gap-2">
              <ConfirmSubmitButton
                description="テナントを作成します。オーナーへのメンバーシップも同時に付与されます。請求形態を設定した場合は契約オーバーライドも作成されます。よろしいですか？"
                confirmLabel="作成する"
              >
                テナントを作成
              </ConfirmSubmitButton>
              <Button type="button" variant="outline" asChild>
                <Link href="/sub-domain">キャンセル</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {plans.length > 0 ? (
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-sm">利用可能プラン一覧</CardTitle>
            <CardDescription className="text-xs">各プランの料金と内容の参照用です。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-xs">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 dark:border-white/10"
                >
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-muted-foreground">
                    {plan.code} / {fmtYen(plan.monthly_price_jpy)} 月
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
