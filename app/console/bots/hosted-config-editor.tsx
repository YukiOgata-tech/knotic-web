"use client"

import Link from "next/link"
import * as React from "react"
import {
  Brain,
  ExternalLink,
  MonitorSmartphone,
  Palette,
  Settings2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import { HostedChatClient } from "@/app/chat-by-knotic/[public_id]/hosted-chat-client"
import { PublicToggle } from "@/app/console/bots/public-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  ai_model: string | null
  ai_fallback_model: string | null
  ai_max_output_tokens: number | null
}

type BotSourceRow = {
  id: string
  bot_id: string | null
  type: "url" | "pdf" | "file"
  status: string
  url: string | null
  file_name: string | null
  file_size_bytes: number | null
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
  saveAction: ActionFn
  togglePublicAction: ActionFn
  rotateWidgetTokenAction: ActionFn
  updateAllowedOriginsAction: ActionFn
  addUrlSourceAction: ActionFn
  addPdfSourceAction: ActionFn
  queueIndexAction: ActionFn
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

const DEFAULT_HEADER_BG = "#0f172a"
const DEFAULT_HEADER_TEXT = "#f8fafc"
const DEFAULT_FOOTER_BG = "#f8fafc"
const DEFAULT_FOOTER_TEXT = "#0f172a"
const DEFAULT_WIDGET_POLICY =
  "このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。"
const MODEL_OPTIONS = ["5-nano", "5-mini", "5", "4o-mini", "4o"] as const
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

function Panel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <section className={cn("grid gap-4", !active && "hidden")}>{children}</section>
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
  saveAction,
  togglePublicAction,
  rotateWidgetTokenAction,
  updateAllowedOriginsAction,
  addUrlSourceAction,
  addPdfSourceAction,
  queueIndexAction,
}: Props) {
  const [activeTab, setActiveTab] = React.useState<ConfigTab>("basic")

  const [botName, setBotName] = React.useState(bot.name)
  const [displayName, setDisplayName] = React.useState(bot.display_name ?? bot.name)
  const [chatPurpose, setChatPurpose] = React.useState(bot.chat_purpose ?? "customer_support")
  const [accessMode, setAccessMode] = React.useState(bot.access_mode ?? "public")
  const [historyTurnLimit, setHistoryTurnLimit] = React.useState(String(bot.history_turn_limit ?? 8))
  const [welcomeMessage, setWelcomeMessage] = React.useState(bot.welcome_message ?? "こんにちは。ご質問を入力してください。")
  const [placeholderText, setPlaceholderText] = React.useState(bot.placeholder_text ?? "質問を入力")
  const [disclaimerText, setDisclaimerText] = React.useState(bot.disclaimer_text ?? "回答は参考情報です。重要事項は担当者へ確認してください。")
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
  const [allowedOrigins, setAllowedOrigins] = React.useState((widgetTokenRow?.allowed_origins ?? []).join(", "))
  const [showRotateConfirm, setShowRotateConfirm] = React.useState(false)
  const rotateFormRef = React.useRef<HTMLFormElement>(null)
  const [aiModel, setAiModel] = React.useState(bot.ai_model ?? "5-mini")
  const [aiFallbackModel, setAiFallbackModel] = React.useState(bot.ai_fallback_model ?? "")
  const [aiMaxOutputTokens, setAiMaxOutputTokens] = React.useState(String(bot.ai_max_output_tokens ?? 1200))

  const internalOptionEnabled = hasHostedPage

  React.useEffect(() => {
    if (!internalOptionEnabled && accessMode !== "public") setAccessMode("public")
    if (!internalOptionEnabled && requireAuth) setRequireAuth(false)
  }, [internalOptionEnabled, accessMode, requireAuth])

  const effectiveRequireAuth = internalOptionEnabled && (accessMode === "internal" || requireAuth)
  const historyLimit = Number.isFinite(Number(historyTurnLimit))
    ? Math.max(1, Math.min(maxHistoryTurnLimit, Math.floor(Number(historyTurnLimit))))
    : Math.min(8, maxHistoryTurnLimit)

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-lg font-semibold">{bot.name}</p>
            <p className="text-xs text-muted-foreground">public_id: {bot.public_id}</p>
            {!hasHostedPage ? (
              <p className="text-xs text-muted-foreground">
                LiteプランではHosted専用項目（社内限定/認証必須）は選択できません。
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={backHref} className="text-sm text-cyan-700 hover:underline dark:text-cyan-300">
              Bot一覧へ戻る
            </Link>
            <Button type="submit" form={`save_bot_${bot.id}`} className="rounded-full" disabled={!isEditor}>
              設定を保存
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-black/20 pt-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={bot.is_public ? "default" : "outline"}>{bot.is_public ? "有効" : "無効"}</Badge>
            <Badge variant="outline">{accessMode === "internal" ? "社内限定" : "公開利用"}</Badge>
            <Badge variant="outline">{widgetEnabled ? "Widget ON" : "Widget OFF"}</Badge>
            {hasHostedPage ? (
              <Link
                href={`/chat-by-knotic/${bot.public_id}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
              >
                公開画面
                <ExternalLink className="size-3" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-3 overflow-x-auto border-t border-black/20 pt-3 dark:border-white/10">
          <div className="inline-flex min-w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {TAB_ITEMS.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition",
                    active
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-700/70"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <form id={`save_bot_${bot.id}`} action={saveAction} className="grid gap-4 rounded-xl border border-black/20 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/80">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="bot_id" value={bot.id} />

        <Panel active={activeTab === "basic"}>
          <div className="grid gap-1">
            <p className="text-sm font-semibold">基本設定</p>
            <p className="text-xs text-muted-foreground">Bot情報と公開方式を設定します。</p>
          </div>
          <div className="grid gap-2 rounded-lg border border-black/20 p-3 dark:border-white/10">
            <p className="text-xs text-muted-foreground">
              Bot状態は「有効/無効」で管理します。無効にするとHosted公開URLやWidget経由での利用導線を停止できます。
            </p>
            <PublicToggle
              botId={bot.id}
              isPublic={Boolean(bot.is_public)}
              isEditor={isEditor}
              redirectTo={redirectTo}
              action={togglePublicAction}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`name_${bot.id}`}>Bot名</Label>
              <Input id={`name_${bot.id}`} name="name" value={botName} onChange={(e) => setBotName(e.target.value)} disabled={!isEditor} />
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="require_auth_for_hosted"
                checked={effectiveRequireAuth}
                onChange={(e) => setRequireAuth(e.target.checked)}
                disabled={!isEditor || !internalOptionEnabled}
              />
              Hostedチャットで認証を必須化
            </label>
          </div>
        </Panel>

        <Panel active={activeTab === "ai"}>
          <div className="grid gap-1">
            <p className="text-sm font-semibold">AI設定</p>
            <p className="text-xs text-muted-foreground">モデル・トークン制限・情報ソースを管理します。</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
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
                    {model}
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
                    {model}
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
            <p className="text-xs text-muted-foreground">ヘッダー/フッター配色を調整します。</p>
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
                <option value="overlay">overlay（モーダル表示）</option>
                <option value="redirect">redirect（公開URLへ遷移）</option>
                <option value="both">both（両方対応）</option>
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
              <Label htmlFor={`widget_launcher_label_${bot.id}`}>ボタンラベル</Label>
              <Input
                id={`widget_launcher_label_${bot.id}`}
                name="widget_launcher_label"
                value={widgetLauncherLabel}
                onChange={(e) => setWidgetLauncherLabel(e.target.value)}
                disabled={!isEditor}
              />
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
          <div className="grid gap-1">
            <p className="text-sm font-semibold">プレビュー</p>
            <p className="text-xs text-muted-foreground">保存前の設定状態でテストチャット表示を確認できます。</p>
          </div>
          <HostedChatClient
            botPublicId={bot.public_id}
            displayName={displayName || bot.name}
            purposeLabel={PURPOSE_LABEL[chatPurpose] ?? "カスタム"}
            welcomeMessage={welcomeMessage || "こんにちは。ご質問を入力してください。"}
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
            disablePersistence
          />
        </Panel>

        <div className="border-t border-black/20 pt-3 text-xs text-muted-foreground dark:border-white/10">
          目的: {PURPOSE_LABEL[chatPurpose] ?? "カスタム"}
        </div>
      </form>

      <section className={cn("grid gap-3 rounded-xl border border-black/20 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/80", activeTab !== "widget" && "hidden")}>
        <div className="grid gap-1">
          <p className="text-sm font-semibold">Widgetトークン管理</p>
          <p className="text-xs text-muted-foreground">トークン再発行と許可オリジン設定を行います。</p>
        </div>
        <div className="grid gap-2 rounded-lg border border-black/20 p-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={widgetTokenRow ? "secondary" : "outline"}>
              {widgetTokenRow ? "トークン発行済み" : "トークン未発行"}
            </Badge>
            <Badge variant={(widgetTokenRow?.allowed_origins?.length ?? 0) > 0 ? "secondary" : "outline"}>
              許可オリジン {(widgetTokenRow?.allowed_origins?.length ?? 0)} 件
            </Badge>
          </div>
          <form ref={rotateFormRef} action={rotateWidgetTokenAction}>
            <input type="hidden" name="redirect_to" value={redirectTo} />
            <input type="hidden" name="bot_id" value={bot.id} />
            <input type="hidden" name="bot_public_id" value={bot.public_id} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!isEditor}
              onClick={() => setShowRotateConfirm(true)}
            >
              トークン再発行
            </Button>
          </form>
          {widgetTokenRow ? (
            <form action={updateAllowedOriginsAction} className="grid gap-1">
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <input type="hidden" name="token_id" value={widgetTokenRow.id} />
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

      <section className={cn("grid gap-3 rounded-xl border border-black/20 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-900/80", activeTab !== "ai" && "hidden")}>
        <div className="grid gap-1">
          <p className="text-sm font-semibold">情報ソース管理</p>
          <p className="text-xs text-muted-foreground">このBot専用のURL/PDFソースを登録し、インデックス処理を行います。</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <form action={addUrlSourceAction} className="grid gap-2 rounded-lg border border-black/20 p-3 dark:border-white/10">
            <input type="hidden" name="redirect_to" value={redirectTo} />
            <input type="hidden" name="bot_id" value={bot.id} />
            <Label htmlFor={`url_source_${bot.id}`}>URLソース追加</Label>
            <Input
              id={`url_source_${bot.id}`}
              name="url"
              type="url"
              placeholder="https://example.com/page"
              required
              disabled={!isEditor}
            />
            <Button type="submit" size="sm" className="w-fit" disabled={!isEditor}>
              URLを追加
            </Button>
          </form>

          <form action={addPdfSourceAction} className="grid gap-2 rounded-lg border border-black/20 p-3 dark:border-white/10">
            <input type="hidden" name="redirect_to" value={redirectTo} />
            <input type="hidden" name="bot_id" value={bot.id} />
            <Label htmlFor={`pdf_source_${bot.id}`}>PDFソース追加</Label>
            <Input
              id={`pdf_source_${bot.id}`}
              name="pdf"
              type="file"
              accept="application/pdf,.pdf"
              required
              disabled={!isEditor}
            />
            <p className="text-[11px] text-muted-foreground">1ファイル20MBまで</p>
            <Button type="submit" size="sm" className="w-fit" disabled={!isEditor}>
              PDFを追加
            </Button>
          </form>
        </div>

        <div className="grid gap-2">
          {botSources.length === 0 ? (
            <p className="text-xs text-muted-foreground">このBotに登録された情報ソースはありません。</p>
          ) : (
            botSources.map((source) => (
              <div
                key={source.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/20 p-2 text-xs dark:border-white/10"
              >
                <div className="grid gap-0.5">
                  <p className="font-medium">{source.url ?? source.file_name ?? "-"}</p>
                  <p className="text-muted-foreground">
                    {source.type} / {source.status} / {formatMbFromBytes(source.file_size_bytes)}
                  </p>
                </div>
                <form action={queueIndexAction}>
                  <input type="hidden" name="redirect_to" value={redirectTo} />
                  <input type="hidden" name="source_id" value={source.id} />
                  <input type="hidden" name="bot_id" value={bot.id} />
                  <Button type="submit" size="sm" variant="outline" disabled={!isEditor}>
                    インデックス実行
                  </Button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      {showRotateConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-lg border border-black/20 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="text-sm font-semibold">Widgetトークンを再発行しますか？</p>
            <p className="mt-2 text-xs text-muted-foreground">
              既存トークンは失効します。運用中の埋め込みサイトは、新しいトークンへの差し替えが必要です。
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
                onClick={() => {
                  rotateFormRef.current?.requestSubmit()
                  setShowRotateConfirm(false)
                }}
              >
                再発行する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
