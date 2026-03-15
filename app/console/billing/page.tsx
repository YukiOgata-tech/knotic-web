import Stripe from "stripe"

import { firstParam, fmtDate } from "@/app/console/_lib/ui"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { requireConsoleContext } from "@/app/console/_lib/data"
import { PlanChangeConfirmButton } from "@/app/console/billing/plan-change-confirm-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTenantBotCount, getTenantStorageUsageBytes } from "@/lib/billing/limits"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getStripeClient,
  getStripePriceMapSafe,
  mapStripeSubscriptionStatus,
  resolvePlanCodeFromPriceId,
} from "@/lib/stripe"

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

type PlanLimitRow = {
  code: string
  name: string
  max_bots: number
  max_hosted_pages: number
  max_storage_mb: number
  internal_max_bots_cap: number
  has_api: boolean
  has_hosted_page: boolean
}

type PendingPlanChange = {
  targetPlanCode: string
  targetPlanName: string
  effectiveAt: string
}

type BillingEventFailureRow = {
  event_type: string
  processing_error: string | null
  attempt_count: number | null
  last_attempt_at: string | null
  next_retry_at: string | null
}

const OPERATIONAL_SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due", "unpaid"])

function formatJpy(value: number | null | undefined) {
  if (typeof value !== "number") return "-"
  return `${value.toLocaleString()} 円`
}

function formatInvoiceAmount(invoice: Stripe.Invoice) {
  const amount = typeof invoice.amount_paid === "number" ? invoice.amount_paid : invoice.amount_due
  return `${Math.round((amount ?? 0) / 1)} ${String(invoice.currency ?? "jpy").toUpperCase()}`
}

function toIsoFromUnix(value: number | null | undefined) {
  if (!value) return null
  return new Date(value * 1000).toISOString()
}

function extractStripePeriod(subscription: Stripe.Subscription | null | undefined) {
  if (!subscription) {
    return { currentPeriodStartIso: null as string | null, currentPeriodEndIso: null as string | null }
  }

  const firstItemAny = subscription.items.data[0] as unknown as {
    current_period_start?: number
    current_period_end?: number
  }
  const subscriptionAny = subscription as unknown as {
    current_period_start?: number
    current_period_end?: number
  }

  return {
    currentPeriodStartIso: toIsoFromUnix(
      firstItemAny.current_period_start ?? subscriptionAny.current_period_start ?? null
    ),
    currentPeriodEndIso: toIsoFromUnix(
      firstItemAny.current_period_end ?? subscriptionAny.current_period_end ?? null
    ),
  }
}

export default async function ConsoleBillingPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const noticeRaw = firstParam(params.notice)
  const errorRaw = firstParam(params.error)

  const noticeMap: Record<string, string> = {
    retry_success: "Webhook未反映イベントの再同期を実行しました。",
    checkout_success: "決済画面から戻りました。Webhook同期完了後に契約情報へ反映されます。",
    plan_update_scheduled: "既存契約のプラン変更を受け付けました。日割りなしで次回更新タイミングから反映されます。",
    plan_already_current: "すでに同じプランを利用中です。",
    plan_upgrade_prorated: "アップグレードを適用しました。差額は日割りで追加請求され、機能は即時反映されます。",
    plan_downgrade_scheduled: "ダウングレードを受け付けました。次回更新日から新プランへ切り替わります。",
    plan_change_already_scheduled: "次回更新でのプラン変更予約が既にあるため、追加の変更はできません。",
    cancel_scheduled: "解約予約を受け付けました。現在の請求期間終了日に停止されます。",
    cancel_resumed: "自動更新を再開しました。",
  }
  const errorMap: Record<string, string> = {
    retry_failed: "再同期処理に失敗しました。時間をおいて再実行してください。",
    stripe_forbidden: "決済システムとの通信に失敗しました。サポートにお問い合わせください。",
    stripe_unauthorized: "決済システムへの接続に失敗しました。サポートにお問い合わせください。",
    stripe_resource_missing: "プラン情報の取得に失敗しました。サポートにお問い合わせください。",
    stripe_invalid_request: "決済リクエストに問題が発生しました。サポートにお問い合わせください。",
    checkout_failed: "決済画面の作成に失敗しました。時間をおいて再試行するか、サポートにお問い合わせください。",
    checkout_canceled: "決済をキャンセルしました。",
    subscription_item_missing: "契約情報の取得に失敗しました。サポートにお問い合わせください。",
    permission_denied: "この操作はEditor権限が必要です。",
    customer_not_found: "請求先情報が見つかりません。先にプラン契約を完了してください。",
    portal_failed: "Customer Portalへの遷移に失敗しました。時間をおいて再試行してください。",
    subscription_not_found: "契約情報が見つかりません。しばらく待ってから再読み込みしてください。",
    subscription_not_operational: "現在の契約状態ではこの操作を実行できません。再契約後に実行してください。",
    cancel_failed: "解約予約に失敗しました。時間をおいて再試行してください。",
    resume_failed: "自動更新の再開に失敗しました。時間をおいて再試行してください。",
  }

  const retryPartialPrefix = "retry_partial_failed_"
  const retryPartialCount = errorRaw?.startsWith(retryPartialPrefix)
    ? Number(errorRaw.slice(retryPartialPrefix.length))
    : NaN

  const notice = noticeRaw ? noticeMap[noticeRaw] ?? noticeRaw : undefined
  const error = Number.isFinite(retryPartialCount) && retryPartialCount > 0
    ? `再同期を実行しましたが、${retryPartialCount} 件のイベント処理に失敗しました。`
    : errorRaw
      ? errorMap[errorRaw] ?? errorRaw
      : undefined

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

  let subscription = (subscriptionRaw as BillingSubscriptionRow | null) ?? null
  const currentCode = subscription?.plans?.code ?? null

  const prices = getStripePriceMapSafe()
  const stripeReady = Boolean(prices.lite && prices.standard && prices.pro)
  const [botCount, storageBytes] = await Promise.all([
    getTenantBotCount(tenantId),
    getTenantStorageUsageBytes(tenantId),
  ])
  const storageUsedMb = Math.round((storageBytes / (1024 * 1024)) * 10) / 10
  const [
    { count: hostedCandidateCount },
    { count: activeApiKeyCount },
    { count: pendingBillingEventCount },
    { data: latestBillingEventFailureRaw },
  ] = await Promise.all([
    admin
      .from("bots")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .neq("status", "archived")
      .or("is_public.eq.true,access_mode.eq.internal,require_auth_for_hosted.eq.true"),
    admin
      .from("tenant_api_keys")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .is("revoked_at", null),
    admin
      .from("billing_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .is("processed_at", null),
    admin
      .from("billing_events")
      .select("event_type, processing_error, attempt_count, last_attempt_at, next_retry_at")
      .eq("tenant_id", tenantId)
      .eq("provider", "stripe")
      .is("processed_at", null)
      .not("processing_error", "is", null)
      .order("last_attempt_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const { data: planRowsRaw } = await admin
    .from("plans")
    .select("code, name, max_bots, max_hosted_pages, max_storage_mb, internal_max_bots_cap, has_api, has_hosted_page")
    .eq("is_active", true)

  const planRows = (planRowsRaw ?? []) as PlanLimitRow[]
  const planByCode = new Map(planRows.map((row) => [row.code, row]))
  let pendingPlanChange: PendingPlanChange | null = null
  let hasScheduledPlanChange = false
  let stripeSubscriptionForDisplay: Stripe.Subscription | null = null

  let cardSummary = "未登録"
  let invoices: Stripe.Invoice[] = []

  if (stripeReady) {
    try {
      const stripe = getStripeClient()

      if (customerRow?.provider_customer_id) {
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
      }

      if (subscription?.provider_subscription_id) {
        const stripeSub = await stripe.subscriptions.retrieve(subscription.provider_subscription_id)
        stripeSubscriptionForDisplay = stripeSub

        const { currentPeriodStartIso: stripePeriodStartIso, currentPeriodEndIso: stripePeriodEndIso } =
          extractStripePeriod(stripeSub)
        const shouldBackfillPeriod =
          (!subscription.current_period_start && Boolean(stripePeriodStartIso)) ||
          (!subscription.current_period_end && Boolean(stripePeriodEndIso))
        if (shouldBackfillPeriod) {
          await admin
            .from("subscriptions")
            .update({
              current_period_start: subscription.current_period_start ?? stripePeriodStartIso,
              current_period_end: subscription.current_period_end ?? stripePeriodEndIso,
              status: mapStripeSubscriptionStatus(stripeSub.status),
              cancel_at_period_end: Boolean(stripeSub.cancel_at_period_end),
            })
            .eq("id", subscription.id)

          subscription = {
            ...subscription,
            current_period_start: subscription.current_period_start ?? stripePeriodStartIso,
            current_period_end: subscription.current_period_end ?? stripePeriodEndIso,
            status: mapStripeSubscriptionStatus(stripeSub.status),
            cancel_at_period_end: Boolean(stripeSub.cancel_at_period_end),
          }
        }

        const scheduleId =
          typeof stripeSub.schedule === "string"
            ? stripeSub.schedule
            : stripeSub.schedule?.id ?? null
        if (scheduleId) {
          hasScheduledPlanChange = true
          const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
          const nowSec = Math.floor(Date.now() / 1000)
          const nextPhase = schedule.phases.find((phase) => Number(phase.start_date ?? 0) > nowSec)
          const nextItem = nextPhase?.items?.[0] as { price?: string | { id?: string } } | undefined
          const nextPriceId =
            typeof nextItem?.price === "string" ? nextItem.price : nextItem?.price?.id ?? null
          const nextPlanCode = nextPriceId ? resolvePlanCodeFromPriceId(nextPriceId) : null
          const nextPlan = nextPlanCode ? planByCode.get(nextPlanCode) : null
          if (nextPlanCode && nextPlan && nextPlanCode !== currentCode && nextPhase?.start_date) {
            pendingPlanChange = {
              targetPlanCode: nextPlanCode,
              targetPlanName: nextPlan.name,
              effectiveAt: new Date(Number(nextPhase.start_date) * 1000).toISOString(),
            }
          }
        }
      }
    } catch {
      // Stripe API failure should not break console rendering.
    }
  }

  const targetPlan = pendingPlanChange ? planByCode.get(pendingPlanChange.targetPlanCode) ?? null : null
  const targetBotLimit = targetPlan
    ? targetPlan.internal_max_bots_cap > 0
      ? Math.min(targetPlan.max_bots, targetPlan.internal_max_bots_cap)
      : targetPlan.max_bots
    : null
  const targetStorageBytes = targetPlan ? targetPlan.max_storage_mb * 1024 * 1024 : null
  const botsToReduce = targetBotLimit !== null ? Math.max(0, botCount - targetBotLimit) : 0
  const storageToReduceBytes =
    targetStorageBytes !== null ? Math.max(0, storageBytes - targetStorageBytes) : 0
  const storageToReduceMb = Math.ceil((storageToReduceBytes / (1024 * 1024)) * 10) / 10
  const hostedInUse = hostedCandidateCount ?? 0
  const targetHostedLimit = targetPlan
    ? targetPlan.has_hosted_page
      ? Math.max(0, targetPlan.max_hosted_pages)
      : 0
    : null
  const hostedToReduce = targetHostedLimit !== null ? Math.max(0, hostedInUse - targetHostedLimit) : 0
  const currentPlan = currentCode ? planByCode.get(currentCode) ?? null : null
  const willLoseApi = Boolean(currentPlan?.has_api) && targetPlan?.has_api === false
  const activeApiKeys = activeApiKeyCount ?? 0
  const pendingBillingEvents = pendingBillingEventCount ?? 0
  const latestBillingEventFailure = (latestBillingEventFailureRaw as BillingEventFailureRow | null) ?? null
  const needsPaymentRecovery = subscription?.status === "past_due" || subscription?.status === "unpaid"
  const subscriptionStatus = subscription?.status ?? null
  const isOperationalSubscription = Boolean(
    subscription?.provider_subscription_id &&
    subscriptionStatus &&
    OPERATIONAL_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
  )
  const canScheduleCancel =
    isEditor && stripeReady && isOperationalSubscription && !Boolean(subscription?.cancel_at_period_end)
  const canResumeAutoRenew =
    isEditor && stripeReady && isOperationalSubscription && Boolean(subscription?.cancel_at_period_end)
  const isCanceled = subscriptionStatus === "canceled"
  const isNotOperational = Boolean(subscriptionStatus && !OPERATIONAL_SUBSCRIPTION_STATUSES.has(subscriptionStatus))
  const { currentPeriodStartIso: stripePeriodStartDisplay, currentPeriodEndIso: stripePeriodEndDisplay } =
    extractStripePeriod(stripeSubscriptionForDisplay)
  const currentPeriodStartDisplay = subscription?.current_period_start ?? stripePeriodStartDisplay
  const currentPeriodEndDisplay = subscription?.current_period_end ?? stripePeriodEndDisplay

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} />

      {needsPaymentRecovery ? (
        <Card className="border-rose-300/60 bg-rose-50/70 dark:border-rose-500/40 dark:bg-rose-950/20">
          <CardHeader>
            <CardTitle className="text-base">
              {subscription?.status === "unpaid" ? "お支払いが未完了です" : "お支払いに失敗しています"}
            </CardTitle>
            <CardDescription>
              {subscription?.status === "unpaid"
                ? "サービス継続のため、カード情報の確認とお支払い対応を行ってください。"
                : "再請求やカード再認証が必要な可能性があります。Customer Portalからご確認ください。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-rose-900 dark:text-rose-200">
            <p>現在の契約ステータス: {subscription?.status === "unpaid" ? "未払い (unpaid)" : "支払い遅延 (past_due)"}</p>
            <form action="/api/stripe/portal" method="post">
              <button
                type="submit"
                disabled={!isEditor || !stripeReady}
                className="inline-flex w-fit items-center justify-center rounded-md bg-rose-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                支払い方法を更新する（Customer Portal）
              </button>
            </form>
            {!isEditor ? (
              <p className="text-xs">支払い操作はEditor権限のユーザーのみ実行できます。管理者へ連絡してください。</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isEditor ? (
        <Card className="border-slate-300/60 bg-slate-50/70 dark:border-slate-600/40 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base">Webhook同期の運用</CardTitle>
            <CardDescription>
              未処理イベントの再同期を実行できます。支払い再試行（Customer Portal）とは別機能です。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>未処理イベント: {pendingBillingEvents} 件</p>
            {latestBillingEventFailure?.processing_error ? (
              <div className="rounded-md border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200">
                <p>最新失敗: {latestBillingEventFailure.event_type}</p>
                <p>理由: {latestBillingEventFailure.processing_error}</p>
                <p>試行回数: {latestBillingEventFailure.attempt_count ?? 0} 回</p>
                <p>次回自動再試行予定: {fmtDate(latestBillingEventFailure.next_retry_at)}</p>
              </div>
            ) : null}
            <form action="/api/stripe/retry-failed" method="post">
              <button
                type="submit"
                disabled={!stripeReady || pendingBillingEvents <= 0}
                className="inline-flex w-fit items-center justify-center rounded-md border border-black/15 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20"
              >
                Webhook再同期を実行
              </button>
            </form>
            {!stripeReady ? (
              <p className="text-xs text-muted-foreground">Stripe環境変数が未設定のため、再同期を実行できません。</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>契約情報</CardTitle>
          <CardDescription>現在の契約状態とご利用プランを確認できます。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>現在プラン: {subscription?.plans?.name ?? "未契約"}</p>
          <p>料金: {formatJpy(subscription?.plans?.monthly_price_jpy)}</p>
          <p>
            契約ステータス: {
              subscription?.status === "active" ? "有効" :
              subscription?.status === "trialing" ? "トライアル中" :
              subscription?.status === "past_due" ? "支払い遅延" :
              subscription?.status === "unpaid" ? "未払い" :
              subscription?.status === "canceled" ? "解約済み" :
              subscription?.status === "paused" ? "一時停止中" :
              subscription?.status ?? "未設定"
            }
          </p>
          <p>契約開始日: {fmtDate(currentPeriodStartDisplay)}</p>
          <p>次回更新日: {fmtDate(currentPeriodEndDisplay)}</p>
          <p>自動更新: {subscription?.cancel_at_period_end ? "停止予約中（期間終了で解約）" : "有効"}</p>
          {!stripeReady ? (
            <p className="rounded-md bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              決済システムのセットアップが完了していません。サポートにお問い合わせください。
            </p>
          ) : null}
        </CardContent>
      </Card>

      {pendingPlanChange && targetPlan ? (
        <Card className="border-amber-300/60 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base">次回更新日の上限チェック</CardTitle>
            <CardDescription>
              {fmtDate(pendingPlanChange.effectiveAt)} から {pendingPlanChange.targetPlanName} が適用されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-amber-900 dark:text-amber-200">
            <p>
              Bot: 現在 {botCount} / 新上限 {targetBotLimit ?? "-"}
              {botsToReduce > 0 ? `（更新日までに ${botsToReduce} 件の整理が必要）` : "（適合）"}
            </p>
            <p>
              PDF/データ容量: 現在 {storageUsedMb.toLocaleString()} MB / 新上限 {targetPlan.max_storage_mb.toLocaleString()} MB
              {storageToReduceMb > 0 ? `（更新日までに ${storageToReduceMb.toLocaleString()} MB の整理が必要）` : "（適合）"}
            </p>
            <p>
              Hosted URL: 現在 {hostedInUse} / 新上限 {targetHostedLimit ?? "-"}
              {hostedToReduce > 0 ? `（更新日までに ${hostedToReduce} 件の整理が必要）` : "（適合）"}
            </p>
            <p>
              API利用: 次プランで {targetPlan.has_api ? "利用可" : "利用不可"}
              {willLoseApi
                ? activeApiKeys > 0
                  ? `（有効APIキー ${activeApiKeys} 件は更新日以降に利用停止）`
                  : "（更新日以降はAPI呼び出し不可）"
                : ""}
            </p>
            <p className="text-xs">
              更新日時点で上限を超過している場合、新規Bot作成・新規PDF追加・再インデックス・Hosted URL利用が停止されます。既存データは削除されません。
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section id="plan-options" className="grid gap-4 lg:grid-cols-3">
        {(["lite", "standard", "pro"] as const).map((code) => {
          const isCurrent = currentCode === code
          const isScheduledTarget = pendingPlanChange?.targetPlanCode === code
          const planChangeLocked = hasScheduledPlanChange || Boolean(pendingPlanChange)
          const disabled = !isEditor || !stripeReady || planChangeLocked
          return (
            <Card
              key={code}
              className={
                isCurrent
                  ? "border-cyan-400/70 bg-cyan-50/60 ring-1 ring-cyan-400/40 dark:border-cyan-500/50 dark:bg-cyan-950/30 dark:ring-cyan-500/30"
                  : isScheduledTarget
                    ? "border-amber-300/70 bg-amber-50/65 ring-1 ring-amber-300/50 dark:border-amber-500/45 dark:bg-amber-950/25 dark:ring-amber-500/30"
                    : "border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80"
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {PLAN_LABELS[code]}
                  {isCurrent ? <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-xs text-white dark:bg-cyan-500">利用中</span> : null}
                  {!isCurrent && isScheduledTarget ? (
                    <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs text-white dark:bg-amber-500 dark:text-slate-950">
                      次回更新日から適用予定
                    </span>
                  ) : null}
                </CardTitle>
                <CardDescription>
                  {code === "lite" ? "¥10,000 / 月" : code === "standard" ? "¥24,800 / 月" : "¥100,000 / 月"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <PlanChangeConfirmButton
                  planCode={code}
                  planLabel={PLAN_LABELS[code]}
                  currentPlanCode={currentCode}
                  currentPlanLabel={subscription?.plans?.name ?? "未契約"}
                  currentPeriodEndLabel={fmtDate(currentPeriodEndDisplay)}
                  disabled={disabled}
                  isCurrent={isCurrent}
                  planChangeLocked={planChangeLocked}
                  isScheduledTarget={isScheduledTarget}
                />
                {!isCurrent && isScheduledTarget ? (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    変更予約済みです。{fmtDate(pendingPlanChange?.effectiveAt)} からこのプランに切り替わります。
                  </p>
                ) : null}
                {!isCurrent && !isScheduledTarget && planChangeLocked ? (
                  <p className="text-[11px] text-muted-foreground">
                    変更予約が登録されているため、次回更新日までは追加のプラン変更操作はできません。
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </section>
      <p className="rounded-md border border-black/20 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300">
        プラン変更ルール: アップグレードは機能を即時反映し、差額を日割りで請求します。ダウングレードは次回更新日から適用され、期間中の返金はありません。
      </p>

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
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
          <div className="grid gap-2 rounded-lg border border-black/20 p-3 text-xs dark:border-white/10">
            <p className="font-medium">請求履歴（最新8件）</p>
            {invoices.length === 0 ? <p className="text-muted-foreground">請求履歴はまだありません。</p> : null}
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {fmtDate(invoice.created ? new Date(invoice.created * 1000).toISOString() : null)} ／ {formatInvoiceAmount(invoice)} ／ {invoice.status === "paid" ? "支払い済み" : invoice.status === "open" ? "未払い" : invoice.status === "void" ? "無効" : invoice.status === "draft" ? "下書き" : invoice.status ?? "-"}
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
          <p>停止予定日: {fmtDate(currentPeriodEndDisplay)}</p>
          <p>注意: 解約予約後も期間終了までは利用可能です。日割り返金は行いません。</p>
          {isCanceled ? (
            <div className="rounded-md border border-amber-400/60 bg-amber-100/80 px-3 py-2 text-xs dark:border-amber-500/40 dark:bg-amber-900/30">
              <p>この契約は解約済みです。再開する場合はプラン契約をやり直してください。</p>
              <a href="#plan-options" className="mt-1 inline-flex text-cyan-700 underline underline-offset-2 dark:text-cyan-300">
                プラン選択へ移動
              </a>
            </div>
          ) : null}
          {!isCanceled && isNotOperational ? (
            <p className="rounded-md border border-amber-400/60 bg-amber-100/80 px-3 py-2 text-xs dark:border-amber-500/40 dark:bg-amber-900/30">
              現在の契約状態では解約予約・再開操作は利用できません。契約状態を確認してください。
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <form action="/api/stripe/subscription/cancel" method="post">
              <button
                type="submit"
                disabled={!canScheduleCancel}
                className="inline-flex items-center justify-center rounded-md bg-rose-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                期間終了で解約予約
              </button>
            </form>
            <form action="/api/stripe/subscription/resume" method="post">
              <button
                type="submit"
                disabled={!canResumeAutoRenew}
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
