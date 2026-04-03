"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function extractToken(input: string): string {
  const trimmed = input.trim()
  // Accept full invite URL — extract the token param
  try {
    const url = new URL(trimmed)
    const token = url.searchParams.get("token")
    if (token) return token
  } catch {}
  // Otherwise treat the input itself as a raw token
  return trimmed
}

export function InviteJoinForm() {
  const router = useRouter()
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = extractToken(value)
    if (!token) {
      setError(true)
      return
    }
    setError(false)
    router.push(`/invite?token=${encodeURIComponent(token)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false) }}
          required
          placeholder="招待URLまたはトークンを貼り付け"
          className="max-w-sm bg-white dark:bg-slate-900"
        />
        <Button type="submit" variant="outline" className="rounded-full">
          参加する
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive">招待URLまたはトークンを入力してください。</p>
      )}
      <p className="text-xs text-amber-800 dark:text-amber-300">
        招待メールのリンクをそのまま貼り付けるか、トークン（<code>inv_</code> から始まる文字列）のみでも参加できます。
      </p>
    </form>
  )
}
