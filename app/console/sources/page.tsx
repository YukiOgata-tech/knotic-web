import { addPdfSourceAction, addUrlSourceAction, queueIndexAction, runIndexingWorkerAction } from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam } from "@/app/console/_lib/ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConsoleSourcesPage({ searchParams }: PageProps) {
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
          <CardTitle>ナレッジ投入 / インデックス実行</CardTitle>
          <CardDescription>URL追加後、管理画面から手動でインデックス実行します（コスト制御方針）。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={runIndexingWorkerAction} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/sources" />
            <h3 className="font-medium">キュー実行（開発用）</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              queued のジョブを1件実行します。将来はCron/Workerから `POST /api/internal/indexing/run` を呼び出します。
            </p>
            <Button type="submit" className="mt-3 rounded-full" disabled={!isEditor}>
              キューを1件実行
            </Button>
          </form>

          <form action={addUrlSourceAction} className="grid gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/sources" />
            <h3 className="font-medium">URLソース追加</h3>
            <Label htmlFor="bot_id">対象Bot</Label>
            <select
              id="bot_id"
              name="bot_id"
              className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
              required
              disabled={!isEditor}
            >
              <option value="">Botを選択</option>
              {data.bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
            <Input name="url" type="url" placeholder="https://example.com/sitemap.xml or page URL" required disabled={!isEditor} />
            <Button type="submit" className="w-fit rounded-full" disabled={!isEditor}>
              URLソースを追加
            </Button>
          </form>

          <form
            action={addPdfSourceAction}
            className="grid gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
          >
            <input type="hidden" name="redirect_to" value="/console/sources" />
            <h3 className="font-medium">PDFソース追加</h3>
            <Label htmlFor="pdf_bot_id">対象Bot</Label>
            <select
              id="pdf_bot_id"
              name="bot_id"
              className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
              required
              disabled={!isEditor}
            >
              <option value="">Botを選択</option>
              {data.bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
            <Label htmlFor="pdf">PDFファイル</Label>
            <Input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" required disabled={!isEditor} />
            <p className="text-xs text-muted-foreground">
              1ファイル20MBまで。Storageバケット `source-files` に保存されます。
            </p>
            <Button type="submit" className="w-fit rounded-full" disabled={!isEditor}>
              PDFソースを追加
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            現在の実装では、URL追加は「対象URLの登録」までです。サイトマップ展開や再帰クロール処理はワーカー実装が別途必要です。
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Bot</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sources.map((source) => {
                const bot = data.bots.find((item) => item.id === source.bot_id)
                return (
                  <TableRow key={source.id}>
                    <TableCell className="max-w-[320px] truncate">{source.url ?? source.file_name ?? "-"}</TableCell>
                    <TableCell>{bot?.name ?? "-"}</TableCell>
                    <TableCell>{source.type}</TableCell>
                    <TableCell>{source.status}</TableCell>
                    <TableCell>
                      <form action={queueIndexAction}>
                        <input type="hidden" name="redirect_to" value="/console/sources" />
                        <input type="hidden" name="source_id" value={source.id} />
                        <input type="hidden" name="bot_id" value={source.bot_id ?? ""} />
                        <Button type="submit" size="sm" variant="outline" disabled={!isEditor}>
                          インデックス実行
                        </Button>
                      </form>
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
