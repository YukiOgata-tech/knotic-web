"use client"

import * as React from "react"
import { Loader2, Settings2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ActionFn = (formData: FormData) => void | Promise<void>

type Props = {
  userEmail: string
  tenantDisplayName: string
  tenantSlug: string
  role: "editor" | "reader"
  isEditor: boolean
  isImpersonating: boolean
  redirectTo: string
  updateTenantProfileAction: ActionFn
  updateAuthEmailAction: ActionFn
  updatePasswordAction: ActionFn
}

type Tab = "tenant" | "account"

function SaveButton({ disabled, label = "保存" }: { disabled: boolean; label?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-fit rounded-full" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          保存中…
        </>
      ) : (
        label
      )}
    </Button>
  )
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "tenant", label: "テナント情報" },
  { id: "account", label: "アカウント" },
]

export function SettingsClient({
  userEmail,
  tenantDisplayName,
  tenantSlug,
  role,
  isEditor,
  isImpersonating,
  redirectTo,
  updateTenantProfileAction,
  updateAuthEmailAction,
  updatePasswordAction,
}: Props) {
  const [activeTab, setActiveTab] = React.useState<Tab>("tenant")

  // ----- email change -----
  const [pendingEmail, setPendingEmail] = React.useState("")
  const [showEmailConfirm, setShowEmailConfirm] = React.useState(false)
  const emailFormRef = React.useRef<HTMLFormElement>(null)

  // ----- password change -----
  const [newPassword, setNewPassword] = React.useState("")
  const [passwordConfirm, setPasswordConfirm] = React.useState("")
  const [passwordMismatch, setPasswordMismatch] = React.useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false)
  const passwordFormRef = React.useRef<HTMLFormElement>(null)

  const [isSubmittingEmail, setIsSubmittingEmail] = React.useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false)

  function handlePasswordSubmit() {
    if (newPassword !== passwordConfirm) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    setShowPasswordConfirm(true)
  }

  return (
    <div className="grid gap-4">

      {/* ヘッダー */}
      <div className="rounded-xl border border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">

        {/* 中段: タイトル + ユーザー情報 */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2.5">
            <Settings2 className="size-5 shrink-0 text-slate-500 dark:text-slate-400" />
            <h1 className="text-xl font-bold tracking-tight">設定</h1>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-8 text-xs text-muted-foreground">
            <span>{userEmail}</span>
            <span className="opacity-25">·</span>
            <span>{tenantDisplayName || tenantSlug}</span>
            <span className="opacity-25">·</span>
            <span>{role === "editor" ? "Editor" : "Reader"}</span>
          </div>
        </div>

        {/* 下段: タブ */}
        <div className="overflow-x-auto border-t border-black/10 px-3 pb-3 pt-2 dark:border-white/8">
          <div className="inline-flex min-w-full gap-0.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-all",
                    active
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* テナント情報タブ */}
      {activeTab === "tenant" && (
        <div className="rounded-xl border border-black/20 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/80">
          <div className="mb-4 grid gap-1">
            <p className="text-sm font-semibold">テナント情報</p>
            <p className="text-xs text-muted-foreground">組織名を変更できます。テナントIDは変更できません。</p>
          </div>
          <form action={updateTenantProfileAction} className="grid gap-3">
            <input type="hidden" name="redirect_to" value={redirectTo} />
            <div className="grid gap-1.5">
              <Label htmlFor="tenant_slug">テナントID</Label>
              <Input id="tenant_slug" value={tenantSlug} readOnly disabled />
              <p className="text-[11px] text-muted-foreground">テナントIDは変更できません。</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="display_name">組織名</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={tenantDisplayName}
                disabled={!isEditor || isImpersonating}
              />
            </div>
            <SaveButton disabled={!isEditor || isImpersonating} />
          </form>
        </div>
      )}

      {/* アカウントタブ */}
      {activeTab === "account" && (
        <div className="grid gap-4">

          {/* メールアドレス変更 */}
          <div className="rounded-xl border border-black/20 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/80">
            <div className="mb-4 grid gap-1">
              <p className="text-sm font-semibold">ログインメールアドレス</p>
              <p className="text-xs text-muted-foreground">
                変更後、確認メールが送信されます。リンクを承認すると新しいアドレスが有効になります。
              </p>
            </div>
            <form ref={emailFormRef} action={updateAuthEmailAction} className="grid gap-3">
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <div className="grid gap-1.5">
                <Label>現在のメールアドレス</Label>
                <p className="rounded-md border border-black/10 bg-slate-50 px-3 py-2 text-sm text-muted-foreground dark:border-white/8 dark:bg-slate-800/50">
                  {userEmail}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">新しいメールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="new@example.com"
                  value={pendingEmail}
                  onChange={(e) => setPendingEmail(e.target.value)}
                  disabled={isImpersonating}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-fit rounded-full"
                disabled={isImpersonating || !pendingEmail || pendingEmail === userEmail}
                onClick={() => setShowEmailConfirm(true)}
              >
                メールアドレスを変更
              </Button>
            </form>
          </div>

          {/* パスワード変更 */}
          <div className="rounded-xl border border-black/20 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/80">
            <div className="mb-4 grid gap-1">
              <p className="text-sm font-semibold">パスワード変更</p>
              <p className="text-xs text-muted-foreground">
                8文字以上で設定してください。変更後は新しいパスワードでログインします。
              </p>
            </div>
            <form ref={passwordFormRef} action={updatePasswordAction} className="grid gap-3">
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <div className="grid gap-1.5">
                <Label htmlFor="password">新しいパスワード</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordMismatch(false)
                  }}
                  disabled={isImpersonating}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password_confirm">新しいパスワード（確認）</Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value)
                    setPasswordMismatch(false)
                  }}
                  disabled={isImpersonating}
                  className={passwordMismatch ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {passwordMismatch ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">パスワードが一致しません。</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-fit rounded-full"
                disabled={isImpersonating || !newPassword || !passwordConfirm}
                onClick={handlePasswordSubmit}
              >
                パスワードを変更
              </Button>
            </form>
          </div>

        </div>
      )}

      {/* メール変更 確認モーダル */}
      {showEmailConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-black/20 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-900">
            <p className="font-semibold">メールアドレスを変更しますか？</p>
            <div className="mt-3 rounded-lg border border-black/10 bg-slate-50 px-3 py-2.5 text-sm dark:border-white/8 dark:bg-slate-800/60">
              <p className="text-xs text-muted-foreground">変更先</p>
              <p className="mt-0.5 font-medium">{pendingEmail}</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              確認メールが送信されます。メール内のリンクを承認すると変更が完了します。承認前は現在のアドレスでログインできます。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-black/15 px-4 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:border-white/20 dark:hover:bg-slate-800"
                onClick={() => setShowEmailConfirm(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                disabled={isSubmittingEmail}
                onClick={() => {
                  setIsSubmittingEmail(true)
                  emailFormRef.current?.requestSubmit()
                  setShowEmailConfirm(false)
                }}
              >
                {isSubmittingEmail && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                変更する
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* パスワード変更 確認モーダル */}
      {showPasswordConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-black/20 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-900">
            <p className="font-semibold">パスワードを変更しますか？</p>
            <p className="mt-3 text-xs text-muted-foreground">
              新しいパスワードでのログインが有効になります。他のデバイスでのセッションが無効になる場合があります。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-black/15 px-4 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:border-white/20 dark:hover:bg-slate-800"
                onClick={() => setShowPasswordConfirm(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-sm text-white transition-colors hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                disabled={isSubmittingPassword}
                onClick={() => {
                  setIsSubmittingPassword(true)
                  passwordFormRef.current?.requestSubmit()
                  setShowPasswordConfirm(false)
                }}
              >
                {isSubmittingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                変更する
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}
