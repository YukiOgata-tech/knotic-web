"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Loader2, MailCheck, X } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProcessingOverlay } from "@/components/ui/processing-overlay"

type SignupMode = "owner" | "member"

export function SignupForm({ mode = "owner" }: { mode?: SignupMode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [showVerifyModal, setShowVerifyModal] = React.useState(false)

  const next = searchParams.get("next") ?? "/console"

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ??
        (typeof window !== "undefined" ? window.location.origin : "")
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName,
            company_name: companyName,
            account_type: mode === "owner" ? "owner" : "member",
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.session) {
        router.push(next)
        router.refresh()
        return
      }

      setMessage(
        mode === "owner"
          ? "確認メールを送信しました。認証後にオーナーテナントを作成できます。"
          : "確認メールを送信しました。認証後にテナント作成または招待参加を選択できます。"
      )
      setShowVerifyModal(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="full-name">担当者名</Label>
          <Input
            id="full-name"
            required
            autoComplete="name"
            placeholder="山田 太郎"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="company-name">会社名 / 組織名</Label>
          <Input
            id="company-name"
            required={mode === "owner"}
            autoComplete="organization"
            placeholder="株式会社サンプル"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8文字以上"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}

        <Button className="rounded-full" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              作成中...
            </span>
          ) : mode === "owner" ? (
            "テナントオーナーとして作成"
          ) : (
            "knoticユーザーを作成"
          )}
        </Button>
        <Button asChild variant="ghost" className="rounded-full" disabled={loading}>
          <Link href="/login">既にアカウントをお持ちの方はこちら</Link>
        </Button>
      </form>

      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent
          className="max-w-[calc(100%-1rem)] rounded-2xl p-0 sm:max-w-xl"
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <div className="relative overflow-hidden rounded-2xl border border-cyan-200/70 bg-[linear-gradient(180deg,#ecfeff_0%,#ffffff_34%,#f8fafc_100%)] p-4 sm:p-6 dark:border-cyan-800/60 dark:bg-[linear-gradient(180deg,#0b1628_0%,#0f172a_45%,#0b1220_100%)]">
            <DialogClose asChild>
              <button
                type="button"
                aria-label="閉じる"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/20 bg-white/70 text-zinc-700 hover:bg-white dark:border-white/20 dark:bg-slate-900/75 dark:text-zinc-200 dark:hover:bg-slate-900"
              >
                <X className="size-4" />
              </button>
            </DialogClose>

            <DialogHeader className="gap-3 pr-9 text-left">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                <MailCheck className="size-6" />
              </div>
              <DialogTitle className="text-xl leading-7 sm:text-2xl">確認メールをチェックしてください</DialogTitle>
              <DialogDescription className="text-sm leading-6 sm:text-base">
                アカウント作成は完了しました。送信先メールに届いた確認URLをクリックして認証を完了してください。
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 rounded-xl border border-cyan-200/70 bg-white/90 p-3 text-sm leading-6 dark:border-cyan-800/50 dark:bg-slate-900/70">
              <p className="font-medium">送信先メール:</p>
              <p className="mt-1 break-all font-mono text-xs sm:text-sm">{email}</p>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                メールが見つからない場合は、迷惑メールフォルダも確認してください。
              </p>
            </div>

            <DialogFooter className="mt-5 flex-col gap-2 sm:flex-row sm:justify-end">
              <DialogClose asChild>
                <Button className="w-full rounded-full sm:w-auto">メールを確認しました</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="outline" className="w-full rounded-full sm:w-auto">
                  閉じる
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ProcessingOverlay
        open={loading}
        title="アカウントを作成しています"
        description="認証情報を安全に登録中です。完了までこのままお待ちください。"
      />
    </>
  )
}
