import { createPromoCodeAction, deletePromoCodeAction, togglePromoCodeActiveAction } from "@/app/sub-domain/actions"
import { requirePlatformAdminContext } from "@/app/sub-domain/_lib/data"
import { ConfirmSubmitButton } from "@/app/sub-domain/_components/confirm-submit-button"
import { createAdminClient } from "@/lib/supabase/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("ja-JP")
}

type PromoCodeRow = {
  id: string
  code: string
  description: string | null
  trial_days: number
  plan_code: string | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  await requirePlatformAdminContext()

  const params = (await searchParams) ?? {}
  const notice = Array.isArray(params.notice) ? params.notice[0] : (params.notice ?? null)
  const error = Array.isArray(params.error) ? params.error[0] : (params.error ?? null)

  const admin = createAdminClient()
  const { data: codes } = await admin
    .from("promo_codes")
    .select("id, code, description, trial_days, plan_code, max_uses, used_count, expires_at, is_active, created_at")
    .order("created_at", { ascending: false })

  const rows = (codes ?? []) as PromoCodeRow[]

  return (
    <div className="grid gap-4">
      {/* ── コード一覧 ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>招待コード一覧</CardTitle>
          <CardDescription>
            イベント等で配布する招待コードを管理します。有効なコードを入力した顧客はStripe契約時に無料トライアルが付与されます。
          </CardDescription>
        </CardHeader>

        {(notice || error) ? (
          <CardContent className="pb-3 pt-0">
            {notice ? (
              <p className="rounded-md border border-emerald-300/40 bg-emerald-100/60 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-200">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md border border-red-300/40 bg-red-100/60 px-3 py-2 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </p>
            ) : null}
          </CardContent>
        ) : null}

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              招待コードがまだありません。下のフォームから作成してください。
            </p>
          ) : (
            <>
              {/* モバイル: カードリスト */}
              <div className="grid gap-2 p-4 sm:hidden">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono font-semibold">{row.code}</p>
                        {row.description ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.description}</p>
                        ) : null}
                      </div>
                      <Badge variant={row.is_active ? "default" : "secondary"}>
                        {row.is_active ? "有効" : "無効"}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <span>トライアル: {row.trial_days}日間</span>
                      <span>使用: {row.used_count}{row.max_uses !== null ? ` / ${row.max_uses}` : ""} 回</span>
                      <span>対象プラン: {row.plan_code ?? "全て"}</span>
                      <span>有効期限: {fmtDate(row.expires_at)}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <form action={togglePromoCodeActiveAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="is_active" value={String(!row.is_active)} />
                        <Button type="submit" variant="outline" size="sm" className="h-7 text-xs">
                          {row.is_active ? "無効化" : "有効化"}
                        </Button>
                      </form>
                      <form action={deletePromoCodeAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmitButton
                          description={`コード「${row.code}」を削除します。この操作は取り消せません。よろしいですか？`}
                          confirmLabel="削除する"
                          destructive
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          削除
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>

              {/* デスクトップ: テーブル */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>コード</TableHead>
                      <TableHead>トライアル</TableHead>
                      <TableHead>使用回数</TableHead>
                      <TableHead>対象プラン</TableHead>
                      <TableHead>有効期限</TableHead>
                      <TableHead>状態</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-mono font-semibold">{row.code}</p>
                          {row.description ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{row.description}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>{row.trial_days}日間</TableCell>
                        <TableCell>
                          {row.used_count}
                          {row.max_uses !== null ? (
                            <span className="text-muted-foreground"> / {row.max_uses}</span>
                          ) : null}
                        </TableCell>
                        <TableCell>{row.plan_code ?? <span className="text-muted-foreground">全プラン</span>}</TableCell>
                        <TableCell>{fmtDate(row.expires_at)}</TableCell>
                        <TableCell>
                          <Badge variant={row.is_active ? "default" : "secondary"}>
                            {row.is_active ? "有効" : "無効"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <form action={togglePromoCodeActiveAction}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="is_active" value={String(!row.is_active)} />
                              <Button type="submit" variant="outline" size="sm" className="h-7 text-xs">
                                {row.is_active ? "無効化" : "有効化"}
                              </Button>
                            </form>
                            <form action={deletePromoCodeAction}>
                              <input type="hidden" name="id" value={row.id} />
                              <ConfirmSubmitButton
                                description={`コード「${row.code}」を削除します。この操作は取り消せません。よろしいですか？`}
                                confirmLabel="削除する"
                                destructive
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                              >
                                削除
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── 新規作成フォーム ── */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle>招待コードを新規作成</CardTitle>
          <CardDescription>
            コードは自動的に大文字に変換されます。英数字・ハイフン・アンダースコアが使用できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPromoCodeAction} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  コード <span className="text-red-500">*</span>
                </label>
                <Input
                  name="code"
                  placeholder="例: NIIGATA2026"
                  required
                  className="uppercase placeholder:normal-case"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  トライアル日数 <span className="text-red-500">*</span>
                </label>
                <Input name="trial_days" type="number" min={1} max={365} defaultValue={14} required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">説明（管理用メモ）</label>
              <Input name="description" placeholder="例: 新潟守成クラブ 2026年4月" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  対象プラン（空白=全プラン）
                </label>
                <select
                  name="plan_code"
                  className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
                  defaultValue=""
                >
                  <option value="">全プラン対象</option>
                  <option value="starter">Starter</option>
                  <option value="lite">Lite</option>
                  <option value="standard">Standard</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  最大使用回数（空白=無制限）
                </label>
                <Input name="max_uses" type="number" min={1} placeholder="例: 30" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  有効期限（空白=無期限）
                </label>
                <Input name="expires_at" type="date" />
              </div>
            </div>

            <ConfirmSubmitButton description="入力内容で招待コードを作成します。よろしいですか？">
              招待コードを作成
            </ConfirmSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
