"use client"

import Link from "next/link"
import * as React from "react"
import { Loader2, MailCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type State = "idle" | "loading" | "sent" | "error"

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState<State>("idle")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("loading")
    setErrorMsg(null)

    try {
      const supabase = createClient()
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      })

      if (error) {
        setErrorMsg(error.message)
        setState("error")
        return
      }

      setState("sent")
    } catch {
      setErrorMsg("エラーが発生しました。時間をおいてもう一度お試しください。")
      setState("error")
    }
  }

  if (state === "sent") {
    return (
      <div className="grid gap-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
          <MailCheck className="size-6" />
        </div>
        <div className="grid gap-1">
          <p className="font-medium">メールを送信しました</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{email}</span> に再設定用URLを送信しました。
            メールが届かない場合は迷惑メールフォルダをご確認ください。
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/login">ログインページに戻る</Link>
        </Button>
      </div>
    )
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="email">登録済みメールアドレス</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "loading"}
        />
      </div>

      {state === "error" && errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <Button className="rounded-full" disabled={state === "loading"}>
        {state === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            送信中...
          </span>
        ) : (
          "再設定メールを送信"
        )}
      </Button>
      <Button asChild variant="ghost" className="rounded-full" disabled={state === "loading"}>
        <Link href="/login">ログインに戻る</Link>
      </Button>
    </form>
  )
}
