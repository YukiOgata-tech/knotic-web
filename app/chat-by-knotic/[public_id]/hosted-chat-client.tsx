"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
  faqQuestions?: string[]
  historyTurnLimit?: number
  headerBgColor?: string
  headerTextColor?: string
  footerBgColor?: string
  footerTextColor?: string
  disablePersistence?: boolean
  widgetToken?: string
  embedded?: boolean
  authenticatedMode?: boolean
  logoUrl?: string | null
  forceMobileView?: boolean
  showUsageCounterDebug?: boolean
}

const STORAGE_KEY_PREFIX = "knotic_hosted_chat_v1_"

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function firstAssistantMessage(text: string): Message {
  return { id: uid(), role: "assistant", content: text }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <style>{`@keyframes kn-dot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-5px);opacity:1}}`}</style>
      {[0, 160, 320].map((d) => (
        <span
          key={d}
          className="block size-2.5 rounded-full bg-slate-400 dark:bg-slate-500"
          style={{ animation: "kn-dot 1.2s ease-in-out infinite", animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  )
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="mb-1.5 ml-4 list-disc space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-cyan-500 underline-offset-2 hover:text-cyan-600 dark:hover:text-cyan-300"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-")
          return isBlock ? (
            <code className="block rounded bg-black/10 px-3 py-2 font-mono text-xs dark:bg-white/10">{children}</code>
          ) : (
            <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>
          )
        },
        pre: ({ children }) => (
          <pre className="mb-1.5 overflow-x-auto rounded-md bg-black/10 p-3 dark:bg-white/10">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-1.5 border-l-2 border-cyan-500 pl-3 text-muted-foreground">{children}</blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-1.5 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-black/20 bg-black/5 px-2 py-1 text-left font-semibold dark:border-white/15 dark:bg-white/5">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-black/20 px-2 py-1 dark:border-white/15">{children}</td>
        ),
        hr: () => <hr className="my-2 border-black/20 dark:border-white/15" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
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
  faqQuestions = [],
  historyTurnLimit = 10,
  headerBgColor = "#0f172a",
  headerTextColor = "#f8fafc",
  footerBgColor = "#f8fafc",
  footerTextColor = "#0f172a",
  disablePersistence = false,
  widgetToken,
  embedded = false,
  authenticatedMode = false,
  logoUrl,
  forceMobileView = false,
  showUsageCounterDebug = false,
}: Props) {
  const [messages, setMessages] = React.useState<Message[]>([
    firstAssistantMessage(welcomeMessage),
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [usageCounterSource, setUsageCounterSource] = React.useState<string | null>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const shouldAnimateNextRef = React.useRef(false)
  const [animatingMsgId, setAnimatingMsgId] = React.useState<string | null>(null)
  const [typedChars, setTypedChars] = React.useState(0)
  const storageKey = React.useMemo(() => `${STORAGE_KEY_PREFIX}${botPublicId}`, [botPublicId])
  const retentionMs = retentionHours * 60 * 60 * 1000
  const [rooms, setRooms] = React.useState<Array<{ id: string; title: string; updated_at: string }>>([])
  const [currentRoomId, setCurrentRoomId] = React.useState<string | null>(null)
  const [roomsLoading, setRoomsLoading] = React.useState(false)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  // 新しいアシスタントメッセージのタイプライターアニメーション開始
  React.useEffect(() => {
    if (!shouldAnimateNextRef.current) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== "assistant") return
    shouldAnimateNextRef.current = false
    setAnimatingMsgId(lastMsg.id)
    setTypedChars(0)
  }, [messages])

  // タイプライター進行
  React.useEffect(() => {
    if (!animatingMsgId) return
    const msg = messages.find((m) => m.id === animatingMsgId)
    if (!msg || msg.role !== "assistant") return
    if (typedChars >= msg.content.length) {
      setAnimatingMsgId(null)
      return
    }
    const timer = setTimeout(() => {
      setTypedChars((prev) => Math.min(prev + 4, msg.content.length))
    }, 12)
    return () => clearTimeout(timer)
  }, [animatingMsgId, typedChars, messages])

  const localPersistenceDisabled = disablePersistence || authenticatedMode

  React.useEffect(() => {
    if (localPersistenceDisabled) return
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
  }, [localPersistenceDisabled, storageKey])

  React.useEffect(() => {
    if (localPersistenceDisabled) return
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
  }, [localPersistenceDisabled, messages, retentionMs, storageKey])

  React.useEffect(() => {
    if (!localPersistenceDisabled) return
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.role !== "assistant") return prev
      if (prev[0].content === welcomeMessage) return prev
      return [{ ...prev[0], content: welcomeMessage }]
    })
  }, [localPersistenceDisabled, welcomeMessage])

  const loadRooms = React.useCallback(async () => {
    if (!authenticatedMode) return
    setRoomsLoading(true)
    try {
      const res = await fetch(`/api/hosted/rooms?botPublicId=${encodeURIComponent(botPublicId)}`, { cache: "no-store" })
      const data = (await res.json()) as { rooms?: Array<{ id: string; title: string; updated_at: string }>; error?: string }
      if (!res.ok) throw new Error(data.error ?? "ルーム取得に失敗しました。")
      const next = data.rooms ?? []
      setRooms(next)
      if (!currentRoomId && next.length > 0) {
        setCurrentRoomId(next[0].id)
      }
      if (!currentRoomId && next.length === 0) {
        const created = await fetch("/api/hosted/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botPublicId }),
        })
        const createdData = (await created.json()) as { room?: { id: string; title: string; updated_at: string }; error?: string }
        if (!created.ok || !createdData.room) throw new Error(createdData.error ?? "初期ルーム作成に失敗しました。")
        setRooms([createdData.room])
        setCurrentRoomId(createdData.room.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ルーム取得に失敗しました。")
    } finally {
      setRoomsLoading(false)
    }
  }, [authenticatedMode, botPublicId, currentRoomId])

  const loadRoomMessages = React.useCallback(async () => {
    if (!authenticatedMode || !currentRoomId) return
    try {
      const res = await fetch(
        `/api/hosted/messages?botPublicId=${encodeURIComponent(botPublicId)}&roomId=${encodeURIComponent(currentRoomId)}`,
        { cache: "no-store" }
      )
      const data = (await res.json()) as {
        messages?: Array<{ id: string | number; role: "assistant" | "user"; content: string; citations?: Citation[] }>
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "メッセージ取得に失敗しました。")
      const list = data.messages ?? []
      if (list.length === 0) {
        setMessages([firstAssistantMessage(welcomeMessage)])
        return
      }
      setMessages(
        list.map((item) => ({
          id: String(item.id),
          role: item.role,
          content: item.content,
          citations: item.role === "assistant" ? item.citations ?? [] : undefined,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "メッセージ取得に失敗しました。")
    }
  }, [authenticatedMode, botPublicId, currentRoomId, welcomeMessage])

  React.useEffect(() => {
    if (!authenticatedMode) return
    void loadRooms()
  }, [authenticatedMode, loadRooms])

  React.useEffect(() => {
    if (!authenticatedMode) return
    void loadRoomMessages()
  }, [authenticatedMode, loadRoomMessages])

  function clearHistory() {
    window.localStorage.removeItem(storageKey)
    setMessages([firstAssistantMessage(welcomeMessage)])
    setError(null)
  }

  async function sendMessage(overrideText?: string) {
    const trimmed = (overrideText ?? input).trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: uid(), role: "user", content: trimmed }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    if (!overrideText) setInput("")
    setError(null)
    setLoading(true)

    try {
      // messages[0]は常にUIのウェルカムメッセージ（AIが生成したものではない）。
      // これを会話履歴に含めると system→assistant→user という順でOpenAIに渡り
      // 空レスポンスや不正な応答の原因になるため slice(1) でスキップする。
      const conversation = messages
        .slice(1)
        .filter((m) => m.role === "assistant" || m.role === "user")
        .slice(-historyTurnLimit)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

      const endpoint = authenticatedMode ? "/api/hosted/chat" : "/api/v1/chat"
      const payload = authenticatedMode
        ? { botPublicId, roomId: currentRoomId, message: trimmed }
        : { botPublicId, message: trimmed, conversation, widgetToken }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const rawText = await res.text().catch(() => "")
      let data: {
        answer?: string
        citations?: Citation[]
        error?: string
        usage?: {
          counterSource?: string
        }
      } = {}
      try {
        data = JSON.parse(rawText) as typeof data
      } catch {
        console.error("[chat] response is not JSON. status:", res.status, "body:", rawText.slice(0, 300))
      }

      if (!res.ok) {
        console.error("[chat] API error", res.status, data)
        throw new Error(data.error ?? `APIエラー (${res.status})`)
      }
      if (!data.answer) {
        console.error("[chat] empty answer from API", data)
        throw new Error("AIからの応答が空でした。しばらく待ってから再試行してください。")
      }

      shouldAnimateNextRef.current = true
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.answer ?? "",
          citations: data.citations ?? [],
        },
      ])
      if (authenticatedMode) {
        void loadRooms()
      }
      setUsageCounterSource(data.usage?.counterSource ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  async function createRoom() {
    if (!authenticatedMode || loading) return
    try {
      const res = await fetch("/api/hosted/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botPublicId }),
      })
      const data = (await res.json()) as { room?: { id: string; title: string; updated_at: string }; error?: string }
      if (!res.ok || !data.room) throw new Error(data.error ?? "ルーム作成に失敗しました。")
      setRooms((prev) => [data.room!, ...prev])
      setCurrentRoomId(data.room.id)
      setMessages([firstAssistantMessage(welcomeMessage)])
    } catch (e) {
      setError(e instanceof Error ? e.message : "ルーム作成に失敗しました。")
    }
  }

  return (
    <div className={embedded ? "flex h-full min-h-0 w-full flex-col gap-3" : "mx-auto flex w-full max-w-4xl flex-col gap-4"}>
      <Card
        className={embedded
          ? cn("border-black/20 px-3 py-2 dark:border-white/10", !forceMobileView && "sm:p-4")
          : cn("border-black/20 p-3 dark:border-white/10", !forceMobileView && "sm:p-4")}
        style={{ backgroundColor: headerBgColor, color: headerTextColor }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <img
              src={logoUrl ?? "/images/knotic-square-logo.png"}
              alt=""
              className={embedded
                ? "size-6 shrink-0 rounded object-contain"
                : cn("size-8 shrink-0 rounded object-contain", !forceMobileView && "sm:size-9")}
            />
            <div className="min-w-0">
              <h1 className={embedded
                ? "truncate text-sm font-semibold"
                : cn("truncate text-base font-semibold", !forceMobileView && "sm:text-xl")}
              >
                {displayName}
              </h1>
              {!embedded && <p className="truncate text-xs opacity-80">{purposeLabel}</p>}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 border-current/30 text-current text-[10px]", !forceMobileView && "sm:text-xs")}
          >
            Hosted Chat
          </Badge>
        </div>
        {!embedded && (showRetentionNotice || disclaimerText) ? (
          <div
            className={cn(
              "mt-2 flex flex-col gap-0.5 border-t border-current/15 pt-2",
              !forceMobileView && "sm:flex-row sm:flex-wrap sm:gap-x-4"
            )}
          >
            {showRetentionNotice ? (
              <p className="text-[11px] opacity-60">履歴はブラウザ上で{retentionHours}時間保持されます。</p>
            ) : null}
            {disclaimerText ? (
              <p className="text-[11px] opacity-60">{disclaimerText}</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      {authenticatedMode ? (
        <Card className="border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">チャットルーム</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => void createRoom()}>
              新規ルーム
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {roomsLoading ? <span className="text-xs text-muted-foreground">読み込み中...</span> : null}
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setCurrentRoomId(room.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  currentRoomId === room.id
                    ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
                    : "border-black/15 text-zinc-700 dark:border-white/20 dark:text-zinc-200"
                }`}
              >
                {room.title}
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <Card
        className={embedded
          ? cn("flex min-h-0 flex-1 flex-col border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80", !forceMobileView && "sm:p-4")
          : cn("flex min-h-[55vh] flex-col border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80", !forceMobileView && "sm:min-h-[62vh] sm:p-4")}
      >
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((message) => {
            const isAnimating = message.role === "assistant" && message.id === animatingMsgId
            const displayContent = isAnimating
              ? message.content.slice(0, typedChars)
              : message.content
            const animationDone = !isAnimating || typedChars >= message.content.length

            return (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
                      : "max-w-[85%] rounded-2xl border border-black/20 bg-slate-50 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-slate-800"
                  }
                >
                  {message.role === "assistant" ? (
                    <div className="relative">
                      <MarkdownMessage content={displayContent} />
                      {isAnimating && !animationDone && (
                        <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-current align-text-bottom opacity-70" />
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                  )}

                  {showCitations && message.role === "assistant" && animationDone && message.citations && message.citations.length > 0 ? (
                    <div className="mt-3 space-y-1.5 border-t border-black/15 pt-2.5 dark:border-white/10">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">参照元</p>
                      {message.citations.map((c) => (
                        <div key={`${message.id}_${c.rank}`} className="flex min-w-0 items-start gap-2 rounded-lg border border-black/15 bg-white/70 px-2.5 py-2 dark:border-white/10 dark:bg-slate-900/60">
                          <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">{c.rank}</Badge>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant={c.sourceType === "url" ? "secondary" : "outline"} className="text-[10px]">
                                {c.sourceType === "url" ? "Web" : c.sourceType === "pdf" ? "PDF" : "File"}
                              </Badge>
                              <span className="truncate text-xs font-medium">{c.title ?? "source"}</span>
                            </div>
                            {c.url ? (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-cyan-600 underline underline-offset-2 hover:text-cyan-500 dark:text-cyan-400"
                              >
                                {c.linkLabel} →
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}

          {faqQuestions.length > 0 && messages.length === 1 && !loading ? (
            <div className={cn("flex flex-wrap gap-1.5 pt-1", !forceMobileView && "sm:gap-2")}>
              {faqQuestions.filter(Boolean).slice(0, 5).map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  className="max-w-full rounded-full border border-black/20 bg-white px-3 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-black/20 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-800">
                <TypingDots />
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4">
          {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
          {showUsageCounterDebug ? (
            <p
              className={cn(
                "mb-2 text-[11px]",
                usageCounterSource === "rpc"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : usageCounterSource
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-muted-foreground"
              )}
            >
              集計経路: {usageCounterSource ?? "未取得"}
            </p>
          ) : null}
          {showRetentionNotice ? (
            <div className="mb-1.5 flex justify-end">
              <button
                type="button"
                onClick={clearHistory}
                className="rounded-full border border-black/20 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                履歴を消去
              </button>
            </div>
          ) : null}
          <div className="rounded-lg border border-black/20 p-2 dark:border-white/10" style={{ backgroundColor: footerBgColor, color: footerTextColor }}>
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
                className="h-11 min-w-0 flex-1"
              />
              <Button
                onClick={() => void sendMessage()}
                disabled={loading || input.trim().length === 0 || (authenticatedMode && !currentRoomId)}
                className={cn("h-11 shrink-0 rounded-full px-4", !forceMobileView && "sm:px-5")}
              >
                送信
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
