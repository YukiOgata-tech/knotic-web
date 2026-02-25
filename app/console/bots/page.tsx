import Link from "next/link"
import { ExternalLink } from "lucide-react"

import {
  createBotAction,
  rotateWidgetTokenAction,
  toggleBotPublicAction,
  updateAllowedOriginsAction,
} from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam } from "@/app/console/_lib/ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConsoleBotsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)
  const issuedApiKey = firstParam(params.issued_api_key)
  const widgetToken = firstParam(params.widget_token)

  const { membership } = await requireConsoleContext()
  if (!membership) return null
  const data = await fetchConsoleData(membership.tenant_id)
  const isEditor = membership.role === "editor"

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} issuedApiKey={issuedApiKey} widgetToken={widgetToken} />

      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>Bot管理</CardTitle>
          <CardDescription>作成・公開切替・Hosted URL/Widget設定を管理します。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={createBotAction} className="grid gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/bots" />
            <h3 className="font-medium">新規Bot作成</h3>
            <Input name="name" placeholder="Bot名（例: 会社FAQボット）" required disabled={!isEditor} />
            <Textarea name="description" placeholder="Botの説明（任意）" disabled={!isEditor} />
            <Button type="submit" className="w-fit rounded-full" disabled={!isEditor}>
              Botを作成
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bot</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>公開</TableHead>
                <TableHead>Hosted URL</TableHead>
                <TableHead>Widget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bots.map((bot) => {
                const token = data.tokenByBotId.get(bot.id)
                return (
                  <TableRow key={bot.id}>
                    <TableCell>
                      <p className="font-medium">{bot.name}</p>
                      <p className="text-xs text-muted-foreground">{bot.public_id}</p>
                    </TableCell>
                    <TableCell>{bot.status}</TableCell>
                    <TableCell>
                      <form action={toggleBotPublicAction}>
                        <input type="hidden" name="redirect_to" value="/console/bots" />
                        <input type="hidden" name="bot_id" value={bot.id} />
                        <input type="hidden" name="next_public" value={String(!bot.is_public)} />
                        <Button type="submit" size="sm" variant={bot.is_public ? "secondary" : "outline"} disabled={!isEditor}>
                          {bot.is_public ? "公開中" : "非公開"}
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      {data.currentPlan?.has_hosted_page ? (
                        <Link
                          href={`/b/${bot.public_id}`}
                          className="inline-flex items-center gap-1 text-cyan-700 hover:underline dark:text-cyan-300"
                        >
                          /b/{bot.public_id}
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">プラン対象外</span>
                      )}
                    </TableCell>
                    <TableCell className="space-y-2">
                      <form action={rotateWidgetTokenAction}>
                        <input type="hidden" name="redirect_to" value="/console/bots" />
                        <input type="hidden" name="bot_id" value={bot.id} />
                        <Button type="submit" size="sm" variant="outline" disabled={!isEditor}>
                          トークン再発行
                        </Button>
                      </form>
                      {token ? (
                        <form action={updateAllowedOriginsAction} className="grid gap-1">
                          <input type="hidden" name="redirect_to" value="/console/bots" />
                          <input type="hidden" name="token_id" value={token.id} />
                          <Input
                            name="allowed_origins"
                            defaultValue={(token.allowed_origins ?? []).join(", ")}
                            placeholder="https://example.com, https://www.example.com"
                            disabled={!isEditor}
                          />
                          <Button type="submit" size="sm" variant="secondary" disabled={!isEditor}>
                            許可オリジン更新
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">未発行</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
