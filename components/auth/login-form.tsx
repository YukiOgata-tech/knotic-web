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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const next = searchParams.get("next") ?? "/console"

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.push(next)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="grid gap-4" onSubmit={onSubmit}>
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
