"use client"

import { useMemo, useState } from "react"
import { Loader2, SendHorizonal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type SubmitState = "idle" | "submitting" | "success" | "error"

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const startedAt = useMemo(() => Date.now(), [])

  async function onSubmit(formData: FormData) {
    setState("submitting")
    setErrorMessage("")

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      message: String(formData.get("message") ?? ""),
      honeypot: String(formData.get("website") ?? ""),
      startedAt,
      pageUrl: window.location.href,
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setState("success")
        return
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number }
      if (res.status === 429) {
        setErrorMessage(`送信回数が上限に達しました。${data.retryAfterSec ?? 60}秒後に再度お試しください。`)
      } else if (data.error === "invalid_input") {
        setErrorMessage("入力内容を確認してください。")
      } else {
        setErrorMessage("送信に失敗しました。時間をおいて再度お試しください。")
      }
      setState("error")
    } catch {
      setErrorMessage("通信に失敗しました。ネットワーク状態をご確認ください。")
      setState("error")
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">お名前</Label>
        <Input id="name" name="name" placeholder="山田 太郎" required maxLength={80} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required maxLength={160} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">会社名</Label>
        <Input id="company" name="company" placeholder="株式会社サンプル" maxLength={120} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">お問い合わせ内容</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="導入目的、対象データ、希望開始時期などを記載してください。"
          required
          minLength={20}
          maxLength={4000}
          className="min-h-32"
        />
      </div>

      <div className="hidden" aria-hidden>
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state === "success" ? (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          送信を受け付けました。担当よりご連絡します。
        </p>
      ) : null}

      {state === "submitting" ? (
        <div className="flex items-center gap-2 rounded-md border border-cyan-300/60 bg-cyan-50/80 px-3 py-2 text-sm text-cyan-800 dark:border-cyan-700/50 dark:bg-cyan-950/30 dark:text-cyan-200">
          <Loader2 className="size-4 animate-spin" />
          お問い合わせを送信中です。完了までしばらくお待ちください。
        </div>
      ) : null}

      {state === "error" && errorMessage ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <Button className="rounded-full" type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            送信中...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <SendHorizonal className="size-4" />
            送信する
          </span>
        )}
      </Button>
    </form>
  )
}
