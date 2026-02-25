import Link from "next/link"
import { CheckCircle2, Globe, Settings2 } from "lucide-react"

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
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>Bot数</CardDescription>
            <CardTitle>{data.botCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>ソース総数</CardDescription>
            <CardTitle>{data.sourceCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>今月メッセージ</CardDescription>
            <CardTitle>{data.monthlyMessages.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardDescription>チャットログ件数</CardDescription>
            <CardTitle>{data.logsCount.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-5" />
              契約プラン / 提供チャネル
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>契約ステータス: {data.primarySubscription?.status ?? "未設定"}</p>
            <p>次回更新日: {fmtDate(data.primarySubscription?.current_period_end)}</p>
            <p>
              プラン: {data.currentPlan?.name ?? "未契約"} / {data.currentPlan?.monthly_price_jpy?.toLocaleString() ?? "-"} 円
            </p>
            <p>
              Bot上限: {data.currentPlan?.is_bot_limit_display_unlimited ? "無制限表示" : data.currentPlan?.max_bots ?? "-"}
              （内部CAP: {data.currentPlan?.internal_max_bots_cap ?? "-"}）
            </p>
            <p>月間メッセージ上限: {data.currentPlan?.max_monthly_messages?.toLocaleString() ?? "-"}</p>
            <p>今月トークン出力: {data.monthlyTokensOut.toLocaleString()}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {boolBadge(Boolean(data.currentPlan?.has_widget), "Widget可", "Widget不可")}
              {boolBadge(Boolean(data.currentPlan?.has_hosted_page), "Hosted Page可", "Hosted Page不可")}
              {boolBadge(Boolean(data.currentPlan?.has_api), "API可", "API不可")}
              {boolBadge(Boolean(data.currentPlan?.allow_model_selection), "モデル選択可", "モデル選択不可")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle>運用メモ</CardTitle>
            <CardDescription>
              未払い・期限切れ時はボット応答停止、管理画面アクセス継続、データ保持の方針です。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              スパム対策（レート制限 / origin検証 / CAPTCHA）を公開チャネルに適用
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              インデックスは管理画面から手動実行（コスト制御）
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              サポート導線:{" "}
              <Link href="https://make-it-tech.com" className="text-cyan-700 hover:underline dark:text-cyan-300">
                make-it-tech.com
              </Link>
            </p>
            <p className="flex items-center gap-2">
              <Globe className="size-4 text-cyan-600" />
              API公開型と埋め込み型の双方を前提に運用
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
