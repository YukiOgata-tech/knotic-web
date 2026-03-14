"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import {
  Brain,
  Check,
  ChevronLeft,
  ExternalLink,
  FileText,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  X,
  MonitorSmartphone,
  Palette,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react"

import { getSourcePagesAction, getSourceTextAction, type SourcePage } from "@/app/console/actions"
import { HostedChatClient } from "@/app/chat-by-knotic/[public_id]/hosted-chat-client"
import { PublicToggle } from "@/app/console/bots/public-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { getSupabasePublicEnv } from "@/lib/env"
import { cn } from "@/lib/utils"

type BotHostedConfig = {
  id: string
  name: string
  public_id: string
  is_public: boolean
  chat_purpose: string | null
  access_mode: string | null
  display_name: string | null
  welcome_message: string | null
  placeholder_text: string | null
  disclaimer_text: string | null
  faq_questions: string[] | null
  show_citations: boolean | null
  history_turn_limit: number | null
  require_auth_for_hosted: boolean | null
  ui_header_bg_color: string | null
  ui_header_text_color: string | null
  ui_footer_bg_color: string | null
  ui_footer_text_color: string | null
  widget_enabled: boolean | null
  widget_mode: string | null
  widget_position: string | null
  widget_launcher_label: string | null
  widget_policy_text: string | null
  widget_redirect_new_tab: boolean | null
  bot_logo_url: string | null
  launcher_show_label: boolean | null
  ai_model: string | null
  ai_fallback_model: string | null
  ai_max_output_tokens: number | null
  file_search_provider: string | null
}

type BotSourceRow = {
  id: string
  bot_id: string | null
  type: "url" | "pdf" | "file"
  status: string
  url: string | null
  file_name: string | null
  file_size_bytes: number | null
  file_search_provider: string | null
  file_search_last_synced_at: string | null
  file_search_error: string | null
  index_mode: string | null
}

type WidgetTokenRow = {
  id: string
  allowed_origins: string[]
  revoked_at: string | null
  created_at: string
} | null

type ActionFn = (formData: FormData) => void | Promise<void>

type Props = {
  bot: BotHostedConfig
  botSources: BotSourceRow[]
  widgetTokenRow: WidgetTokenRow
  isEditor: boolean
  hasHostedPage: boolean
  maxHistoryTurnLimit: number
  redirectTo?: string
  backHref?: string
  initialActiveTab?: ConfigTab
  saveAction: ActionFn
  togglePublicAction: ActionFn
  rotateWidgetTokenAction: ActionFn
  updateAllowedOriginsAction: ActionFn
  addFileSourceAction: ActionFn
  deleteSourceAction: ActionFn
  deleteBotAction: ActionFn
}

type ConfigTab = "basic" | "bot" | "ai" | "theme" | "widget" | "preview"

const PURPOSE_OPTIONS = [
  { value: "customer_support", label: "お問い合わせ対応" },
  { value: "lead_gen", label: "資料請求・商談導線" },
  { value: "internal_kb", label: "社内ナレッジ" },
  { value: "onboarding", label: "導入ガイド" },
  { value: "custom", label: "その他" },
] as const

const PURPOSE_LABEL: Record<string, string> = {
  customer_support: "お問い合わせ対応",
  lead_gen: "資料請求・商談導線",
  internal_kb: "社内ナレッジ",
  onboarding: "導入ガイド",
  custom: "その他",
}

const ROUTE_LOADER_BLOCK_ATTR = "data-knotic-route-loader-blocked"
const ROUTE_LOADER_START_EVENT = "knotic:route-loader:start"

const DEFAULT_HEADER_BG = "#0f172a"
const DEFAULT_HEADER_TEXT = "#f8fafc"
const DEFAULT_FOOTER_BG = "#f8fafc"
const DEFAULT_FOOTER_TEXT = "#0f172a"
const DEFAULT_WIDGET_POLICY =
  "チャット履歴はブラウザ上で24時間保持され、自動的に削除されます。"
const MODEL_OPTIONS = ["5-nano", "5-mini", "5"] as const
const MODEL_LABELS: Record<string, string> = {
  "5-nano": "Knotic Nano",
  "5-mini": "Knotic Mini",
  "5": "Knotic Standard",
}
const SELECT_CLASS =
  "h-11 rounded-md border border-black/15 bg-white px-3 text-base text-slate-900 [color-scheme:light] sm:h-10 sm:text-sm dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]"

const TAB_ITEMS: Array<{ id: ConfigTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "basic", label: "基本設定", icon: Settings2 },
  { id: "bot", label: "Bot設定", icon: SlidersHorizontal },
  { id: "ai", label: "AI設定", icon: Brain },
  { id: "theme", label: "テーマ", icon: Palette },
  { id: "widget", label: "Widget", icon: MonitorSmartphone },
  { id: "preview", label: "プレビュー", icon: Sparkles },
]

function formatMbFromBytes(bytes: number | null | undefined) {
  if (typeof bytes !== "number" || bytes <= 0) return "-"
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleString("ja-JP", { hour12: false })
}

function normalizePreviewPageUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
    return parsed.toString()
  } catch {
    return null
  }
}

const SOURCE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  ready:   { label: "同期済み", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  queued:  { label: "待機中",   className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  running: { label: "処理中",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  failed:  { label: "失敗",     className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  deleted: { label: "削除済み", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
}

function SourceStatusBadge({ status }: { status: string }) {
  const config = SOURCE_STATUS_MAP[status] ?? { label: status, className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", config.className)}>
      {config.label}
    </span>
  )
}

function Panel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <section className={cn("grid gap-4", !active && "hidden")}>{children}</section>
}

type WidgetPreviewProps = {
  pageUrl: string
  logoUrl: string | null
  launcherLabel: string
  launcherShowLabel: boolean
  widgetPosition: string
  previewKey: number
  botPublicId: string
  displayName: string
  purposeLabel: string
  welcomeMessage: string
  faqQuestions: string[]
  placeholderText: string
  disclaimerText: string
  showCitations: boolean
  historyTurnLimit: number
  headerBgColor: string
  headerTextColor: string
  footerBgColor: string
  footerTextColor: string
}

function WidgetLauncherPreview({
  pageUrl,
  logoUrl,
  launcherLabel,
  launcherShowLabel,
  widgetPosition,
  previewKey,
  botPublicId,
  displayName,
  purposeLabel,
  welcomeMessage,
  faqQuestions,
  placeholderText,
  disclaimerText,
  showCitations,
  historyTurnLimit,
  headerBgColor,
  headerTextColor,
  footerBgColor,
  footerTextColor,
}: WidgetPreviewProps) {
  const [overlayOpen, setOverlayOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"desktop" | "mobile">("desktop")

  // モード切替時にオーバーレイをリセット
  React.useEffect(() => { setOverlayOpen(false) }, [viewMode])

  const isRight = widgetPosition.includes("right")
  const isBottom = widgetPosition.includes("bottom")

  // チャットパネル（デスクトップ・モバイル共通）
  const ChatPanel = ({ fullScreen }: { fullScreen: boolean }) => (
    <div className={cn("flex flex-col bg-white dark:bg-slate-950", fullScreen ? "absolute inset-0 z-20" : "h-full w-[min(65%,360px)]")}>
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-3 py-2 dark:border-white/10">
        <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{displayName}</span>
        <button
          type="button"
          onClick={() => setOverlayOpen(false)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <HostedChatClient
            key={previewKey}
            botPublicId={botPublicId}
            displayName={displayName}
            purposeLabel={purposeLabel}
            welcomeMessage={welcomeMessage}
            faqQuestions={faqQuestions}
            placeholderText={placeholderText}
            disclaimerText={disclaimerText}
            showCitations={showCitations}
            showRetentionNotice={false}
            retentionHours={24}
            historyTurnLimit={historyTurnLimit}
            headerBgColor={headerBgColor}
            headerTextColor={headerTextColor}
            footerBgColor={footerBgColor}
            footerTextColor={footerTextColor}
            logoUrl={logoUrl}
            embedded
            disablePersistence
            forceMobileView={fullScreen}
          />
        </div>
      </div>
    </div>
  )

  // ランチャーボタン（サイズ可変）
  const LauncherBtn = ({ scale = 1 }: { scale?: number }) => (
    <button
      type="button"
      onClick={() => setOverlayOpen(true)}
      style={{
        position: "absolute",
        [isRight ? "right" : "left"]: 14 * scale,
        [isBottom ? "bottom" : "top"]: 14 * scale,
        display: "flex",
        alignItems: "center",
        gap: 6 * scale,
        background: "#0f172a",
        color: "#fff",
        border: "none",
        borderRadius: 999,
        padding: launcherShowLabel ? `${9 * scale}px ${14 * scale}px` : 9 * scale,
        fontSize: 13 * scale,
        fontWeight: 600,
        boxShadow: "0 6px 20px rgba(2,6,23,0.35)",
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      <img
        src={logoUrl ?? "/images/knotic-square-logo.png"}
        alt=""
        style={{ width: 20 * scale, height: 20 * scale, objectFit: "contain", borderRadius: 3, flexShrink: 0 }}
      />
      {launcherShowLabel && <span>{launcherLabel || "チャット"}</span>}
    </button>
  )

  return (
    <div className="grid gap-3">
      {/* ── デスクトップ/モバイル切り替え ── */}
      <div className="flex justify-center">
        <div className="flex rounded-lg border border-black/15 p-0.5 text-xs dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
              viewMode === "desktop"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <Monitor className="size-3.5" />
            デスクトップ
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mobile")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
              viewMode === "mobile"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <Smartphone className="size-3.5" />
            モバイル
          </button>
        </div>
      </div>

      {/* ── デスクトップビュー ── */}
      {viewMode === "desktop" && (
        <div className="relative overflow-hidden rounded-xl border border-black/15 dark:border-white/10" style={{ height: 540 }}>
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950">
            <iframe
              src={pageUrl}
              title="Widget preview desktop page"
              className="h-full w-full border-0"
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <LauncherBtn scale={1} />

          {overlayOpen && (
            <div
              className="absolute inset-0 flex justify-end bg-black/45"
              style={{ zIndex: 20 }}
              onClick={(e) => { if (e.target === e.currentTarget) setOverlayOpen(false) }}
            >
              <ChatPanel fullScreen={false} />
            </div>
          )}
        </div>
      )}

      {/* ── モバイルビュー（スマホフレーム） ── */}
      {viewMode === "mobile" && (
        <div className="flex justify-center py-2">
          {/* スマホ外枠 */}
          <div className="relative" style={{ width: 360 }}>
            {/* ノッチ */}
            <div className="absolute left-1/2 top-3.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-700" />
            <div className="overflow-hidden rounded-[2.5rem] border-[6px] border-slate-700 bg-slate-700 shadow-2xl">
              {/* ステータスバー */}
              <div className="flex items-center justify-between bg-slate-950 px-5 pt-7 pb-1.5">
                <span className="text-[9px] font-semibold text-white/70">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-3 rounded-sm bg-white/50" />
                  <div className="h-1.5 w-3 rounded-sm bg-white/50" />
                  <div className="h-2 w-4 rounded-sm bg-white/50" />
                </div>
              </div>

              {/* スクリーン */}
              <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950" style={{ height: 520 }}>
                <div className="absolute inset-0">
                  <iframe
                    src={pageUrl}
                    title="Widget preview mobile page"
                    className="h-full w-full border-0"
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>

                <LauncherBtn scale={0.85} />

                {/* モバイルオーバーレイ（フルスクリーン） */}
                {overlayOpen && <ChatPanel fullScreen={true} />}
              </div>

              {/* ホームインジケーター */}
              <div className="flex justify-center bg-slate-950 py-2">
                <div className="h-0.5 w-16 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function HostedConfigEditor({
  bot,
  botSources,
  widgetTokenRow,
  isEditor,
  hasHostedPage,
  maxHistoryTurnLimit,
  redirectTo = "/console/bots",
  backHref = "/console/bots",
  initialActiveTab = "basic",
  saveAction,
  togglePublicAction,
  rotateWidgetTokenAction,
  updateAllowedOriginsAction,
  addFileSourceAction,
  deleteSourceAction,
  deleteBotAction,
}: Props) {
  const [activeTab, setActiveTab] = React.useState<ConfigTab>(initialActiveTab)

  const [botName, setBotName] = React.useState(bot.name)
  const [displayName, setDisplayName] = React.useState(bot.display_name ?? bot.name)
  const [chatPurpose, setChatPurpose] = React.useState(bot.chat_purpose ?? "customer_support")
  const [accessMode, setAccessMode] = React.useState(bot.access_mode ?? "public")
  const [historyTurnLimit, setHistoryTurnLimit] = React.useState(String(bot.history_turn_limit ?? 8))
  const [welcomeMessage, setWelcomeMessage] = React.useState(bot.welcome_message ?? "こんにちは。ご質問を入力してください。")
  const [placeholderText, setPlaceholderText] = React.useState(bot.placeholder_text ?? "質問を入力")
  const [disclaimerText, setDisclaimerText] = React.useState(bot.disclaimer_text ?? "回答は参考情報です。重要事項は担当者へ確認してください。")
  // 表示用: 入力済み + 末尾に空欄1つ（5件満杯のときは空欄なし）
  const initFaq = (bot.faq_questions ?? []).filter(Boolean)
  const [faqQuestions, setFaqQuestions] = React.useState<string[]>(
    initFaq.length >= 5 ? initFaq.slice(0, 5) : [...initFaq, ""]
  )

  const handleFaqChange = (i: number, value: string) => {
    const next = [...faqQuestions]
    next[i] = value
    // 最後の欄に入力されたら次の空欄を追加（最大5件）
    if (i === next.length - 1 && value.trim() !== "" && next.length < 5) {
      next.push("")
    }
    setFaqQuestions(next)
  }

  const removeFaq = (i: number) => {
    const next = faqQuestions.filter((_, idx) => idx !== i)
    // 常に末尾に空欄が1つあるようにする
    if (next.length === 0 || next[next.length - 1].trim() !== "") {
      if (next.length < 5) next.push("")
    }
    setFaqQuestions(next)
  }

  // form送信用: 5スロット分の値（空文字で埋める）
  const faqSlots = [...faqQuestions.filter(Boolean), ...Array(5).fill("")].slice(0, 5)
  const [showCitations, setShowCitations] = React.useState(Boolean(bot.show_citations ?? true))
  const [requireAuth, setRequireAuth] = React.useState(Boolean(bot.require_auth_for_hosted ?? false))
  const [headerBgColor, setHeaderBgColor] = React.useState(bot.ui_header_bg_color ?? DEFAULT_HEADER_BG)
  const [headerTextColor, setHeaderTextColor] = React.useState(bot.ui_header_text_color ?? DEFAULT_HEADER_TEXT)
  const [footerBgColor, setFooterBgColor] = React.useState(bot.ui_footer_bg_color ?? DEFAULT_FOOTER_BG)
  const [footerTextColor, setFooterTextColor] = React.useState(bot.ui_footer_text_color ?? DEFAULT_FOOTER_TEXT)

  const [widgetEnabled, setWidgetEnabled] = React.useState(Boolean(bot.widget_enabled ?? true))
  const [widgetMode, setWidgetMode] = React.useState(bot.widget_mode ?? "overlay")
  const [widgetPosition, setWidgetPosition] = React.useState(bot.widget_position ?? "right-bottom")
  const [widgetLauncherLabel, setWidgetLauncherLabel] = React.useState(bot.widget_launcher_label ?? "チャット")
  const [widgetPolicyText, setWidgetPolicyText] = React.useState(bot.widget_policy_text ?? DEFAULT_WIDGET_POLICY)
  const [widgetRedirectNewTab, setWidgetRedirectNewTab] = React.useState(Boolean(bot.widget_redirect_new_tab ?? false))
  const [logoUrl, setLogoUrl] = React.useState<string | null>(bot.bot_logo_url ?? null)
  const [launcherShowLabel, setLauncherShowLabel] = React.useState(bot.launcher_show_label !== false)
  const [logoUploading, setLogoUploading] = React.useState(false)
  const [logoError, setLogoError] = React.useState<string | null>(null)
  const allowedOrigins_ = (widgetTokenRow?.allowed_origins ?? []).join(", ")
  const [allowedOrigins, setAllowedOrigins] = React.useState(allowedOrigins_)
  const [showRotateConfirm, setShowRotateConfirm] = React.useState(false)
  const [rotatingToken, setRotatingToken] = React.useState(false)
  const [issuedToken, setIssuedToken] = React.useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = React.useState(false)
  const [hasToken, setHasToken] = React.useState(Boolean(widgetTokenRow))
  const [aiModel, setAiModel] = React.useState(bot.ai_model ?? "5-mini")
  const [aiFallbackModel, setAiFallbackModel] = React.useState(bot.ai_fallback_model ?? "")
  const [aiMaxOutputTokens, setAiMaxOutputTokens] = React.useState(String(bot.ai_max_output_tokens ?? 1200))
  const [addSourceTab, setAddSourceTab] = React.useState<"url" | "file">("url")
  const [indexMode, setIndexMode] = React.useState<"raw" | "llm">("raw")

  type IndexStep = { id: string; label: string; status: "pending" | "active" | "done" }
  type UrlIndexingState = {
    phase: "idle" | "running" | "done" | "error"
    steps: IndexStep[]
    pageProgress: { done: number; total: number } | null
    error: string | null
    warnings: string[]
  }
  const IDLE_STATE: UrlIndexingState = { phase: "idle", steps: [], pageProgress: null, error: null, warnings: [] }
  const [urlIndexing, setUrlIndexing] = React.useState<UrlIndexingState>(IDLE_STATE)
  const urlInputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [isSaving, startSaveTransition] = React.useTransition()
  const [isDeletingBot, startDeleteBotTransition] = React.useTransition()
  const [previewKey, setPreviewKey] = React.useState(0)
  const [previewMode, setPreviewMode] = React.useState<"chat" | "widget">("chat")
  const initialPreviewPageUrl = React.useMemo(() => {
    const firstUrlSource = botSources.find((source) => source.type === "url" && source.url)?.url ?? ""
    return normalizePreviewPageUrl(firstUrlSource) ?? "https://example.com"
  }, [botSources])
  const [previewPageUrlInput, setPreviewPageUrlInput] = React.useState(initialPreviewPageUrl)
  const [previewPageUrl, setPreviewPageUrl] = React.useState(initialPreviewPageUrl)
  const [previewPageUrlError, setPreviewPageUrlError] = React.useState<string | null>(null)
  const [isDirty, setIsDirty] = React.useState(false)
  const [leaveTarget, setLeaveTarget] = React.useState<string | null>(null)
  const [showDeleteBotConfirm, setShowDeleteBotConfirm] = React.useState(false)

  const setRouteLoaderBlocked = React.useCallback((blocked: boolean) => {
    if (typeof document === "undefined") return
    if (blocked) {
      document.documentElement.setAttribute(ROUTE_LOADER_BLOCK_ATTR, "true")
      return
    }
    document.documentElement.removeAttribute(ROUTE_LOADER_BLOCK_ATTR)
  }, [])

  // ブラウザの閉じる・リロード・外部遷移を警告
  React.useEffect(() => {
    if (!isDirty || isSaving) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty, isSaving])

  // Next.js内部リンク（<Link>含む）をキャプチャフェーズで横取りし確認モーダルを表示
  React.useEffect(() => {
    if (!isDirty || isSaving) return
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute("href") ?? ""
      if (!href.startsWith("/") && !href.startsWith(window.location.origin)) return
      e.preventDefault()
      e.stopPropagation()
      setLeaveTarget(href)
    }
    document.addEventListener("click", handler, true)
    return () => document.removeEventListener("click", handler, true)
  }, [isDirty, isSaving])

  React.useEffect(() => {
    const shouldBlock = isDirty && !isSaving
    setRouteLoaderBlocked(shouldBlock)
    return () => setRouteLoaderBlocked(false)
  }, [isDirty, isSaving, setRouteLoaderBlocked])

  const handleFormChange = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement | null
    if (target?.closest("[data-ignore-dirty='true']")) return
    setIsDirty(true)
  }, [])

  const handleDiscardAndLeave = React.useCallback(() => {
    if (!leaveTarget) return
    const target = leaveTarget
    setLeaveTarget(null)
    setIsDirty(false)
    setRouteLoaderBlocked(false)

    if (target.startsWith("/")) {
      window.dispatchEvent(new Event(ROUTE_LOADER_START_EVENT))
      router.push(target)
      return
    }

    if (target.startsWith(window.location.origin)) {
      const url = new URL(target)
      window.dispatchEvent(new Event(ROUTE_LOADER_START_EVENT))
      router.push(`${url.pathname}${url.search}${url.hash}`)
      return
    }

    window.location.href = target
  }, [leaveTarget, router, setRouteLoaderBlocked])

  const handleDeleteBot = React.useCallback(() => {
    const formData = new FormData()
    formData.set("redirect_to", backHref)
    formData.set("bot_id", bot.id)
    setShowDeleteBotConfirm(false)
    startDeleteBotTransition(() => deleteBotAction(formData))
  }, [backHref, bot.id, deleteBotAction])

  type ReindexState = { sourceId: string | null; phase: "idle" | "running" | "done" | "error"; error: string | null; warnings: string[] }
  const [reindexState, setReindexState] = React.useState<ReindexState>({ sourceId: null, phase: "idle", error: null, warnings: [] })
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [confirmReindexId, setConfirmReindexId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [addFileLoading, setAddFileLoading] = React.useState(false)
  type SourceDetailState = { sourceId: string; pages: SourcePage[]; loading: boolean; error?: string; viewingPage: SourcePage | null; pageText: string | null; pageTextLoading: boolean; pageTextError?: string }
  const [sourceDetail, setSourceDetail] = React.useState<SourceDetailState | null>(null)

  React.useEffect(() => {
    if (urlIndexing.phase === "done") {
      router.refresh()
      const t = setTimeout(() => setUrlIndexing(IDLE_STATE), 2500)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIndexing.phase])

  React.useEffect(() => {
    if (reindexState.phase === "done") {
      router.refresh()
      const t = setTimeout(() => setReindexState({ sourceId: null, phase: "idle", error: null, warnings: [] }), 2500)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reindexState.phase])

  const applyPreviewPageUrl = React.useCallback(() => {
    const normalized = normalizePreviewPageUrl(previewPageUrlInput)
    if (!normalized) {
      setPreviewPageUrlError("URL形式が不正です。http:// または https:// のURLを入力してください。")
      return
    }
    setPreviewPageUrl(normalized)
    setPreviewPageUrlInput(normalized)
    setPreviewPageUrlError(null)
  }, [previewPageUrlInput])

  async function handleRotateToken() {
    setRotatingToken(true)
    setIssuedToken(null)
    setShowRotateConfirm(false)
    try {
      const res = await fetch("/api/console/widget-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: bot.id, bot_public_id: bot.public_id }),
      })
      const data = (await res.json()) as { token?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "トークン発行に失敗しました。")
      setIssuedToken(data.token ?? null)
      setHasToken(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : "トークン発行に失敗しました。")
    } finally {
      setRotatingToken(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setLogoUploading(true)
    setLogoError(null)
    try {
      const fd = new FormData()
      fd.set("bot_id", bot.id)
      fd.set("logo", file)
      const res = await fetch("/api/console/bot-logo", { method: "POST", body: fd })
      const data = (await res.json()) as { publicUrl?: string; error?: string }
      if (!res.ok || !data.publicUrl) throw new Error(data.error ?? "アップロードに失敗しました")
      setLogoUrl(data.publicUrl)
      setIsDirty(true)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "アップロードに失敗しました")
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleUrlSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const url = urlInputRef.current?.value.trim() ?? ""
    if (!url || urlIndexing.phase === "running") return

    setUrlIndexing({
      phase: "running",
      steps: [
        { id: "fetch", label: "ページを取得中", status: "active" },
        ...(indexMode === "llm" ? [{ id: "llm", label: "AI構造化", status: "pending" as const }] : []),
        { id: "openai", label: "ナレッジに登録", status: "pending" },
      ],
      pageProgress: null,
      error: null,
      warnings: [],
    })

    try {
      // Step 1: Create source + job in DB via Next.js API (handles auth + billing check)
      const initRes = await fetch("/api/v1/index-url-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, url, mode: indexMode }),
      })
      if (!initRes.ok) {
        const err = (await initRes.json().catch(() => ({ error: "初期化に失敗しました。" }))) as { error?: string }
        setUrlIndexing((s) => ({ ...s, phase: "error", error: err.error ?? "エラーが発生しました。" }))
        return
      }
      const { jobId } = (await initRes.json()) as { jobId: string }

      // Step 2: Stream SSE from Supabase Edge Function (no Vercel timeout constraint)
      const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv()
      const { data: { session } } = await createClient().auth.getSession()
      const jwt = session?.access_token ?? supabaseAnonKey
      const edgeFn = indexMode === "llm" ? "index-url-llm" : "index-url"
      const fnResponse = await fetch(`${supabaseUrl}/functions/v1/${edgeFn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify({ jobId }),
      })

      if (!fnResponse.ok) {
        const errText = await fnResponse.text().catch(() => "")
        setUrlIndexing((s) => ({ ...s, phase: "error", error: `Edge Function エラー (${fnResponse.status}): ${errText}` }))
        return
      }

      const reader = fnResponse.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""
        for (const part of parts) {
          const line = part.trimStart()
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6)) as { type: string; [k: string]: unknown }
            setUrlIndexing((s) => {
              const steps = s.steps.map((step) => ({ ...step }))
              const mark = (id: string, status: IndexStep["status"], label?: string) => {
                const idx = steps.findIndex((st) => st.id === id)
                if (idx >= 0) steps[idx] = { ...steps[idx], status, ...(label ? { label } : {}) }
              }
              switch (event.type) {
                case "fetching_sitemap":
                  mark("fetch", "active", "サイトマップを取得中")
                  return { ...s, steps }
                case "sitemap_ready":
                  mark("fetch", "active", `サイトマップ取得完了 (${event.total as number}件のURL)`)
                  return { ...s, steps }
                case "single_page":
                  mark("fetch", "active", "ページを取得中")
                  return { ...s, steps }
                case "page_progress":
                  mark("fetch", "active", `ページ取得中 ${event.done as number} / ${event.total as number}`)
                  return { ...s, steps, pageProgress: { done: event.done as number, total: event.total as number } }
                case "llm_structuring_page":
                  mark("fetch", "done")
                  mark("llm", "active", `AI構造化中...`)
                  return { ...s, steps }
                case "structuring_llm":
                  mark("fetch", "done")
                  mark("llm", "active", `AI構造化中 ${event.done as number} / ${event.total as number}`)
                  return { ...s, steps, pageProgress: { done: event.done as number, total: event.total as number } }
                case "syncing_openai":
                  mark("fetch", "done")
                  mark("llm", "done")
                  mark("openai", "active", "ナレッジに登録中")
                  return { ...s, steps, pageProgress: null }
                case "source_ready":
                  mark("fetch", "done")
                  mark("openai", "done")
                  if (urlInputRef.current) urlInputRef.current.value = ""
                  return { ...s, steps, phase: "done", pageProgress: null }
                case "llm_input_truncated":
                  return {
                    ...s,
                    warnings: [
                      ...s.warnings,
                      `文字数超過のため先頭${(event.limit as number).toLocaleString()}文字を使用: ${event.pageUrl as string}`,
                    ],
                  }
                case "llm_output_truncated":
                  return {
                    ...s,
                    warnings: [
                      ...s.warnings,
                      `AI出力が上限に達した可能性があります: ${event.pageUrl as string}`,
                    ],
                  }
                case "error":
                  return { ...s, phase: "error", error: (event.message as string) ?? "エラーが発生しました。" }
              }
              return s
            })
          } catch {
            // JSON parse 失敗は無視
          }
        }
      }
    } catch (err) {
      setUrlIndexing((s) => ({
        ...s,
        phase: "error",
        error: err instanceof Error ? err.message : "エラーが発生しました。",
      }))
    }
  }

  async function handleOpenSourceDetail(sourceId: string) {
    setSourceDetail({ sourceId, pages: [], loading: true, viewingPage: null, pageText: null, pageTextLoading: false })
    const result = await getSourcePagesAction(sourceId)
    setSourceDetail((s) => s ? { ...s, pages: result.pages, loading: false, error: result.error } : null)
  }

  async function handleViewPageText(page: SourcePage) {
    if (!sourceDetail) return
    setSourceDetail((s) => s ? { ...s, viewingPage: page, pageText: null, pageTextLoading: true, pageTextError: undefined } : null)
    if (!page.text_path) {
      setSourceDetail((s) => s ? { ...s, pageTextLoading: false, pageTextError: "このページのテキストパスが記録されていません。再インデックスを実行してください。" } : null)
      return
    }
    const result = await getSourceTextAction(sourceDetail.sourceId, page.text_path)
    setSourceDetail((s) => s ? { ...s, pageText: result.text, pageTextLoading: false, pageTextError: result.error } : null)
  }

  async function handleDeleteConfirm(sourceId: string) {
    setDeletingId(sourceId)
    const fd = new FormData()
    fd.set("source_id", sourceId)
    fd.set("bot_id", bot.id)
    fd.set("redirect_to", redirectTo ?? "/console/bots")
    await deleteSourceAction(fd)
    // redirect() inside deleteSourceAction will navigate away; this line is unreachable
    setDeletingId(null)
  }

  async function handleReindex(sourceId: string, mode: "raw" | "llm" = indexMode) {
    if (reindexState.phase === "running") return
    setReindexState({ sourceId, phase: "running", error: null, warnings: [] })
    try {
      const initRes = await fetch("/api/v1/reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, botId: bot.id, mode }),
      })
      if (!initRes.ok) {
        const err = (await initRes.json().catch(() => ({ error: "再インデックスの開始に失敗しました。" }))) as { error?: string }
        setReindexState((s) => ({ ...s, phase: "error", error: err.error ?? "エラーが発生しました。" }))
        return
      }
      const { jobId } = (await initRes.json()) as { jobId: string }

      const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv()
      const { data: { session } } = await createClient().auth.getSession()
      const jwt = session?.access_token ?? supabaseAnonKey
      const edgeFn = mode === "llm" ? "index-url-llm" : "index-url"
      const fnResponse = await fetch(`${supabaseUrl}/functions/v1/${edgeFn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify({ jobId }),
      })
      if (!fnResponse.ok) {
        const errText = await fnResponse.text().catch(() => "")
        setReindexState((s) => ({ ...s, phase: "error", error: `Edge Function エラー (${fnResponse.status}): ${errText}` }))
        return
      }

      const reader = fnResponse.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""
        for (const part of parts) {
          const line = part.trimStart()
          if (!line.startsWith("data: ")) continue
          try {
            const event = JSON.parse(line.slice(6)) as { type: string; message?: string; pageUrl?: string; limit?: number }
            if (event.type === "source_ready") {
              setReindexState((s) => ({ ...s, phase: "done" }))
            } else if (event.type === "llm_input_truncated") {
              setReindexState((s) => ({
                ...s,
                warnings: [...s.warnings, `文字数超過のため先頭${(event.limit ?? 0).toLocaleString()}文字を使用`],
              }))
            } else if (event.type === "llm_output_truncated") {
              setReindexState((s) => ({
                ...s,
                warnings: [...s.warnings, "AI出力が上限に達した可能性があります"],
              }))
            } else if (event.type === "error") {
              setReindexState((s) => ({ ...s, phase: "error", error: event.message ?? "エラーが発生しました。" }))
            }
          } catch { /* JSON parse 失敗は無視 */ }
        }
      }
    } catch (err) {
      setReindexState((s) => ({ ...s, phase: "error", error: err instanceof Error ? err.message : "エラーが発生しました。" }))
    }
  }

  const internalOptionEnabled = hasHostedPage

  React.useEffect(() => {
    if (!internalOptionEnabled && accessMode !== "public") setAccessMode("public")
    if (!internalOptionEnabled && requireAuth) setRequireAuth(false)
  }, [internalOptionEnabled, accessMode, requireAuth])

  React.useEffect(() => {
    if (!hasHostedPage && (widgetMode === "redirect" || widgetMode === "both")) {
      setWidgetMode("overlay")
    }
  }, [hasHostedPage, widgetMode])

  const effectiveRequireAuth = internalOptionEnabled && (accessMode === "internal" || requireAuth)
  const historyLimit = Number.isFinite(Number(historyTurnLimit))
    ? Math.max(1, Math.min(maxHistoryTurnLimit, Math.floor(Number(historyTurnLimit))))
    : Math.min(8, maxHistoryTurnLimit)

  return (
    <>
    <AlertDialog open={leaveTarget !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>変更が保存されていません</AlertDialogTitle>
          <AlertDialogDescription>
            保存されていない編集内容があります。このページを離れると変更は失われます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setLeaveTarget(null)}>
            このページに残る
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDiscardAndLeave}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            変更を破棄して移動
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showDeleteBotConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-rose-700 dark:text-rose-300">Botを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作を実行すると、Botは削除状態（アーカイブ）になり、公開URLとWidget利用は停止されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDeleteBotConfirm(false)} disabled={isDeletingBot}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteBot}
            disabled={!isEditor || isDeletingBot}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeletingBot ? "削除中..." : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div className="grid min-w-0 gap-4">
      <div className="min-w-0 overflow-hidden rounded-xl border border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">

        {/* 上段: ナビゲーション + アクション */}
        <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2.5 dark:border-white/8 sm:px-4">
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">Bot一覧</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {isDirty && !isSaving && (
              <span className="hidden animate-in fade-in text-[11px] text-amber-600 dark:text-amber-400 sm:inline">
                未保存の変更があります
              </span>
            )}
            {hasHostedPage ? (
              <Link
                href={`/chat-by-knotic/${bot.public_id}?preview=1`}
                target="_blank"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/20 px-2.5 py-1.5 text-xs transition-colors hover:bg-slate-50 dark:border-white/15 dark:hover:bg-slate-800"
              >
                <ExternalLink className="size-3" />
                <span className="hidden sm:inline">{bot.is_public ? "公開画面を確認" : "プレビュー確認"}</span>
              </Link>
            ) : null}
            <Button
              type="submit"
              form={`save_bot_${bot.id}`}
              size="sm"
              className={`shrink-0 rounded-full transition-all ${isDirty && !isSaving ? "ring-2 ring-amber-400/60" : ""}`}
              disabled={!isEditor || isSaving}
            >
              {isSaving ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">保存中…</span><span className="sm:hidden">保存中</span></>
              ) : (
                <><Save className="mr-1.5 h-3.5 w-3.5" /><span className="hidden sm:inline">設定を保存</span><span className="sm:hidden">保存</span></>
              )}
            </Button>
          </div>
        </div>

        {/* 中段: Bot名 + ステータス情報 */}
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                bot.is_public ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
              )}
            />
            <h1 className="text-xl font-bold tracking-tight">{bot.name}</h1>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-5 text-xs text-muted-foreground">
            <span>{PURPOSE_LABEL[chatPurpose] ?? chatPurpose}</span>
            <span className="opacity-25">·</span>
            <span className={cn(accessMode === "internal" && "font-medium text-amber-600 dark:text-amber-400")}>
              {accessMode === "internal" ? "社内限定" : "公開利用"}
            </span>
            <span className="opacity-25">·</span>
            <span>{widgetEnabled ? "Widget 有効" : "Widget 無効"}</span>
          </div>
          <p className="mt-1 pl-5 text-[11px] text-muted-foreground/50">Bot ID: {bot.public_id}</p>
        </div>

        {/* 下段: タブ */}
        <div className="overflow-x-auto border-t border-black/10 px-3 pb-3 pt-2 dark:border-white/8">
          <div className="flex min-w-max gap-0.5 rounded-xl bg-slate-100 p-1 sm:min-w-full dark:bg-slate-800/80">
            {TAB_ITEMS.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "inline-flex flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all sm:flex-1",
                    active
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

      </div>

      <form
        id={`save_bot_${bot.id}`}
        action={(fd) => startSaveTransition(() => saveAction(fd))}
        onChange={handleFormChange}
        className="grid min-w-0 gap-4 rounded-xl border border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 sm:p-4"
      >
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="bot_id" value={bot.id} />
        <input type="hidden" name="active_tab" value={activeTab} />
        <input type="hidden" name="bot_logo_url" value={logoUrl ?? ""} />
        <input type="hidden" name="launcher_show_label" value={String(launcherShowLabel)} />

        <Panel active={activeTab === "basic"}>
          <div className="grid gap-1">
            <p className="text-sm font-semibold">基本設定</p>
            <p className="text-xs text-muted-foreground">Bot情報と公開方式を設定します。</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Bot状態（有効/無効）の切り替えは、この下の「Bot状態管理」エリアで実行します。
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`name_${bot.id}`}>Bot名</Label>
              <Input id={`name_${bot.id}`} name="name" value={botName} onChange={(e) => setBotName(e.target.value)} disabled={!isEditor} />
              <p className="text-[11px] text-muted-foreground">Bot名/サービス表示名は30日で3回まで変更できます。</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`display_name_${bot.id}`}>サービス表示名</Label>
              <Input id={`display_name_${bot.id}`} name="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!isEditor} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`chat_purpose_${bot.id}`}>チャット目的</Label>
              <select
                id={`chat_purpose_${bot.id}`}
                name="chat_purpose"
                className={SELECT_CLASS}
                value={chatPurpose}
                onChange={(e) => setChatPurpose(e.target.value)}
                disabled={!isEditor}
              >
                {PURPOSE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`access_mode_${bot.id}`}>公開モード</Label>
              <select
                id={`access_mode_${bot.id}`}
                name="access_mode"
                className={SELECT_CLASS}
                value={accessMode}
                onChange={(e) => setAccessMode(e.target.value)}
                disabled={!isEditor || !internalOptionEnabled}
              >
                <option value="public">公開（顧客向け）</option>
                {internalOptionEnabled ? <option value="internal">社内限定（認証前提）</option> : null}
              </select>
              {!internalOptionEnabled ? (
                <p className="text-[11px] text-muted-foreground">現在プランでは社内限定（認証）モードは利用できません。</p>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel active={activeTab === "bot"}>
          <div className="grid gap-1">
            <p className="text-sm font-semibold">Bot設定</p>
            <p className="text-xs text-muted-foreground">会話挙動・文言を設定します。</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`history_turn_limit_${bot.id}`}>会話履歴ターン数</Label>
              <Input
                id={`history_turn_limit_${bot.id}`}
                name="history_turn_limit"
                type="number"
                min={1}
                max={maxHistoryTurnLimit}
                value={historyTurnLimit}
                onChange={(e) => setHistoryTurnLimit(e.target.value)}
                disabled={!isEditor}
              />
              <p className="text-[11px] text-muted-foreground">現在プラン上限: {maxHistoryTurnLimit}ターン</p>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`welcome_message_${bot.id}`}>初期メッセージ</Label>
              <Textarea
                id={`welcome_message_${bot.id}`}
                name="welcome_message"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                disabled={!isEditor}
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label>ワンタッチ質問</Label>
                <span className="text-[11px] text-muted-foreground">{faqQuestions.filter(Boolean).length} / 5</span>
              </div>
              <p className="text-[11px] text-muted-foreground">初期画面に表示されるクイック質問ボタン。クリックするとそのままAIに送信されます。</p>

              {/* hidden inputs for form submission (5 slots) */}
              {faqSlots.map((v, i) => (
                <input key={i} type="hidden" name={`faq_question_${i}`} value={v} />
              ))}

              <div className="grid gap-2">
                {faqQuestions.map((q, i) => {
                  const isOnlyEmpty = faqQuestions.length === 1 && q === ""
                  const isLast = i === faqQuestions.length - 1
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <div className="relative flex-1">
                        <Input
                          value={q}
                          onChange={(e) => handleFaqChange(i, e.target.value)}
                          placeholder={isLast ? "質問を入力…" : `質問 ${i + 1}`}
                          disabled={!isEditor}
                          maxLength={80}
                          className={q.length > 0 ? "pr-12 text-sm" : "text-sm"}
                        />
                        {q.length > 0 && (
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50">
                            {q.length}/80
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        disabled={!isEditor || isOnlyEmpty}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-all hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label="削除"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )
                })}

                {faqQuestions.filter(Boolean).length >= 5 && (
                  <p className="text-[11px] text-muted-foreground">最大5件に達しました。</p>
                )}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`placeholder_text_${bot.id}`}>入力プレースホルダ</Label>
              <Input
                id={`placeholder_text_${bot.id}`}
                name="placeholder_text"
                value={placeholderText}
                onChange={(e) => setPlaceholderText(e.target.value)}
                disabled={!isEditor}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`disclaimer_text_${bot.id}`}>免責文</Label>
              <Textarea
                id={`disclaimer_text_${bot.id}`}
                name="disclaimer_text"
                value={disclaimerText}
                onChange={(e) => setDisclaimerText(e.target.value)}
                disabled={!isEditor}
              />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="show_citations"
                checked={showCitations}
                onChange={(e) => setShowCitations(e.target.checked)}
                disabled={!isEditor}
              />
              回答時に根拠（引用）を表示
            </label>
            {internalOptionEnabled ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="require_auth_for_hosted"
                  checked={effectiveRequireAuth}
                  onChange={(e) => setRequireAuth(e.target.checked)}
                  disabled={!isEditor}
                />
                Hostedチャットで認証を必須化
              </label>
            ) : null}
          </div>
        </Panel>

        <Panel active={activeTab === "ai"}>
          <div className="grid gap-1">
            <p className="text-sm font-semibold">AI設定</p>
            <p className="text-xs text-muted-foreground">モデル・トークン制限・情報ソースを管理します。</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label>RAG方式</Label>
              <Input value="ナレッジ検索（固定）" disabled />
              <p className="text-[11px] text-muted-foreground">
                この環境ではFile Search運用を標準化しており、Legacy Vectorは利用しません。
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`ai_model_${bot.id}`}>モデル</Label>
              <select
                id={`ai_model_${bot.id}`}
                name="ai_model"
                className={SELECT_CLASS}
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                disabled={!isEditor}
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={model} value={model}>
                    {MODEL_LABELS[model] ?? model}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`ai_fallback_model_${bot.id}`}>フォールバック</Label>
              <select
                id={`ai_fallback_model_${bot.id}`}
                name="ai_fallback_model"
                className={SELECT_CLASS}
                value={aiFallbackModel}
                onChange={(e) => setAiFallbackModel(e.target.value)}
                disabled={!isEditor}
              >
                <option value="">なし</option>
                {MODEL_OPTIONS.map((model) => (
                  <option key={model} value={model}>
                    {MODEL_LABELS[model] ?? model}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`ai_max_output_tokens_${bot.id}`}>最大出力トークン</Label>
              <Input
                id={`ai_max_output_tokens_${bot.id}`}
                name="ai_max_output_tokens"
                type="number"
                min={200}
                max={4000}
                value={aiMaxOutputTokens}
                onChange={(e) => setAiMaxOutputTokens(e.target.value)}
                disabled={!isEditor}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            情報ソースの追加・再インデックスは、この下の「情報ソース管理」エリアから実行します。
          </p>
        </Panel>

        <Panel active={activeTab === "theme"}>
          <div className="grid gap-1">
            <p className="text-sm font-semibold">テーマ設定</p>
            <p className="text-xs text-muted-foreground">ロゴとヘッダー/フッター配色を調整できます。</p>
          </div>

          {/* ロゴアップロード */}
          <div className="grid gap-2 rounded-lg border border-black/15 p-3 dark:border-white/10">
            <Label>ロゴ画像</Label>
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={logoUrl ?? "/images/knotic-square-logo.png"}
                alt="ロゴプレビュー"
                className="size-14 rounded-lg border border-black/15 object-contain dark:border-white/10"
              />
              <div className="grid gap-1.5">
                <div className="flex flex-wrap gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-black/20 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 dark:border-white/15 dark:hover:bg-slate-800 ${!isEditor || logoUploading ? "pointer-events-none opacity-50" : ""}`}>
                    {logoUploading ? <Loader2 className="size-3 animate-spin" /> : null}
                    {logoUploading ? "アップロード中..." : "画像を選択"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      className="hidden"
                      disabled={!isEditor || logoUploading}
                      onChange={handleLogoUpload}
                    />
                  </label>
                  {logoUrl ? (
                    <button
                      type="button"
                      disabled={!isEditor}
                      onClick={() => { setLogoUrl(null); setIsDirty(true) }}
                      className="inline-flex items-center gap-1 rounded-full border border-black/20 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-red-50 dark:border-white/15 dark:hover:bg-red-950/30"
                    >
                      <X className="size-3" />
                      削除
                    </button>
                  ) : null}
                </div>
                {logoError ? <p className="text-[11px] text-destructive">{logoError}</p> : null}
                <p className="text-[11px] text-muted-foreground">PNG/JPG/WebP/SVG  最大2MB。未設定時はデフォルトロゴを使用します。</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>ヘッダー背景色</Label>
              <div className="flex items-center gap-2">
                <Input
                  name="ui_header_bg_color"
                  type="color"
                  value={headerBgColor}
                  onChange={(e) => setHeaderBgColor(e.target.value)}
                  disabled={!isEditor}
                  className="h-11 w-20 p-1"
                />
                <Input value={headerBgColor} onChange={(e) => setHeaderBgColor(e.target.value)} disabled={!isEditor} className="h-11" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>ヘッダー文字色</Label>
              <div className="flex items-center gap-2">
                <Input
                  name="ui_header_text_color"
                  type="color"
                  value={headerTextColor}
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  disabled={!isEditor}
                  className="h-11 w-20 p-1"
                />
                <Input value={headerTextColor} onChange={(e) => setHeaderTextColor(e.target.value)} disabled={!isEditor} className="h-11" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>フッター背景色</Label>
              <div className="flex items-center gap-2">
                <Input
                  name="ui_footer_bg_color"
                  type="color"
                  value={footerBgColor}
                  onChange={(e) => setFooterBgColor(e.target.value)}
                  disabled={!isEditor}
                  className="h-11 w-20 p-1"
                />
                <Input value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} disabled={!isEditor} className="h-11" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>フッター文字色</Label>
              <div className="flex items-center gap-2">
                <Input
                  name="ui_footer_text_color"
                  type="color"
                  value={footerTextColor}
                  onChange={(e) => setFooterTextColor(e.target.value)}
                  disabled={!isEditor}
                  className="h-11 w-20 p-1"
                />
                <Input value={footerTextColor} onChange={(e) => setFooterTextColor(e.target.value)} disabled={!isEditor} className="h-11" />
              </div>
            </div>
          </div>
        </Panel>

        <Panel active={activeTab === "widget"}>
          <div className="grid gap-1">
            <p className="text-sm font-semibold">Widget表示設定</p>
            <p className="text-xs text-muted-foreground">既存サイト埋め込み用の表示・導線とトークン運用を設定します。</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="widget_enabled" checked={widgetEnabled} onChange={(e) => setWidgetEnabled(e.target.checked)} disabled={!isEditor} />
            Widgetを有効にする
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`widget_mode_${bot.id}`}>起動モード</Label>
              <select
                id={`widget_mode_${bot.id}`}
                name="widget_mode"
                className={SELECT_CLASS}
                value={widgetMode}
                onChange={(e) => setWidgetMode(e.target.value)}
                disabled={!isEditor}
              >
                <option value="overlay">モーダル表示</option>
                <option value="redirect" disabled={!hasHostedPage}>
                  公開URLへ遷移{!hasHostedPage ? "（要Hosted Page）" : ""}
                </option>
                <option value="both" disabled={!hasHostedPage}>
                  両方対応{!hasHostedPage ? "（要Hosted Page）" : ""}
                </option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`widget_position_${bot.id}`}>ボタン位置</Label>
              <select
                id={`widget_position_${bot.id}`}
                name="widget_position"
                className={SELECT_CLASS}
                value={widgetPosition}
                onChange={(e) => setWidgetPosition(e.target.value)}
                disabled={!isEditor}
              >
                <option value="right-bottom">右下</option>
                <option value="right-top">右上</option>
              </select>
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`widget_launcher_label_${bot.id}`}>ボタンラベル</Label>
                <span className={`text-[11px] tabular-nums ${widgetLauncherLabel.length >= 8 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {widgetLauncherLabel.length}/8
                </span>
              </div>
              <Input
                id={`widget_launcher_label_${bot.id}`}
                name="widget_launcher_label"
                value={widgetLauncherLabel}
                maxLength={8}
                onChange={(e) => setWidgetLauncherLabel(e.target.value.slice(0, 8))}
                disabled={!isEditor}
              />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={launcherShowLabel}
                  onChange={(e) => setLauncherShowLabel(e.target.checked)}
                  disabled={!isEditor}
                />
                ラベルテキストをボタンに表示する
              </label>
              <p className="text-[11px] text-muted-foreground">
                オフにするとロゴ画像のみのアイコンボタンになります。ロゴ未設定時はデフォルトロゴが表示されます。
              </p>
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={`widget_policy_text_${bot.id}`}>ポリシー表示文</Label>
              <Textarea
                id={`widget_policy_text_${bot.id}`}
                name="widget_policy_text"
                value={widgetPolicyText}
                onChange={(e) => setWidgetPolicyText(e.target.value)}
                disabled={!isEditor}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="widget_redirect_new_tab"
              checked={widgetRedirectNewTab}
              onChange={(e) => setWidgetRedirectNewTab(e.target.checked)}
              disabled={!isEditor}
            />
            redirect時は新しいタブで開く
          </label>

          <p className="text-xs text-muted-foreground">トークン発行と許可オリジン管理は、この下の「Widgetトークン管理」エリアで実行します。</p>
        </Panel>

        <Panel active={activeTab === "preview"}>
          <div className="grid gap-4" data-ignore-dirty="true">
            {/* ヘッダー: タイトル + モード切り替え + リセット */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="grid gap-0.5">
                <p className="text-sm font-semibold">プレビュー</p>
                <p className="text-xs text-muted-foreground">実際のAIに接続されたテストチャットです。保存前の表示設定が反映されます。</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* モード切り替えタブ */}
                <div className="flex rounded-lg border border-black/15 p-0.5 text-xs dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("chat")}
                    className={cn(
                      "rounded-md px-3 py-1.5 font-medium transition-colors",
                      previewMode === "chat"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    チャットUI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("widget")}
                    className={cn(
                      "rounded-md px-3 py-1.5 font-medium transition-colors",
                      previewMode === "widget"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    Widgetランチャー
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try { window.localStorage.removeItem(`knotic_hosted_chat_v1_${bot.public_id}`) } catch { /* ignore */ }
                    setPreviewKey((k) => k + 1)
                  }}
                  className="rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-white/10 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  リセット
                </button>
              </div>
            </div>

            {previewMode === "widget" ? (
              <div className="grid gap-1.5 rounded-lg border border-black/15 bg-slate-50/80 p-2.5 dark:border-white/10 dark:bg-slate-900/40">
                <p className="text-xs font-medium">表示確認URL（既存サイト）</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={previewPageUrlInput}
                    onChange={(event) => {
                      setPreviewPageUrlInput(event.target.value)
                      if (previewPageUrlError) setPreviewPageUrlError(null)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return
                      event.preventDefault()
                      applyPreviewPageUrl()
                    }}
                    placeholder="https://example.com"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={applyPreviewPageUrl}>
                      URLを反映
                    </Button>
                    <Link
                      href={previewPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-white/10 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      別タブで開く
                    </Link>
                  </div>
                </div>
                {previewPageUrlError ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{previewPageUrlError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    注意: 一部サイトはプレビューに表示できない場合や実際の表示環境と多少異なる場合があります。
                  </p>
                )}
              </div>
            ) : null}

            {/* チャットUIモード */}
            {previewMode === "chat" ? (
              <div className="-mx-4 sm:mx-0">
                <HostedChatClient
                  key={previewKey}
                  botPublicId={bot.public_id}
                  displayName={displayName || bot.name}
                  purposeLabel={PURPOSE_LABEL[chatPurpose] ?? "カスタム"}
                  welcomeMessage={welcomeMessage || "こんにちは。ご質問を入力してください。"}
                  faqQuestions={faqQuestions.filter((q) => q.trim() !== "")}
                  placeholderText={placeholderText || "質問を入力"}
                  disclaimerText={disclaimerText || "回答は参考情報です。重要事項は担当者へ確認してください。"}
                  showCitations={showCitations}
                  showRetentionNotice={!effectiveRequireAuth}
                  retentionHours={24}
                  historyTurnLimit={historyLimit}
                  headerBgColor={headerBgColor}
                  headerTextColor={headerTextColor}
                  footerBgColor={footerBgColor}
                  footerTextColor={footerTextColor}
                  logoUrl={logoUrl}
                  showUsageCounterDebug
                />
              </div>
            ) : (
              /* Widgetランチャーモード */
              <div className="-mx-4 sm:mx-0">
                <WidgetLauncherPreview
                  key={previewKey}
                  pageUrl={previewPageUrl}
                  logoUrl={logoUrl}
                  launcherLabel={widgetLauncherLabel}
                  launcherShowLabel={launcherShowLabel}
                  widgetPosition={widgetPosition}
                  previewKey={previewKey}
                  botPublicId={bot.public_id}
                  displayName={displayName || bot.name}
                  purposeLabel={PURPOSE_LABEL[chatPurpose] ?? "カスタム"}
                  welcomeMessage={welcomeMessage || "こんにちは。ご質問を入力してください。"}
                  faqQuestions={faqQuestions.filter((q) => q.trim() !== "")}
                  placeholderText={placeholderText || "質問を入力"}
                  disclaimerText={disclaimerText || "回答は参考情報です。重要事項は担当者へ確認してください。"}
                  showCitations={showCitations}
                  historyTurnLimit={historyLimit}
                  headerBgColor={headerBgColor}
                  headerTextColor={headerTextColor}
                  footerBgColor={footerBgColor}
                  footerTextColor={footerTextColor}
                />
              </div>
            )}
          </div>
        </Panel>

        <div className="border-t border-black/20 pt-3 text-xs text-muted-foreground dark:border-white/10">
          目的: {PURPOSE_LABEL[chatPurpose] ?? "カスタム"}
        </div>
      </form>

      <section className={cn("grid min-w-0 gap-3 rounded-xl border border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 sm:p-4", activeTab !== "basic" && "hidden")}>
        <div className="grid gap-1">
          <p className="text-sm font-semibold">Bot状態管理</p>
          <p className="text-xs text-muted-foreground">
            Bot状態は「有効/無効」で管理します。無効にするとHosted公開URLやWidget経由での利用導線を停止できます。
          </p>
        </div>
        <div className="grid gap-2 rounded-lg border border-black/20 p-3 dark:border-white/10">
          <PublicToggle
            botId={bot.id}
            isPublic={Boolean(bot.is_public)}
            isEditor={isEditor}
            redirectTo={redirectTo}
            action={togglePublicAction}
          />
        </div>
      </section>

      <section className={cn("grid min-w-0 gap-3 rounded-xl border border-rose-300/70 bg-rose-50/80 p-3 dark:border-rose-500/40 dark:bg-rose-950/20 sm:p-4", activeTab !== "basic" && "hidden")}>
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">危険操作</p>
          <p className="text-xs text-rose-700/90 dark:text-rose-200/90">
            Botを削除すると公開URLとWidget利用が停止されます。実行前に必要なデータを確認してください。
          </p>
        </div>
        <div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!isEditor || isDeletingBot}
            onClick={() => setShowDeleteBotConfirm(true)}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            {isDeletingBot ? "削除中..." : "Botを削除"}
          </Button>
        </div>
      </section>

      <section className={cn("grid min-w-0 gap-3 rounded-xl border border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 sm:p-4", activeTab !== "widget" && "hidden")}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-sm font-semibold">Widgetトークン管理</p>
            <p className="text-xs text-muted-foreground">トークン再発行と許可オリジン設定を行います。</p>
          </div>
          <Link
            href="/help/widget"
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/15 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-slate-50 dark:border-white/15 dark:hover:bg-slate-800"
          >
            <FileText className="size-3" />
            実装ガイド
          </Link>
        </div>
        <div className="grid gap-2 rounded-lg border border-black/20 p-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasToken ? "secondary" : "outline"}>
              {hasToken ? "トークン発行済み" : "トークン未発行"}
            </Badge>
            <Badge variant={(widgetTokenRow?.allowed_origins?.length ?? 0) > 0 ? "secondary" : "outline"}>
              許可オリジン {(widgetTokenRow?.allowed_origins?.length ?? 0)} 件
            </Badge>
          </div>

          {issuedToken && (
            <div className="rounded-md border border-amber-300/70 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-950/30">
              <p className="mb-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                発行済みWidgetトークン（この1回のみ表示）
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-white/70 px-2 py-1 font-mono text-[11px] text-amber-900 dark:bg-slate-900/60 dark:text-amber-200">
                  {issuedToken}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs"
                  onClick={() => {
                    void navigator.clipboard.writeText(issuedToken)
                    setTokenCopied(true)
                    setTimeout(() => setTokenCopied(false), 2000)
                  }}
                >
                  {tokenCopied ? <Check className="size-3.5" /> : "コピー"}
                </Button>
              </div>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!isEditor || rotatingToken}
            onClick={() => setShowRotateConfirm(true)}
          >
            {rotatingToken ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />発行中…</> : hasToken ? "トークン再発行" : "トークンを発行"}
          </Button>

          {hasToken ? (
            <form action={updateAllowedOriginsAction} className="grid gap-1">
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <input type="hidden" name="token_id" value={widgetTokenRow?.id ?? ""} />
              <Input
                name="allowed_origins"
                value={allowedOrigins}
                onChange={(e) => setAllowedOrigins(e.target.value)}
                placeholder="https://example.com, https://www.example.com"
                disabled={!isEditor}
              />
              <p className="text-[11px] text-muted-foreground">
                例: https://example.com, https://www.example.com（カンマ区切り）
              </p>
              <Button type="submit" size="sm" variant="secondary" disabled={!isEditor} className="w-fit">
                許可オリジン更新
              </Button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">
              まずトークンを発行すると、許可オリジンを設定できます。
            </p>
          )}
        </div>
      </section>

      <section className={cn("grid min-w-0 gap-4 rounded-xl border border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 sm:p-4", activeTab !== "ai" && "hidden")}>
        <div className="grid gap-1">
          <p className="text-sm font-semibold">情報ソース管理</p>
          <p className="text-xs text-muted-foreground">
            URL/PDFを追加 → 一覧で確認 → インデックス実行、の順で進めます。URL・PDFどちらも再インデックスできます。
          </p>
        </div>

        {/* ① ソース追加（URL / PDF タブ切り替え） */}
        <div className="rounded-lg border border-black/20 p-3 dark:border-white/10">
          <p className="mb-2.5 text-xs font-medium">ソースを追加</p>
          <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setAddSourceTab("url")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                addSourceTab === "url"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setAddSourceTab("file")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                addSourceTab === "file"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              ファイル
            </button>
          </div>

          {addSourceTab !== "file" ? (
            <div className="grid gap-2">
              {urlIndexing.phase === "idle" ? (
                <form onSubmit={handleUrlSubmit} className="grid gap-2">
                  <div className="flex gap-2">
                    <Input
                      ref={urlInputRef}
                      id={`url_source_${bot.id}`}
                      name="url"
                      type="url"
                      placeholder="https://example.com/page またはサイトマップXMLのURL"
                      required
                      disabled={!isEditor}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={!isEditor}>追加</Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">インデックス方式:</span>
                    <div className="inline-flex rounded-md bg-slate-100 p-0.5 dark:bg-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setIndexMode("raw")}
                        className={cn(
                          "rounded px-2.5 py-1 text-[11px] font-medium transition-all",
                          indexMode === "raw"
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        Rawテキスト
                      </button>
                      <button
                        type="button"
                        onClick={() => setIndexMode("llm")}
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all",
                          indexMode === "llm"
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        AI構造化
                      </button>
                    </div>
                    {indexMode === "llm" ? (
                      <span className="text-[11px] text-cyan-600 dark:text-cyan-400">
                        AIがページ内容を整理します（処理時間が増加します）
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60">
                        HTMLからテキストを直接抽出します
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    ページURLを直接指定するか、サイトマップXML（.xml）を指定すると最大50ページを自動収集します。
                  </p>
                </form>
              ) : (
                <div className={cn(
                  "rounded-lg border p-3 transition-colors",
                  urlIndexing.phase === "running" && "border-cyan-200/60 bg-cyan-50/40 dark:border-cyan-800/40 dark:bg-cyan-950/20",
                  urlIndexing.phase === "done" && "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20",
                  urlIndexing.phase === "error" && "border-rose-200/60 bg-rose-50/40 dark:border-rose-800/40 dark:bg-rose-950/20",
                )}>
                  <div className="mb-2 flex items-center gap-1.5">
                    {urlIndexing.phase === "running" && <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />}
                    {urlIndexing.phase === "done" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    {urlIndexing.phase === "error" && <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                    <span className={cn(
                      "text-xs font-medium",
                      urlIndexing.phase === "running" && "text-cyan-700 dark:text-cyan-300",
                      urlIndexing.phase === "done" && "text-emerald-700 dark:text-emerald-300",
                      urlIndexing.phase === "error" && "text-rose-700 dark:text-rose-400",
                    )}>
                      {urlIndexing.phase === "running" && "インデックス中..."}
                      {urlIndexing.phase === "done" && "インデックス完了"}
                      {urlIndexing.phase === "error" && "エラーが発生しました"}
                    </span>
                  </div>

                  {urlIndexing.phase === "error" ? (
                    <div className="grid gap-2">
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">{urlIndexing.error}</p>
                      <button
                        type="button"
                        onClick={() => setUrlIndexing(IDLE_STATE)}
                        className="w-fit text-[11px] underline text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        やり直す
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-1.5">
                      {urlIndexing.steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-1.5">
                          {step.status === "done" && <Check className="h-3 w-3 shrink-0 text-emerald-500" />}
                          {step.status === "active" && <Loader2 className="h-3 w-3 shrink-0 text-cyan-500 animate-spin" />}
                          {step.status === "pending" && <div className="h-3 w-3 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" />}
                          <span className={cn(
                            "text-[11px]",
                            step.status === "done" && "text-slate-500 dark:text-slate-400",
                            step.status === "active" && "font-medium text-slate-700 dark:text-slate-200",
                            step.status === "pending" && "text-slate-400 dark:text-slate-500",
                          )}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                      {urlIndexing.pageProgress && (
                        <div className="pl-4.5 mt-0.5">
                          <div className="h-1 w-36 rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                              style={{ width: `${Math.round((urlIndexing.pageProgress.done / urlIndexing.pageProgress.total) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {urlIndexing.warnings.length > 0 && (
                        <div className="mt-1.5 grid gap-0.5 pl-4.5">
                          {urlIndexing.warnings.map((w, i) => (
                            <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400">⚠ {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form
              action={async (fd) => {
                setAddFileLoading(true)
                await addFileSourceAction(fd)
                setAddFileLoading(false)
              }}
              className="grid gap-2"
            >
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <input type="hidden" name="bot_id" value={bot.id} />
              <div className="flex gap-2 items-center">
                <Input
                  id={`file_source_${bot.id}`}
                  name="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.pptx,.tex,.txt,.md,.html,.css,.json,.c,.cpp,.cs,.go,.java,.js,.ts,.py,.rb,.rs,.sh,.php,.csv,.xlsx,.xls"
                  required
                  disabled={!isEditor || addFileLoading}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!isEditor || addFileLoading}>
                  {addFileLoading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />アップロード中</> : "追加"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                PDF・Word・PowerPoint・CSV・Excel・テキストなど対応。1ファイル最大20MB。
              </p>
            </form>
          )}
        </div>

        {/* ② 登録済みソース一覧 */}
        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            登録済みソース{botSources.length > 0 ? `（${botSources.length}件）` : ""}
          </p>
          {botSources.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/20 px-4 py-6 text-center dark:border-white/15">
              <p className="text-xs text-muted-foreground">まだソースが登録されていません。上のフォームから追加してください。</p>
            </div>
          ) : (
            botSources.map((source) => (
              <div
                key={source.id}
                className="grid gap-2 rounded-lg border border-black/20 p-3 dark:border-white/10 sm:flex sm:items-start sm:justify-between sm:gap-3"
              >
                {/* 左: ソース情報 */}
                <div className="min-w-0 grid gap-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {source.type === "url" ? "URL" : "PDF"}
                    </span>
                    <SourceStatusBadge status={source.status} />
                    {source.index_mode === "llm" ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI構造化
                      </span>
                    ) : source.index_mode === "raw" ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Raw
                      </span>
                    ) : null}
                    {source.file_size_bytes ? (
                      <span className="text-[10px] text-muted-foreground">{formatMbFromBytes(source.file_size_bytes)}</span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs font-medium">{source.url ?? source.file_name ?? "-"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    最終同期: {formatDateTime(source.file_search_last_synced_at)}
                    {!source.file_search_provider ? "（未同期）" : ""}
                  </p>
                  {source.file_search_error ? (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">エラー: {source.file_search_error}</p>
                  ) : null}
                </div>

                {/* 右: アクション */}
                <div className="shrink-0 grid gap-1">
                  {deletingId === source.id ? (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[11px]">削除中...</span>
                    </div>
                  ) : confirmDeleteId === source.id ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">削除しますか？</span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => { setConfirmDeleteId(null); void handleDeleteConfirm(source.id) }}
                        >
                          削除する
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : confirmReindexId === source.id ? (
                    <div className="grid gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">再実行しますか？</span>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => { setConfirmReindexId(null); void handleReindex(source.id, indexMode) }}
                          >
                            実行
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmReindexId(null)}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">方式:</span>
                        <div className="inline-flex rounded bg-slate-100 p-0.5 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => setIndexMode("raw")}
                            className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-medium transition-all",
                              indexMode === "raw"
                                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
                            )}
                          >
                            Raw
                          </button>
                          <button
                            type="button"
                            onClick={() => setIndexMode("llm")}
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-medium transition-all",
                              indexMode === "llm"
                                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
                            )}
                          >
                            <Sparkles className="h-2 w-2" />
                            AI
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!isEditor || reindexState.phase === "running"}
                        onClick={() => setConfirmReindexId(source.id)}
                      >
                        {reindexState.sourceId === source.id && reindexState.phase === "running" ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />処理中</>
                        ) : reindexState.sourceId === source.id && reindexState.phase === "done" ? (
                          <><Check className="mr-1 h-3 w-3" />完了</>
                        ) : "再インデックス"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleOpenSourceDetail(source.id)}
                        className="text-slate-400 hover:text-cyan-600 dark:text-slate-500 dark:hover:text-cyan-400"
                        title="インデックス内容を確認"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!isEditor}
                        onClick={() => setConfirmDeleteId(source.id)}
                        className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
                        title="ソースを削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {reindexState.sourceId === source.id && reindexState.phase === "error" && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400">{reindexState.error}</p>
                  )}
                  {reindexState.sourceId === source.id && reindexState.warnings.length > 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      ⚠ {reindexState.warnings.length}件の警告
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </section>

      {!hasHostedPage ? (
        <div className="rounded-xl border border-black/10 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-slate-900/40">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-slate-700 dark:text-slate-300">Standardプラン以上</span>
            でご利用いただける機能：公開URL・社内限定モード・Hosted認証必須化。
            <Link href="/console/billing" className="ml-1 text-cyan-700 hover:underline dark:text-cyan-400">
              プランを確認する
            </Link>
          </p>
        </div>
      ) : null}

      {showRotateConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-lg border border-black/20 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="text-sm font-semibold">{hasToken ? "Widgetトークンを再発行しますか？" : "Widgetトークンを発行しますか？"}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {hasToken
                ? "既存トークンは失効します。運用中の埋め込みサイトは、新しいトークンへの差し替えが必要です。"
                : "発行後のトークンはこの画面に表示されます。コピーして埋め込みコードに使用してください。"}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
                onClick={() => setShowRotateConfirm(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-slate-900"
                onClick={() => void handleRotateToken()}
              >
                {hasToken ? "再発行する" : "発行する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ソース詳細ダイアログ */}
      <Dialog open={sourceDetail !== null} onOpenChange={(open) => { if (!open) setSourceDetail(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">インデックス内容の確認</DialogTitle>
          </DialogHeader>

          {sourceDetail?.loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中...
            </div>
          ) : sourceDetail?.error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400 py-4">{sourceDetail.error}</p>
          ) : sourceDetail?.viewingPage ? (
            /* ページ本文ビュー */
            <div className="flex flex-col gap-3 min-h-0">
              <button
                type="button"
                onClick={() => setSourceDetail((s) => s ? { ...s, viewingPage: null, pageText: null } : null)}
                className="self-start text-xs text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                ページ一覧に戻る
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{sourceDetail.viewingPage.title ?? sourceDetail.viewingPage.canonical_url}</p>
                <p className="text-[11px] text-muted-foreground truncate">{sourceDetail.viewingPage.canonical_url}</p>
              </div>
              {sourceDetail.pageTextLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  テキストを読み込み中...
                </div>
              ) : sourceDetail.pageText ? (
                <div className="flex-1 overflow-y-auto rounded-md border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3">
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-mono">
                    {sourceDetail.pageText}
                  </pre>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 px-3 py-3 text-xs text-amber-800 dark:text-amber-300 grid gap-1">
                  <p className="font-medium">テキストファイルが見つかりません</p>
                  {sourceDetail.pageTextError ? (
                    <p className="text-[11px] opacity-80">{sourceDetail.pageTextError}</p>
                  ) : null}
                  <p className="text-[11px] opacity-70 mt-0.5">
                    Supabase Dashboard → Storage で <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">source-artifacts</code> バケット（Private）を作成後、再インデックスを実行してください。
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ページ一覧ビュー */
            <div className="flex flex-col gap-3 min-h-0">
              {sourceDetail && sourceDetail.pages.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  インデックス済みページが見つかりません。<br />
                  URLソースは再インデックスを実行してください。
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {sourceDetail?.pages.length ?? 0} ページがインデックスされています。テキストを確認するにはページをクリックしてください。
                  </p>
                  <div className="flex-1 overflow-y-auto grid gap-1">
                    {sourceDetail?.pages.map((page, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => void handleViewPageText(page)}
                        className="text-left rounded-md border border-black/10 dark:border-white/10 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                              {page.title ?? "(タイトルなし)"}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {page.canonical_url}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2 text-[10px] text-muted-foreground">
                            {page.text_bytes ? (
                              <span>{(page.text_bytes / 1024).toFixed(1)} KB</span>
                            ) : null}
                            <span className={cn(
                              "rounded-full px-1.5 py-0.5 font-medium",
                              page.status_code === 200
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                              {page.status_code ?? "-"}
                            </span>
                          </div>
                        </div>
                        {page.fetched_at ? (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDateTime(page.fetched_at)}</p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
