import Link from "next/link"
import { ArrowRight, Settings2 } from "lucide-react"

import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, requireConsoleContext } from "@/app/console/_lib/data"
import { boolBadge, firstParam, fmtDate } from "@/app/console/_lib/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConsoleOverviewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)
  const issuedApiKey = firstParam(params.issued_api_key)
  const widgetToken = firstParam(params.widget_token)

  const { membership } = await requireConsoleContext()
  if (!membership) return null
  const data = await fetchConsoleData(membership.tenant_id)

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} issuedApiKey={issuedApiKey} widgetToken={widgetToken} />

      {data.notifications.length > 0 && !data.notificationError ? (
        <Card className="border-amber-300/60 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base">通知</CardTitle>
            <CardDescription>上限到達や運用上の重要なお知らせです。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {data.notifications.map((item) => (
              <div key={item.id} className="rounded-md border border-amber-200/70 bg-white/70 p-3 dark:border-amber-600/40 dark:bg-slate-900/50">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>Bot数</CardDescription>
            <CardTitle>{data.botCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>ソース総数</CardDescription>
            <CardTitle>{data.sourceCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>今月メッセージ</CardDescription>
            <CardTitle>{data.monthlyMessages.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>チャットログ件数</CardDescription>
            <CardTitle>{data.logsCount.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-5" />
              契約プラン / 提供チャネル
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>
              プラン: {data.currentPlan?.name ?? "未契約"}{data.currentPlan?.monthly_price_jpy ? ` ／ ${data.currentPlan.monthly_price_jpy.toLocaleString()} 円/月` : ""}
            </p>
            <p>
              契約ステータス: {data.primarySubscription?.status === "active" ? "有効" : data.primarySubscription?.status === "trialing" ? "トライアル中" : data.primarySubscription?.status === "past_due" ? "支払い遅延" : data.primarySubscription?.status === "canceled" ? "解約済み" : data.primarySubscription?.status ?? "未設定"}
            </p>
            <p>次回更新日: {fmtDate(data.primarySubscription?.current_period_end)}</p>
            <p>Bot上限: {data.currentPlan?.is_bot_limit_display_unlimited ? "無制限" : data.currentPlan?.max_bots ?? "-"}</p>
            <p>月間メッセージ上限: {data.currentPlan?.max_monthly_messages?.toLocaleString() ?? "-"}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {boolBadge(Boolean(data.currentPlan?.has_widget), "Widget可", "Widget不可")}
              {boolBadge(Boolean(data.currentPlan?.has_hosted_page), "Hosted Page可", "Hosted Page不可")}
              {boolBadge(Boolean(data.currentPlan?.has_api), "API可", "API不可")}
              {boolBadge(Boolean(data.currentPlan?.allow_model_selection), "モデル選択可", "モデル選択不可")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle>クイックアクセス</CardTitle>
            <CardDescription>よく使う操作へのショートカットです。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {[
              { href: "/console/bots", label: "Bot管理 — Botの作成・設定変更" },
              { href: "/console/operations", label: "運用 — インデックス実行・ソース確認" },
              { href: "/console/api-keys", label: "APIキー — キーの発行・失効" },
              { href: "/console/members", label: "メンバー — 招待リンク発行" },
              { href: "/console/billing", label: "請求・プラン — プラン変更・請求履歴" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2.5 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800/50"
              >
                <span>{item.label}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
