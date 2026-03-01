import { createApiKeyAction, revokeApiKeyAction } from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, requireConsoleContext } from "@/app/console/_lib/data"
import { boolBadge, firstParam, fmtDate } from "@/app/console/_lib/ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConsoleApiKeysPage({ searchParams }: PageProps) {
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

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>APIキー管理（契約者公開用）</CardTitle>
          <CardDescription>LINE連携などは顧客側API実装前提。キーは顧客側サーバーのみで保管してください。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {data.apiKeyError ? (
            <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              tenant_api_keys テーブルが未作成です。`supabase/patch-20260224-console-management.sql` を適用してください。
            </p>
          ) : null}

          <form action={createApiKeyAction} className="grid gap-3 rounded-xl border border-black/20 p-4 dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/api-keys" />
            <h3 className="font-medium">新規APIキー発行</h3>
            <Input name="name" placeholder="用途名（例: line-prod）" required disabled={!isEditor} />
            <Input name="expires_at" type="datetime-local" disabled={!isEditor} />
            <Button type="submit" className="w-fit rounded-full" disabled={!isEditor}>
              APIキーを発行
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>最終利用</TableHead>
                <TableHead>有効期限</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>
                    {key.key_prefix}...{key.key_last4}
                  </TableCell>
                  <TableCell>{boolBadge(Boolean(key.is_active), "有効", "無効")}</TableCell>
                  <TableCell>{fmtDate(key.last_used_at)}</TableCell>
                  <TableCell>{fmtDate(key.expires_at)}</TableCell>
                  <TableCell>
                    <form action={revokeApiKeyAction}>
                      <input type="hidden" name="redirect_to" value="/console/api-keys" />
                      <input type="hidden" name="key_id" value={key.id} />
                      <Button type="submit" size="sm" variant="outline" disabled={!isEditor || !key.is_active}>
                        失効
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
