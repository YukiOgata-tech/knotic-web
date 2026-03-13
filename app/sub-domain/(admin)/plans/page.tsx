import { requirePlatformAdminContext } from "@/app/sub-domain/_lib/data"
import { fetchAllPlansWithLimits } from "@/app/sub-domain/_lib/data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanLimitsForm } from "./plan-limits-form"

function fmtPrice(jpy: number) {
  return jpy.toLocaleString("ja-JP") + " 円/月"
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [ctx, plans] = await Promise.all([
    requirePlatformAdminContext(),
    fetchAllPlansWithLimits(),
  ])
  const params = (await searchParams) ?? {}
  const notice = Array.isArray(params.notice) ? params.notice[0] : (params.notice ?? null)
  const error = Array.isArray(params.error) ? params.error[0] : (params.error ?? null)

  const isOwner = ctx.role === "owner"

  return (
    <div className="grid gap-4">
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>プランリミット管理</CardTitle>
          <CardDescription>
            各プランのbot数・メッセージ数・ストレージなどの上限値を編集します。
            変更は即時反映され、全テナントのリミット判定に影響します。
            {!isOwner && (
              <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                （owner権限のみ編集可能）
              </span>
            )}
          </CardDescription>
        </CardHeader>
        {(notice || error) && (
          <CardContent className="pt-0 pb-3">
            {notice && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                {notice}
              </p>
            )}
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {plans.map((plan) => (
        <Card key={plan.id} className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <Badge variant="outline" className="font-mono text-[11px]">{plan.code}</Badge>
              <span className="text-sm text-muted-foreground">{fmtPrice(plan.monthly_price_jpy)}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Bot上限: <strong>{plan.max_bots}</strong></span>
              <span>月間MSG: <strong>{plan.max_monthly_messages.toLocaleString("ja-JP")}</strong></span>
              <span>Storage: <strong>{plan.max_storage_mb} MB</strong></span>
              <span>Hosting: <strong>{plan.max_hosted_pages}</strong>p</span>
              <span>API: <strong>{plan.has_api ? "○" : "×"}</strong></span>
              <span>HostedPage: <strong>{plan.has_hosted_page ? "○" : "×"}</strong></span>
              {plan.internal_max_bots_cap > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  BotCap: <strong>{plan.internal_max_bots_cap}</strong>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isOwner ? (
              <PlanLimitsForm plan={plan} />
            ) : (
              <p className="text-sm text-muted-foreground">owner権限が必要です。</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
