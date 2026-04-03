"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProcessingOverlay } from "@/components/ui/processing-overlay"

export function LoginForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = React.useState(defaultEmail)
  const [password, setPassword] = React.useState("")
  const [honeypot, setHoneypot] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const startedAtRef = React.useRef(Date.now())

  const next = searchParams.get("next") ?? "/console"

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Bot check: honeypot / timing / rate limit
      try {
        const checkRes = await fetch("/api/auth/bot-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", honeypot, startedAt: startedAtRef.current, email }),
        })
        const checkData = await checkRes.json().catch(() => ({}))

        if (checkData.blocked) {
          // Silent: bot detected — reset form without error message
          setEmail("")
          setPassword("")
          setLoading(false)
          return
        }
        if (checkRes.status === 429) {
          const sec: number = checkData.retryAfterSec ?? 60
          setError(`リクエストが多すぎます。${sec}秒後にもう一度お試しください。`)
          setLoading(false)
          return
        }
      } catch {
        // Network error during bot check — proceed to avoid blocking legitimate users
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Record failure for lockout tracking (fire-and-forget)
        fetch("/api/auth/login-failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).catch(() => {})
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Success: keep loading=true so overlay stays visible during page transition
      router.push(next)
      router.refresh()
    } catch {
      setError("エラーが発生しました。再度お試しください。")
      setLoading(false)
    }
  }

  return (
    <>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {/* Honeypot: hidden from humans, bots will fill this */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
        />

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
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            パスワードをお忘れの方
          </Link>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="rounded-full" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              ログイン中...
            </span>
          ) : (
            "ログイン"
          )}
        </Button>
        <Button asChild variant="ghost" className="rounded-full" disabled={loading}>
          <Link href="/signup">オーナーアカウント作成</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full" disabled={loading}>
          <Link href="/signup-user">knoticユーザー作成</Link>
        </Button>
      </form>

      <ProcessingOverlay
        open={loading}
        title="認証を処理しています"
        description="ログイン状態を確認中です。画面が切り替わるまでそのままお待ちください。"
      />
    </>
  )
}
