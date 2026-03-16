"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

type Row = {
  id: string
  created_at: string
  action: string
  target_type: string
  target_id: string | null
  actor_user_id: string | null
  after_json: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

// アクションが増えたら actions.ts の writeAuditLog と合わせてここにも追加するように！！！
const ACTION_LABELS: Record<string, string> = {
  // Bot
  "bot.create":                        "Bot作成",
  "bot.public.toggle":                 "Bot公開設定変更",
  "bot.identity.update":               "Bot情報更新",
  "bot.hosted_config.update":          "Hosted設定更新",
  // ソース
  "source.url.add":                    "URLソース追加",
  "source.pdf.add":                    "PDFソース追加",
  // ナレッジ読み込み
  "indexing.queue":                    "ナレッジ読み込み登録",
  // Widget
  "widget.token.rotate":               "Widgetトークン再発行",
  "widget.allowed_origins.update":     "Widget許可オリジン更新",
  // APIキー
  "api_key.create":                    "APIキー発行",
  "api_key.revoke":                    "APIキー失効",
  // テナント
  "tenant.create":                     "テナント作成",
  "tenant.profile.update":             "テナント情報更新",
  "tenant.ai_settings.update":         "AI設定更新",
  "tenant.member.invite.create":       "メンバー招待",
  "tenant.member.invite.revoke":       "招待取り消し",
  // アカウント認証
  "auth.email.update.requested":       "メールアドレス変更申請",
  "auth.password.updated":             "パスワード変更",
  // 監査
  "audit.test.write":                  "監査ログテスト",
  // プラットフォーム管理者操作
  "platform.impersonation.start":      "閲覧モード開始（管理者）",
  "platform.impersonation.stop":       "閲覧モード終了（管理者）",
  "platform.tenant.force_stop.enable":  "テナント強制停止（管理者）",
  "platform.tenant.force_stop.disable": "テナント強制停止解除（管理者）",
  "platform.bot.force_stop.enable":    "Bot強制停止（管理者）",
  "platform.bot.force_stop.disable":   "Bot強制停止解除（管理者）",
}

const ACTION_COLORS: Record<string, string> = {
  "bot":       "border-cyan-300/70 bg-cyan-50 text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-950/40 dark:text-cyan-300",
  "api_key":   "border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-300",
  "source":    "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  "widget":    "border-violet-300/70 bg-violet-50 text-violet-700 dark:border-violet-700/40 dark:bg-violet-950/40 dark:text-violet-300",
  "indexing":  "border-teal-300/70 bg-teal-50 text-teal-700 dark:border-teal-700/40 dark:bg-teal-950/40 dark:text-teal-300",
  "tenant":    "border-indigo-300/70 bg-indigo-50 text-indigo-700 dark:border-indigo-700/40 dark:bg-indigo-950/40 dark:text-indigo-300",
  "auth":      "border-orange-300/70 bg-orange-50 text-orange-700 dark:border-orange-700/40 dark:bg-orange-950/40 dark:text-orange-300",
  "platform":  "border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-300",
  "audit":     "border-slate-300/70 bg-slate-100 text-slate-600 dark:border-slate-600/40 dark:bg-slate-800/50 dark:text-slate-400",
}

function actionColor(action: string) {
  const prefix = action.split(".")[0]
  return ACTION_COLORS[prefix] ?? ACTION_COLORS["audit"]
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("ja-JP")
}

const PREVIEW_LEN = 80

export function AuditLogList({ rows }: { rows: Row[] }) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        条件に一致する監査イベントはありません。
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/15 dark:border-white/10">
      {/* ヘッダー */}
      <div className="hidden grid-cols-[1fr_auto] items-center border-b border-black/10 bg-slate-50/90 px-4 py-2 dark:border-white/8 dark:bg-slate-800/50 sm:grid">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          アクション / 対象 / 操作者
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          日時
        </p>
      </div>

      {/* ログ一覧 */}
      <div className="divide-y divide-black/8 dark:divide-white/8">
        {rows.map((row) => {
          const detail = row.after_json ?? row.metadata ?? {}
          const detailStr = JSON.stringify(detail)
          const isEmpty = detailStr === "{}"
          const preview =
            detailStr.length > PREVIEW_LEN
              ? detailStr.slice(0, PREVIEW_LEN) + "…"
              : detailStr
          const hasMore = detailStr.length > PREVIEW_LEN
          const isOpen = expanded.has(row.id)
          const colorCls = actionColor(row.action)
          const label = ACTION_LABELS[row.action]

          return (
            <div
              key={row.id}
              className="group px-4 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
            >
              {/* 上段: 日本語ラベル + 技術バッジ + 対象 + 操作者 + 日時 */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                {/* 日本語イベント名（メイン） */}
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {label ?? row.action}
                </span>

                {/* 技術アクション名（サブ） */}
                <span
                  className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${colorCls}`}
                >
                  {row.action}
                </span>

                {/* 対象 */}
                {row.target_type ? (
                  <span className="text-[12px] text-slate-400 dark:text-slate-500">
                    {row.target_type}
                    {row.target_id
                      ? ` · ${row.target_id.length > 10 ? row.target_id.slice(0, 10) + "…" : row.target_id}`
                      : ""}
                  </span>
                ) : null}

                <span className="flex-1" />

                {/* 操作者 */}
                <span className="max-w-45 truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {row.actor_user_id ?? "—"}
                </span>

                {/* 日時 */}
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {fmtDate(row.created_at)}
                </span>
              </div>

              {/* 下段: 詳細トグル */}
              {!isEmpty && (
                <div className="mt-2 pl-0.5">
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="group/btn flex items-start gap-1.5 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="mt-0.5 size-3 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="mt-0.5 size-3 shrink-0 text-slate-400" />
                    )}
                    {isOpen ? (
                      <span className="text-[11px] text-slate-400 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-300">
                        閉じる
                      </span>
                    ) : (
                      <code className="break-all font-mono text-[11px] text-slate-400 transition-colors group-hover/btn:text-slate-600 dark:text-slate-500 dark:group-hover/btn:text-slate-300">
                        {hasMore ? preview : detailStr}
                      </code>
                    )}
                  </button>

                  {isOpen && (
                    <pre className="mt-2 overflow-x-auto rounded-lg border border-black/10 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 dark:border-white/8 dark:bg-slate-900/60 dark:text-slate-300">
                      {JSON.stringify(detail, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
