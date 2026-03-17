"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [honeypot, setHoneypot] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const startedAtRef = React.useRef(Date.now())

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
          setEmail("")
          setPassword("")
          return
        }
        if (checkRes.status === 429) {
          const sec: number = checkData.retryAfterSec ?? 60
          setError(`リクエストが多すぎます。${sec}秒後にもう一度お試しください。`)
          return
        }
      } catch {
        // Network error during bot check — proceed to avoid blocking legitimate users
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError("メールアドレスまたはパスワードが正しくありません。")
        return
      }

      // 管理者権限チェックはサーバー側 (admin layout) で行うため、
      // ここでは /sub-domain にリダイレクトするだけ。
      // 権限がなければ layout がログインページに戻す。
      router.push("/sub-domain")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
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

      <div className="grid gap-1.5">
        <Label htmlFor="email" className="text-slate-300">
          メールアドレス
        </Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="border-white/10 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500/40"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="password" className="text-slate-300">
          パスワード
        </Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="border-white/10 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500/40"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            ログイン中...
          </>
        ) : (
          "管理者としてログイン"
        )}
      </button>
    </form>
  )
}
