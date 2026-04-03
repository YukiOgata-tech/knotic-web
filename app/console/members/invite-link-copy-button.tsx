"use client"

import * as React from "react"
import { Check, Copy, Link2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type State = "idle" | "loading" | "showing" | "error"
type CopyTarget = "url" | "token"

export function InviteLinkCopyButton({ inviteId }: { inviteId: string }) {
  const [state, setState] = React.useState<State>("idle")
  const [inviteUrl, setInviteUrl] = React.useState("")
  const [token, setToken] = React.useState("")
  const [expiresAt, setExpiresAt] = React.useState("")
  const [copied, setCopied] = React.useState<CopyTarget | null>(null)

  async function handleShow() {
    setState("loading")
    try {
      const res = await fetch(`/api/console/invite-link?inviteId=${encodeURIComponent(inviteId)}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { inviteUrl: string; expiresAt: string }
      setInviteUrl(data.inviteUrl)
      // Extract token from URL
      try {
        const t = new URL(data.inviteUrl).searchParams.get("token") ?? ""
        setToken(t)
      } catch {
        setToken("")
      }
      setExpiresAt(
        new Date(data.expiresAt).toLocaleDateString("ja-JP", {
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      )
      setState("showing")
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }

  async function handleCopy(target: CopyTarget) {
    const text = target === "url" ? inviteUrl : token
    try {
      await navigator.clipboard.writeText(text)
      setCopied(target)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  if (state === "idle" || state === "error") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full"
        onClick={() => void handleShow()}
      >
        <Link2 className="mr-1.5 size-3.5" />
        {state === "error" ? "取得失敗" : "リンクを表示"}
      </Button>
    )
  }

  if (state === "loading") {
    return (
      <Button type="button" size="sm" variant="outline" className="rounded-full" disabled>
        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        取得中...
      </Button>
    )
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-black/15 bg-slate-50 p-2.5 dark:border-white/10 dark:bg-slate-800/60">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">有効期限: {expiresAt}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 rounded-full px-2.5 text-xs border hover:border-black dark:hover:border-white"
          onClick={() => setState("idle")}
        >
          × 閉じる
        </Button>
      </div>
      {/* 招待URL */}
      <p className="mt-2 text-xs font-medium text-muted-foreground">招待URL</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-white px-2 py-1.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {inviteUrl}
        </code>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 shrink-0 rounded-full px-2.5"
          onClick={() => void handleCopy("url")}
        >
          {copied === "url" ? (
            <><Check className="mr-1 size-3 text-emerald-500" />コピー済</>
          ) : (
            <><Copy className="mr-1 size-3" />コピー</>
          )}
        </Button>
      </div>

      {/* トークンのみ */}
      {token && (
        <>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            招待トークンのみ
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {token}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 shrink-0 rounded-full px-2.5"
              onClick={() => void handleCopy("token")}
            >
              {copied === "token" ? (
                <><Check className="mr-1 size-3 text-emerald-500" />コピー済</>
              ) : (
                <><Copy className="mr-1 size-3" />コピー</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
