import Stripe from "stripe"

import { firstParam, fmtDate } from "@/app/console/_lib/ui"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripeClient, getStripePriceMapSafe } from "@/lib/stripe"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const PLAN_LABELS: Record<"lite" | "standard" | "pro", string> = {
  lite: "Lite",
  standard: "Standard",
  pro: "Pro",
}

type BillingSubscriptionRow = {
  id: number
  plan_id: number
  provider_subscription_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  plans: {
    code: "lite" | "standard" | "pro"
    name: string
    monthly_price_jpy: number
  } | null
}

function formatJpy(value: number | null | undefined) {
  if (typeof value !== "number") return "-"
  return `${value.toLocaleString()} 円`
}

function formatInvoiceAmount(invoice: Stripe.Invoice) {
  const amount = typeof invoice.amount_paid === "number" ? invoice.amount_paid : invoice.amount_due
  return `${Math.round((amount ?? 0) / 1)} ${String(invoice.currency ?? "jpy").toUpperCase()}`
}

export default async function ConsoleBillingPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const noticeRaw = firstParam(params.notice)
  const errorRaw = firstParam(params.error)

  const noticeMap: Record<string, string> = {
    retry_success: "Webhook未反映イベントの再同期を実行しました。",
    checkout_success: "決済画面から戻りました。Webhook同期完了後に契約情報へ反映されます。",
    cancel_scheduled: "解約予約を受け付けました。現在の請求期間終了日に停止されます。",
    cancel_resumed: "自動更新を再開しました。",
  }
  const errorMap: Record<string, string> = {
    retry_failed: "再同期処理に失敗しました。時間をおいて再実行してください。",
    stripe_forbidden: "Stripe APIが403を返しました。制限付きキーではなく通常の Secret key を使用し、Price IDのモード（test/live）一致を確認してください。",
    stripe_unauthorized: "Stripe API認証に失敗しました。STRIPE_SECRET_KEYを確認してください。",
    stripe_resource_missing: "指定したPrice IDが見つかりません。環境変数のPrice IDを確認してください。",
    stripe_invalid_request: "Stripeへのリクエストが不正です。Price/Customer/Subscription設定を確認してください。",
    checkout_failed: "Checkoutの作成に失敗しました。サーバーログの [stripe.checkout] を確認してください。",
    checkout_canceled: "決済をキャンセルしました。",
    permission_denied: "この操作はEditor権限が必要です。",
  }

  const notice = noticeRaw ? noticeMap[noticeRaw] ?? noticeRaw : undefined
  const error = errorRaw ? errorMap[errorRaw] ?? errorRaw : undefined

  const { membership } = await requireConsoleContext()
  if (!membership) return null

  const admin = createAdminClient()
  const tenantId = membership.tenant_id
  const isEditor = membership.role === "editor"

  const [{ data: subscriptionRaw }, { data: customerRow }] = await Promise.all([
    admin
      .from("subscriptions")
      .select(
        "id, plan_id, provider_subscription_id, status, current_period_start, current_period_end, cancel_at_period_end, plans(code,name,monthly_price_jpy)"
      )
      .eq("tenant_id", tenantId)
      .in("status", ["trialing", "active", "past_due", "unpaid", "canceled", "incomplete", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("billing_customers")
      .select("provider_customer_id, billing_email")
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .maybeSingle(),
  ])

  const subscription = (subscriptionRaw as BillingSubscriptionRow | null) ?? null
  const currentCode = subscription?.plans?.code ?? null

  const prices = getStripePriceMapSafe()
  const stripeReady = Boolean(prices.lite && prices.standard && prices.pro)

  let cardSummary = "未登録"
  let invoices: Stripe.Invoice[] = []

  if (stripeReady && customerRow?.provider_customer_id) {
    try {
      const stripe = getStripeClient()
      const customer = await stripe.customers.retrieve(customerRow.provider_customer_id, {
        expand: ["invoice_settings.default_payment_method"],
      })

      if (!customer.deleted) {
        const pm = customer.invoice_settings?.default_payment_method
        if (pm && typeof pm !== "string" && pm.type === "card" && pm.card) {
          cardSummary = `${pm.card.brand?.toUpperCase() ?? "CARD"} **** ${pm.card.last4 ?? "----"} / exp ${pm.card.exp_month}/${pm.card.exp_year}`
        }
      }

      const listed = await stripe.invoices.list({
        customer: customerRow.provider_customer_id,
        limit: 8,
      })
      invoices = listed.data
    } catch {
      // Stripe API failure should not break console rendering.
    }
  }

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} />

      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>契約情報</CardTitle>
          <CardDescription>自動更新（ON）/ 日割りなし の運用方針に基づく現在の契約状態です。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>現在プラン: {subscription?.plans?.name ?? "未契約"}</p>
          <p>料金: {formatJpy(subscription?.plans?.monthly_price_jpy)}</p>
          <p>契約ステータス: {subscription?.status ?? "未設定"}</p>
          <p>契約開始日: {fmtDate(subscription?.current_period_start)}</p>
          <p>次回更新日: {fmtDate(subscription?.current_period_end)}</p>
          <p>自動更新: {subscription?.cancel_at_period_end ? "停止予約中（期間終了で終了）" : "ON"}</p>
          <p>日割り精算: なし（プラン変更時は次回更新タイミングで反映）</p>
          {!stripeReady ? (
            <p className="rounded-md bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Stripeの環境変数が不足しています。`.env.local` に stripe値を設定してください。
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {(["lite", "standard", "pro"] as const).map((code) => {
          const isCurrent = currentCode === code
          const disabled = !isEditor || !stripeReady
          return (
            <Card key={code} className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-base">{PLAN_LABELS[code]}</CardTitle>
                <CardDescription>
                  {code === "lite" ? "1万円 / 月" : code === "standard" ? "2.48万円 / 月" : "10万円 / 月"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <form action="/api/stripe/checkout" method="post">
                  <input type="hidden" name="plan_code" value={code} />
                  <button
                    type="submit"
                    disabled={disabled || isCurrent}
                    className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
                  >
                    {isCurrent ? "現在のプラン" : "このプランに変更"}
                  </button>
                </form>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base">支払い情報</CardTitle>
          <CardDescription>カード情報・請求書・支払い失敗時対応はStripe Customer Portalと請求一覧で確認できます。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p>請求先メール: {customerRow?.billing_email ?? "未設定"}</p>
          <p>デフォルト支払い方法: {cardSummary}</p>
          <form action="/api/stripe/portal" method="post">
            <button
              type="submit"
              disabled={!isEditor || !stripeReady}
              className="inline-flex items-center justify-center rounded-md border border-black/15 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20"
            >
              Customer Portalを開く
            </button>
          </form>
          <div className="grid gap-2 rounded-lg border border-black/10 p-3 text-xs dark:border-white/10">
            <p className="font-medium">請求履歴（最新8件）</p>
            {invoices.length === 0 ? <p className="text-muted-foreground">請求履歴はまだありません。</p> : null}
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {fmtDate(invoice.created ? new Date(invoice.created * 1000).toISOString() : null)} / {formatInvoiceAmount(invoice)} / {invoice.status ?? "-"}
                </span>
                <div className="flex items-center gap-2">
                  {invoice.hosted_invoice_url ? (
                    <a className="text-cyan-700 hover:underline dark:text-cyan-300" href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer">
                      表示
                    </a>
                  ) : null}
                  {invoice.invoice_pdf ? (
                    <a className="text-cyan-700 hover:underline dark:text-cyan-300" href={invoice.invoice_pdf} target="_blank" rel="noreferrer">
                      PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-300/60 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base">契約停止（解約）</CardTitle>
          <CardDescription>解約は「期間終了で停止（cancel at period end）」として処理されます。即時停止ではありません。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-amber-900 dark:text-amber-200">
          <p>停止予定日: {fmtDate(subscription?.current_period_end)}</p>
          <p>注意: 解約予約後も期間終了までは利用可能です。日割り返金は行いません。</p>
          <div className="flex flex-wrap gap-2">
            <form action="/api/stripe/subscription/cancel" method="post">
              <button
                type="submit"
                disabled={!isEditor || !stripeReady || !subscription?.provider_subscription_id || Boolean(subscription?.cancel_at_period_end)}
                className="inline-flex items-center justify-center rounded-md bg-rose-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                期間終了で解約予約
              </button>
            </form>
            <form action="/api/stripe/subscription/resume" method="post">
              <button
                type="submit"
                disabled={!isEditor || !stripeReady || !subscription?.provider_subscription_id || !Boolean(subscription?.cancel_at_period_end)}
                className="inline-flex items-center justify-center rounded-md border border-black/15 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20"
              >
                自動更新を再開
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


