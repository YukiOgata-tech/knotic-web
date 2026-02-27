import {
  saveAiSettingsAction,
  updateAuthEmailAction,
  updatePasswordAction,
  updateTenantProfileAction,
} from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import { fetchConsoleData, requireConsoleContext } from "@/app/console/_lib/data"
import { firstParam } from "@/app/console/_lib/ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const MODEL_OPTIONS = ["5-nano", "5-mini", "5", "4o-mini", "4o"] as const

export default async function ConsoleSettingsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)
  const issuedApiKey = firstParam(params.issued_api_key)
  const widgetToken = firstParam(params.widget_token)

  const { supabase, user, membership, impersonation } = await requireConsoleContext()
  if (!membership) return null

  const data = await fetchConsoleData(membership.tenant_id)
  const isEditor = membership.role === "editor"
  const isImpersonating = Boolean(impersonation?.active)

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("display_name, slug")
    .eq("id", membership.tenant_id)
    .maybeSingle()

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} issuedApiKey={issuedApiKey} widgetToken={widgetToken} />

      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>テナント情報</CardTitle>
          <CardDescription>テナント名を更新できます。slugは固定です。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <form action={updateTenantProfileAction} className="grid gap-3">
            <input type="hidden" name="redirect_to" value="/console/settings" />
            <div className="grid gap-1.5">
              <Label htmlFor="tenant_slug">テナントslug（固定）</Label>
              <Input id="tenant_slug" value={tenantRow?.slug ?? "-"} readOnly disabled />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="display_name">テナント名</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={tenantRow?.display_name ?? ""}
                disabled={!isEditor || isImpersonating}
              />
            </div>
            <Button type="submit" className="w-fit rounded-full" disabled={!isEditor || isImpersonating}>
              テナント情報を保存
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>アカウント情報（Supabase Auth）</CardTitle>
          <CardDescription>
            ログインメールとパスワードを更新します。メール変更時は確認メールの承認が必要になる場合があります。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm">
          <form action={updateAuthEmailAction} className="grid gap-3 border-b border-black/10 pb-5 dark:border-white/10">
            <input type="hidden" name="redirect_to" value="/console/settings" />
            <div className="grid gap-1.5">
              <Label htmlFor="email">ログインメールアドレス</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email ?? ""} disabled={isImpersonating} />
            </div>
            <Button type="submit" variant="outline" className="w-fit rounded-full" disabled={isImpersonating}>
              メールアドレス変更を保存
            </Button>
          </form>

          <form action={updatePasswordAction} className="grid gap-3">
            <input type="hidden" name="redirect_to" value="/console/settings" />
            <div className="grid gap-1.5">
              <Label htmlFor="password">新しいパスワード</Label>
              <Input id="password" name="password" type="password" minLength={8} disabled={isImpersonating} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password_confirm">新しいパスワード（確認）</Label>
              <Input id="password_confirm" name="password_confirm" type="password" minLength={8} disabled={isImpersonating} />
            </div>
            <Button type="submit" variant="outline" className="w-fit rounded-full" disabled={isImpersonating}>
              パスワードを変更
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>AI設定</CardTitle>
          <CardDescription>モデル設定のみ管理します。実際のAPIシークレットはサーバー内部で管理します。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {data.aiSettingsError && (
            <p className="text-amber-700 dark:text-amber-400">
              tenants のAI設定カラムが未適用です。table-consolidation patch適用後に保存可能になります。
            </p>
          )}
          <form action={saveAiSettingsAction} className="grid gap-3">
            <input type="hidden" name="redirect_to" value="/console/settings" />
            <div className="grid gap-1.5">
              <Label htmlFor="default_model">デフォルトモデル</Label>
              <select
                id="default_model"
                name="default_model"
                className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
                defaultValue={(data.aiSettings as { default_model?: string } | null)?.default_model ?? "5-mini"}
                disabled={!isEditor || isImpersonating}
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fallback_model">フォールバックモデル</Label>
              <select
                id="fallback_model"
                name="fallback_model"
                className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
                defaultValue={(data.aiSettings as { fallback_model?: string } | null)?.fallback_model ?? ""}
                disabled={!isEditor || isImpersonating}
              >
                <option value="">なし</option>
                {MODEL_OPTIONS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="max_output_tokens">最大出力トークン</Label>
              <Input
                id="max_output_tokens"
                name="max_output_tokens"
                type="number"
                min={200}
                max={4000}
                defaultValue={String((data.aiSettings as { max_output_tokens?: number } | null)?.max_output_tokens ?? 1200)}
                disabled={!isEditor || isImpersonating}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allow_model_override"
                defaultChecked={Boolean((data.aiSettings as { allow_model_override?: boolean } | null)?.allow_model_override)}
                disabled={!isEditor || isImpersonating}
              />
              ボットごとのモデル上書きを許可
            </label>
            <Button type="submit" className="w-fit rounded-full" disabled={!isEditor || isImpersonating}>
              AI設定を保存
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}