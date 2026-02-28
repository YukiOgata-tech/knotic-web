"use client"

import Link from "next/link"
import * as React from "react"
import { ExternalLink, Eye } from "lucide-react"

import { HostedChatClient } from "@/app/chat-by-knotic/[public_id]/hosted-chat-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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

type Props = {
  bot: BotHostedConfig
  isEditor: boolean
  hasHostedPage: boolean
  maxHistoryTurnLimit: number
  saveAction: (formData: FormData) => void | Promise<void>
}

const PURPOSE_OPTIONS = [
  { value: "customer_support", label: "お問い合わせ対応" },
  { value: "lead_gen", label: "資料請求・商談導線" },
  { value: "internal_kb", label: "社内ナレッジ" },
  { value: "onboarding", label: "導入ガイド" },
  { value: "custom", label: "カスタム" },
] as const

const PURPOSE_LABEL: Record<string, string> = {
  customer_support: "お問い合わせ対応",
  lead_gen: "資料請求・商談導線",
  internal_kb: "社内ナレッジ",
  onboarding: "導入ガイド",
  custom: "カスタム",
}

const DEFAULT_HEADER_BG = "#0f172a"
const DEFAULT_HEADER_TEXT = "#f8fafc"
const DEFAULT_FOOTER_BG = "#f8fafc"
const DEFAULT_FOOTER_TEXT = "#0f172a"
const DEFAULT_WIDGET_POLICY =
  "このチャット履歴はブラウザ上で24時間保持され、自動的に削除されます。"
const MODEL_OPTIONS = ["5-nano", "5-mini", "5", "4o-mini", "4o"] as const

export function HostedConfigEditor({
  bot,
  isEditor,
  hasHostedPage,
  maxHistoryTurnLimit,
  saveAction,
}: Props) {
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
  const [aiModel, setAiModel] = React.useState(bot.ai_model ?? "5-mini")
  const [aiFallbackModel, setAiFallbackModel] = React.useState(bot.ai_fallback_model ?? "")
  const [aiMaxOutputTokens, setAiMaxOutputTokens] = React.useState(String(bot.ai_max_output_tokens ?? 1200))

  const effectiveRequireAuth = accessMode === "internal" || requireAuth
  const historyLimit = Number.isFinite(Number(historyTurnLimit))
    ? Math.max(1, Math.min(maxHistoryTurnLimit, Math.floor(Number(historyTurnLimit))))
    : Math.min(8, maxHistoryTurnLimit)

  return (
    <div className="grid gap-4 rounded-lg border border-black/10 p-3 dark:border-white/10 lg:grid-cols-2">
      <form action={saveAction} className="grid gap-3">
        <input type="hidden" name="redirect_to" value="/console/bots" />
        <input type="hidden" name="bot_id" value={bot.id} />

        <div className="grid gap-2 rounded-md border border-black/10 bg-slate-50/70 p-2 text-xs dark:border-white/10 dark:bg-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={bot.is_public ? "default" : "outline"}>{bot.is_public ? "公開中" : "非公開"}</Badge>
            <Badge variant="outline">{accessMode === "internal" ? "社内限定" : "公開利用"}</Badge>
            <Badge variant="outline">{chatPurpose}</Badge>
            <Badge variant={showCitations ? "secondary" : "outline"}>{showCitations ? "引用表示ON" : "引用表示OFF"}</Badge>
            <Badge variant={widgetEnabled ? "secondary" : "outline"}>{widgetEnabled ? "Widget有効" : "Widget無効"}</Badge>
            <Badge variant="outline">{widgetMode}</Badge>
          </div>
          <p className="text-muted-foreground">Hosted URL: /chat-by-knotic/{bot.public_id}</p>
        </div>

        <div>
          <p className="text-sm font-medium">{bot.name}</p>
          <p className="text-xs text-muted-foreground">public_id: {bot.public_id}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`display_name_${bot.id}`}>サービス表示名</Label>
            <Input
              id={`display_name_${bot.id}`}
              name="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名"
              disabled={!isEditor}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`chat_purpose_${bot.id}`}>チャット目的</Label>
            <select
              id={`chat_purpose_${bot.id}`}
              name="chat_purpose"
              className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
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
              className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
              value={accessMode}
              onChange={(e) => setAccessMode(e.target.value)}
              disabled={!isEditor}
            >
              <option value="public">公開（顧客向け）</option>
              <option value="internal">社内限定（認証前提）</option>
            </select>
          </div>
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
            <p className="text-xs text-muted-foreground">現在プランの上限: {maxHistoryTurnLimit}ターン</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10 md:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`ai_model_${bot.id}`}>Botモデル</Label>
            <select
              id={`ai_model_${bot.id}`}
              name="ai_model"
              className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
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
              className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
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

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`header_bg_${bot.id}`}>ヘッダー背景色</Label>
            <div className="flex items-center gap-2">
              <Input id={`header_bg_${bot.id}`} name="ui_header_bg_color" type="color" value={headerBgColor} onChange={(e) => setHeaderBgColor(e.target.value)} disabled={!isEditor} className="h-11 w-20 p-1" />
              <Input value={headerBgColor} onChange={(e) => setHeaderBgColor(e.target.value)} disabled={!isEditor} className="h-11" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`header_text_${bot.id}`}>ヘッダー文字色</Label>
            <div className="flex items-center gap-2">
              <Input id={`header_text_${bot.id}`} name="ui_header_text_color" type="color" value={headerTextColor} onChange={(e) => setHeaderTextColor(e.target.value)} disabled={!isEditor} className="h-11 w-20 p-1" />
              <Input value={headerTextColor} onChange={(e) => setHeaderTextColor(e.target.value)} disabled={!isEditor} className="h-11" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`footer_bg_${bot.id}`}>フッター背景色</Label>
            <div className="flex items-center gap-2">
              <Input id={`footer_bg_${bot.id}`} name="ui_footer_bg_color" type="color" value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} disabled={!isEditor} className="h-11 w-20 p-1" />
              <Input value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} disabled={!isEditor} className="h-11" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`footer_text_${bot.id}`}>フッター文字色</Label>
            <div className="flex items-center gap-2">
              <Input id={`footer_text_${bot.id}`} name="ui_footer_text_color" type="color" value={footerTextColor} onChange={(e) => setFooterTextColor(e.target.value)} disabled={!isEditor} className="h-11 w-20 p-1" />
              <Input value={footerTextColor} onChange={(e) => setFooterTextColor(e.target.value)} disabled={!isEditor} className="h-11" />
            </div>
          </div>
        </div>

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

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="show_citations"
            checked={showCitations}
            onChange={(e) => setShowCitations(e.target.checked)}
            disabled={!isEditor}
          />
          回答時に根拠（引用）を表示する
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="require_auth_for_hosted"
            checked={requireAuth}
            onChange={(e) => setRequireAuth(e.target.checked)}
            disabled={!isEditor}
          />
          Hostedチャットで認証を必須にする
        </label>

        <div className="grid gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
          <h4 className="text-sm font-medium">Widget設定</h4>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="widget_enabled"
              checked={widgetEnabled}
              onChange={(e) => setWidgetEnabled(e.target.checked)}
              disabled={!isEditor}
            />
            Widgetを有効にする
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`widget_mode_${bot.id}`}>起動モード</Label>
              <select
                id={`widget_mode_${bot.id}`}
                name="widget_mode"
                className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
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
                className="h-11 rounded-md border bg-transparent px-3 text-base sm:h-10 sm:text-sm"
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" className="rounded-full" disabled={!isEditor}>
            Hosted/Widget設定を保存
          </Button>
          {hasHostedPage ? (
            <Link
              href={`/chat-by-knotic/${bot.public_id}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
            >
              公開画面を開く
              <ExternalLink className="size-3" />
            </Link>
          ) : null}
        </div>
      </form>

      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="size-4" />
          テストチャット / リアルタイムプレビュー
        </div>
        <p className="text-xs text-muted-foreground">
          左側で編集した内容が保存前でも即時反映されます。ここからそのままチャットテスト可能です。
        </p>

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
      </div>
    </div>
  )
}
