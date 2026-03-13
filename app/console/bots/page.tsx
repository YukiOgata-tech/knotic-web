import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"

import {
  createBotAction,
} from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam } from "@/app/console/_lib/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/ui/copy-button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getAppUrl } from "@/lib/env"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function botSettingsPath(botName: string, publicId: string) {
  const slug = botName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `/console/bots/${slug || "bot"}--${publicId}`
}

export default async function ConsoleBotsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)
  const issuedApiKey = firstParam(params.issued_api_key)
  const widgetToken = firstParam(params.widget_token)
  const widgetBotPublicId = firstParam(params.widget_bot_public_id)
  const appUrl = getAppUrl().replace(/\/$/, "")

  const { membership } = await requireConsoleContext()
  if (!membership) return null
  const data = await fetchConsoleData(membership.tenant_id)
  const isEditor = membership.role === "editor"
  const botLimit = data.currentPlan
    ? data.currentPlan.internal_max_bots_cap > 0
      ? Math.min(data.currentPlan.max_bots, data.currentPlan.internal_max_bots_cap)
      : data.currentPlan.max_bots
    : null
  const botOverCount = botLimit !== null ? Math.max(0, data.botCount - botLimit) : 0
  const hostedCandidates = data.bots
    .filter(
      (bot) =>
        bot.status !== "archived" &&
        (Boolean(bot.is_public) || bot.access_mode === "internal" || Boolean(bot.require_auth_for_hosted))
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const hostedLimit =
    data.currentPlan?.has_hosted_page && typeof data.currentPlan.max_hosted_pages === "number"
      ? Math.max(0, data.currentPlan.max_hosted_pages)
      : 0
  const hostedAllowed = hostedCandidates.slice(0, hostedLimit)
  const hostedOverflow = hostedCandidates.slice(hostedLimit)
  const widgetConfiguredCount = data.bots.filter((bot) => {
    const token = data.tokenByBotId.get(bot.id)
    return Boolean(token && (token.allowed_origins?.length ?? 0) > 0)
  }).length

  const widgetSnippet =
    widgetToken && widgetBotPublicId
      ? `<script src=\"${appUrl}/widget.js\" data-bot-id=\"${widgetBotPublicId}\" data-widget-token=\"${widgetToken}\"></script>`
      : null

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} issuedApiKey={issuedApiKey} widgetToken={widgetToken} />

      {widgetSnippet ? (
        <Card className="border-cyan-200/60 bg-cyan-50/80 dark:border-cyan-900/50 dark:bg-cyan-950/30">
          <CardHeader>
            <CardTitle className="text-base">Widget埋め込みコード（この表示時に控えてください）</CardTitle>
            <CardDescription>
              契約者サイトに以下のscriptタグを貼り付けると、ボタン起動のWidgetチャットを表示できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex justify-end">
              <CopyButton value={widgetSnippet} label="スクリプトをコピー" />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-cyan-200/70 bg-white/80 p-3 text-xs dark:border-cyan-800/60 dark:bg-slate-900/70">
              <code>{widgetSnippet}</code>
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>Bot管理</CardTitle>
          <CardDescription>Bot作成と各Bot設定画面への導線を管理します。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-xl border border-black/20 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-slate-900/50">
            <p>
              Hosted URL: {hostedCandidates.length}
              {data.currentPlan?.has_hosted_page ? ` / 上限 ${hostedLimit}` : " / 0 (対象外)"}
              {hostedOverflow.length > 0 ? `（${hostedOverflow.length} 件が対象外）` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              超過時は作成順で上限内のBotのみ利用可能です。
            </p>
            {hostedAllowed.length > 0 ? (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                利用可能: {hostedAllowed.map((bot) => bot.name).join(" / ")}
              </p>
            ) : null}
            {hostedOverflow.length > 0 ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                上限超過で対象外: {hostedOverflow.map((bot) => bot.name).join(" / ")}
              </p>
            ) : null}

            <div className="my-2 border-b"/>

            <p className="font-medium text-cyan-900 dark:text-cyan-100">
              Widget導入（ {widgetConfiguredCount}/{data.bots.length} Bot ）
            </p>
          </div>

          {/* モバイル: カードリスト */}
          <div className="grid gap-2 sm:hidden">
            {data.bots.map((bot) => {
              const token = data.tokenByBotId.get(bot.id)
              return (
                <div key={bot.id} className="rounded-lg border border-black/20 p-3 dark:border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={botSettingsPath(bot.name, bot.public_id)}
                        className="font-medium text-cyan-700 hover:underline dark:text-cyan-300"
                      >
                        {bot.name}
                      </Link>
                      <p className="truncate text-[11px] text-muted-foreground">{bot.public_id}</p>
                    </div>
                    <Link
                      href={botSettingsPath(bot.name, bot.public_id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      設定
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant={Boolean(bot.is_public) ? "secondary" : "outline"}>
                      {bot.is_public ? "有効" : "無効"}
                    </Badge>
                    <Badge variant={token ? "secondary" : "outline"} className="text-[10px]">
                      {token ? "Widget発行済" : "Widget未発行"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {bot.status === "active" ? "稼働中" : bot.status === "archived" ? "アーカイブ" : bot.status}
                    </span>
                  </div>
                  {data.currentPlan?.has_hosted_page ? (
                    <Link
                      href={`/chat-by-knotic/${bot.public_id}`}
                      className="mt-1.5 flex items-center gap-1 truncate text-[11px] text-cyan-700 hover:underline dark:text-cyan-300"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      /chat-by-knotic/{bot.public_id}
                    </Link>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* デスクトップ: テーブル */}
          <div className="hidden overflow-x-auto sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className=" gap-0.5">
                    <span>Bot</span>
                    <span className="text-[11px] font-normal text-muted-foreground ml-1">
                      数: {data.botCount}
                      {botLimit !== null ? ` / 上限 ${botLimit}` : ""}
                      {botOverCount > 0 ? `（${botOverCount} 件超過）` : ""}
                    </span>
                  </div>
                </TableHead>
                <TableHead>状態</TableHead>
                <TableHead>Hosted URL (公開URL)</TableHead>
                <TableHead className="text-right">遷移</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bots.map((bot) => {
                const token = data.tokenByBotId.get(bot.id)
                return (
                  <TableRow key={bot.id}>
                    <TableCell className="max-w-40">
                      <Link
                        href={botSettingsPath(bot.name, bot.public_id)}
                        className="font-medium text-cyan-700 hover:underline dark:text-cyan-300"
                      >
                        {bot.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{bot.public_id}</p>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <p>{bot.status === "active" ? "稼働中" : bot.status === "archived" ? "アーカイブ" : bot.status}</p>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={Boolean(bot.is_public) ? "secondary" : "outline"}>
                          {bot.is_public ? "有効" : "無効"}
                        </Badge>
                        <Badge variant={token ? "secondary" : "outline"}>
                          {token ? "Widgetトークン発行済み" : "Widgetトークン未発行"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-50">
                      {data.currentPlan?.has_hosted_page ? (
                        <Link
                          href={`/chat-by-knotic/${bot.public_id}`}
                          className="inline-flex items-center gap-1 truncate text-sm text-cyan-700 hover:underline dark:text-cyan-300"
                        >
                          /chat-by-knotic/{bot.public_id}
                          <ExternalLink className="size-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">*対象外</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={botSettingsPath(bot.name, bot.public_id)}
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Bot設定を開く
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>

          <form action={createBotAction} className="grid gap-3 rounded-xl border border-black/20 p-4 dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/bots" />
            <h3 className="font-medium">新規Bot作成</h3>
            <Input name="name" placeholder="Bot名（例:会社FAQボット）" required disabled={!isEditor} />
            <Textarea name="description" placeholder="Botの説明（任意）" disabled={!isEditor} />
            <Button type="submit" className="w-fit rounded-full" disabled={!isEditor}>
              Botを作成
            </Button>
          </form>

          {/* <div className="grid gap-2 rounded-lg border border-black/20 p-3 text-xs text-muted-foreground dark:border-white/10">
            <div className="flex items-center gap-2">
              <Badge variant="outline">運用メモ</Badge>
            </div>
            <p>有効/無効とHostedアクセスモードは別管理です。有効でも access_mode=internal ならログインが必要です。</p>
            <p>Widgetはトークンで実行され、origin制限は `許可オリジン` で制御します。</p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  )
}
