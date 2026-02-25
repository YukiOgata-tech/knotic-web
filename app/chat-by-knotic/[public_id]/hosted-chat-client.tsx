"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Citation = {
  rank: number
  sourceId: string
  score: number
  url: string | null
  title: string | null
  excerpt: string
  sourceType: "url" | "pdf" | "file"
  linkLabel: string
}

type Message =
  | { id: string; role: "assistant"; content: string; citations?: Citation[] }
  | { id: string; role: "user"; content: string }

type PersistPayload = {
  expiresAt: number
  messages: Message[]
}

type Props = {
  botPublicId: string
  displayName: string
  purposeLabel: string
  welcomeMessage: string
  placeholderText: string
  disclaimerText: string
  showCitations: boolean
  showRetentionNotice: boolean
  retentionHours: number
  historyTurnLimit?: number
  headerBgColor?: string
  headerTextColor?: string
  footerBgColor?: string
  footerTextColor?: string
  disablePersistence?: boolean
  widgetToken?: string
  embedded?: boolean
}

const STORAGE_KEY_PREFIX = "knotic_hosted_chat_v1_"
const URL_PATTERN = /(https?:\/\/[^\s]+)/g

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function firstAssistantMessage(text: string): Message {
  return { id: uid(), role: "assistant", content: text }
}

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_PATTERN)
  return parts.map((part, index) => {
    if (!part) return null
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`link_${index}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-cyan-500 underline-offset-2 hover:text-cyan-600 dark:hover:text-cyan-300"
        >
          {part}
        </a>
      )
    }
    return <React.Fragment key={`txt_${index}`}>{part}</React.Fragment>
  })
}

export function HostedChatClient({
  botPublicId,
  displayName,
  purposeLabel,
  welcomeMessage,
  placeholderText,
  disclaimerText,
  showCitations,
  showRetentionNotice,
  retentionHours,
  historyTurnLimit = 10,
  headerBgColor = "#0f172a",
  headerTextColor = "#f8fafc",
  footerBgColor = "#f8fafc",
  footerTextColor = "#0f172a",
  disablePersistence = false,
  widgetToken,
  embedded = false,
}: Props) {
  const [messages, setMessages] = React.useState<Message[]>([
    firstAssistantMessage(welcomeMessage),
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const storageKey = React.useMemo(() => `${STORAGE_KEY_PREFIX}${botPublicId}`, [botPublicId])
  const retentionMs = retentionHours * 60 * 60 * 1000

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  React.useEffect(() => {
    if (disablePersistence) return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as PersistPayload
      if (!parsed || !Array.isArray(parsed.messages) || typeof parsed.expiresAt !== "number") {
        window.localStorage.removeItem(storageKey)
        return
      }
      if (Date.now() >= parsed.expiresAt) {
        window.localStorage.removeItem(storageKey)
        return
      }
      if (parsed.messages.length > 0) {
        setMessages(parsed.messages)
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }, [disablePersistence, storageKey])

  React.useEffect(() => {
    if (disablePersistence) return
    try {
      const now = Date.now()
      let expiresAt = now + retentionMs
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const existing = JSON.parse(raw) as PersistPayload
        if (existing?.expiresAt && typeof existing.expiresAt === "number" && existing.expiresAt > now) {
          expiresAt = existing.expiresAt
        }
      }
      const payload: PersistPayload = { expiresAt, messages }
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // ignore localStorage errors
    }
  }, [disablePersistence, messages, retentionMs, storageKey])

  React.useEffect(() => {
    if (!disablePersistence) return
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.role !== "assistant") return prev
      if (prev[0].content === welcomeMessage) return prev
      return [{ ...prev[0], content: welcomeMessage }]
    })
  }, [disablePersistence, welcomeMessage])

  function clearHistory() {
    window.localStorage.removeItem(storageKey)
    setMessages([firstAssistantMessage(welcomeMessage)])
    setError(null)
  }

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: uid(), role: "user", content: trimmed }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput("")
    setError(null)
    setLoading(true)

    try {
      const conversation = nextMessages
        .filter((m) => m.role === "assistant" || m.role === "user")
        .slice(-historyTurnLimit)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPublicId,
          message: trimmed,
          conversation,
          widgetToken,
        }),
      })

      const data = (await res.json()) as {
        answer?: string
        citations?: Citation[]
        error?: string
      }

      if (!res.ok || !data.answer) {
        throw new Error(data.error ?? "チャット応答に失敗しました。")
      }

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.answer ?? "",
          citations: data.citations ?? [],
        },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={embedded ? "flex h-full w-full flex-col gap-3" : "mx-auto flex w-full max-w-4xl flex-col gap-4"}>
      <Card className="border-black/10 p-4 dark:border-white/10" style={{ backgroundColor: headerBgColor, color: headerTextColor }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">{displayName}</h1>
            <p className="text-xs opacity-80">{purposeLabel}</p>
          </div>
          <Badge variant="outline" className="border-current/30 text-current">
            Hosted Chat
          </Badge>
        </div>
      </Card>

      <Card className={embedded ? "flex h-[calc(100%-4.5rem)] min-h-[500px] flex-col border-black/10 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 sm:p-4" : "flex min-h-[62vh] flex-col border-black/10 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 sm:p-4"}>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
                    : "max-w-[85%] rounded-2xl border border-black/10 bg-slate-50 px-4 py-2 text-sm dark:border-white/10 dark:bg-slate-800"
                }
              >
                <p className="whitespace-pre-wrap break-words">{renderTextWithLinks(message.content)}</p>

                {showCitations && message.role === "assistant" && message.citations && message.citations.length > 0 ? (
                  <details className="mt-2 rounded-md border border-black/10 bg-white/60 p-2 text-xs dark:border-white/10 dark:bg-slate-900/60">
                    <summary className="cursor-pointer text-muted-foreground">根拠を表示</summary>
                    <div className="mt-2 space-y-2">
                      {message.citations.map((c) => (
                        <div key={`${message.id}_${c.rank}`} className="rounded border border-black/10 p-2 dark:border-white/10">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">[{c.rank}]</Badge>
                            <Badge variant={c.sourceType === "url" ? "secondary" : "outline"}>
                              {c.sourceType === "url" ? "Web" : "PDF"}
                            </Badge>
                            <p className="font-medium">{c.title ?? "source"}</p>
                          </div>

                          {c.url ? (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-full bg-cyan-600 px-3 py-1 font-medium text-white hover:bg-cyan-500"
                            >
                              {c.linkLabel}
                            </a>
                          ) : null}

                          <p className="mt-1 text-muted-foreground">{c.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-2 text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-800">
                生成中...
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-black/10 p-2 dark:border-white/10" style={{ backgroundColor: footerBgColor, color: footerTextColor }}>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder={placeholderText}
              disabled={loading}
              className="h-11"
            />
            <Button onClick={() => void sendMessage()} disabled={loading || input.trim().length === 0} className="h-11 rounded-full px-5">
              送信
            </Button>
          </div>

          {showRetentionNotice ? (
            <div className="flex items-center justify-between gap-2 text-[11px] text-amber-700 dark:text-amber-300">
              <p>このチャット履歴はブラウザ上で{retentionHours}時間保持され、自動的に削除されます。</p>
              <button
                type="button"
                onClick={clearHistory}
                className="rounded-full border border-amber-400/60 px-2 py-0.5 text-[11px] hover:bg-amber-100/60 dark:border-amber-400/40 dark:hover:bg-amber-900/30"
              >
                履歴を消去
              </button>
            </div>
          ) : null}

          <p className="text-xs opacity-80">{disclaimerText}</p>
        </div>
      </Card>
    </div>
  )
}
