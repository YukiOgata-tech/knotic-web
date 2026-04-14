"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, CircleX, Loader2, Sparkles, Tag } from "lucide-react"

import { pricingComparisonRows, pricingPlans } from "@/content/pricing"
import { PlanCtaButton } from "@/components/marketing/plan-cta-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const iconRows = new Set([
  "Widget埋め込み",
  "Hosted Page公開",
  "API利用",
  "モデル選択",
])

function BoolIcon({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">
        <Check className="size-4" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-zinc-200 p-1.5 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
      <CircleX className="size-4" />
    </span>
  )
}

function renderCell(label: string, value: string) {
  if (!iconRows.has(label)) return <span>{value}</span>
  if (value === "可") return <BoolIcon enabled />
  if (value === "不可") return <BoolIcon enabled={false} />
  return <span>{value}</span>
}

function ChannelPill({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {enabled ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-300" />
      ) : (
        <CircleX className="size-3.5 text-zinc-500 dark:text-zinc-300" />
      )}
      {label}
    </span>
  )
}

type PromoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "valid"; trialDays: number; message: string }
  | { status: "invalid"; message: string }

function PricingShowcase() {
  const [promoInput, setPromoInput] = React.useState("")
  const [promoState, setPromoState] = React.useState<PromoState>({ status: "idle" })
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function handlePromoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setPromoInput(value)

    if (timerRef.current) clearTimeout(timerRef.current)

    if (!value.trim()) {
      setPromoState({ status: "idle" })
      return
    }

    setPromoState({ status: "loading" })
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stripe/validate-promo?code=${encodeURIComponent(value.trim())}`)
        const data = await res.json() as { valid: boolean; trialDays?: number; message?: string }
        if (data.valid && data.trialDays) {
          setPromoState({ status: "valid", trialDays: data.trialDays, message: data.message ?? "" })
        } else {
          setPromoState({ status: "invalid", message: data.message ?? "無効なコードです。" })
        }
      } catch {
        setPromoState({ status: "invalid", message: "コードの確認に失敗しました。" })
      }
    }, 400)
  }

  const appliedPromoCode = promoState.status === "valid" ? promoInput.trim().toUpperCase() : ""

  return (
    <div className="grid gap-5 sm:gap-8">
      {/* ── 招待コード入力欄 ── */}
      <div className="-mx-4 border-y border-black/20 bg-white/90 px-4 py-4 sm:mx-0 sm:rounded-2xl sm:border sm:px-6 sm:py-5 dark:border-white/10 dark:bg-slate-900/70">
        <div className="flex items-center gap-2">
          <Tag className="size-4 text-cyan-600 dark:text-cyan-400" />
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">招待コードをお持ちの方</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          イベント等でお受け取りのコードを入力すると、無料トライアルが適用されます。
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={promoInput}
            onChange={handlePromoChange}
            placeholder="例: NIIGATA2026"
            className="max-w-xs uppercase placeholder:normal-case"
            aria-label="招待コード"
            maxLength={64}
          />
          {promoState.status === "loading" ? (
            <Loader2 className="size-4 animate-spin text-zinc-400" />
          ) : null}
        </div>
        {promoState.status === "valid" ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            {promoState.message}
          </p>
        ) : null}
        {promoState.status === "invalid" ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <CircleX className="size-4" />
            {promoState.message}
          </p>
        ) : null}
      </div>

      <section
        id="plans"
        className="-mx-4 border-y border-black/20 bg-white/90 px-4 py-5 sm:mx-0 sm:rounded-3xl sm:border sm:p-6 dark:border-white/10 dark:bg-slate-900/70"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
          Plans
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">4プランの料金と対応範囲</h2>
        <p className="mt-2 text-[13px] leading-6 text-zinc-600 dark:text-zinc-300 sm:mt-3 sm:text-base sm:leading-8">
          サイト設置から始め、利用増加・公開規模に合わせて段階的に拡張できます。
        </p>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan, index) => {
            const recommended = plan.code === "standard"
            return (
              <motion.article
                key={plan.code}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.28, delay: 0.05 * index }}
                className={`relative rounded-2xl border p-4 sm:p-5 ${
                  recommended
                    ? "border-cyan-300/70 bg-[linear-gradient(165deg,#f5feff_0%,#ffffff_55%,#f6fffb_100%)] shadow-[0_16px_34px_-30px_rgba(8,145,178,.55)] dark:border-cyan-500/40 dark:bg-[linear-gradient(165deg,#072126_0%,#0b1d2a_55%,#0c251f_100%)]"
                    : "border-black/20 bg-white dark:border-white/10 dark:bg-slate-950/45"
                }`}
              >
                {recommended ? (
                  <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-cyan-600/90 px-3 py-1 text-xs font-semibold text-white sm:right-5 sm:top-5">
                    <Sparkles className="size-3.5" />
                    推奨プラン
                  </div>
                ) : null}
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-300 ${
                    recommended ? "pr-24 sm:pr-28" : ""
                  }`}
                >
                  {plan.name}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{plan.priceLabel}</p>
                <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100 sm:text-base">{plan.tagline}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base sm:leading-8">
                  {plan.target}
                </p>

                <div className="mt-4 grid gap-1.5 text-sm text-zinc-700 dark:text-zinc-200 sm:text-base">
                  <p>Bot上限: {plan.botLimitLabel}</p>
                  <p>月間メッセージ: {plan.monthlyMessagesLabel}</p>
                  <p>データ量: {plan.storageLabel}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ChannelPill label="Widget" enabled={plan.channels.widget} />
                  <ChannelPill label="Hosted" enabled={plan.channels.hostedPage} />
                  <ChannelPill label="API" enabled={plan.channels.api} />
                </div>

                {plan.code === "pro" ? (
                  <Button asChild variant="outline" className="mt-5 w-full rounded-full">
                    <Link href="/contact">お問合せする</Link>
                  </Button>
                ) : (
                  <PlanCtaButton
                    planCode={plan.code}
                    planName={plan.name}
                    promoCode={appliedPromoCode}
                    className="mt-5 w-full rounded-full"
                  />
                )}
              </motion.article>
            )
          })}
        </div>
      </section>

      <section
        id="comparison"
        className="-mx-4 overflow-hidden border-y border-black/20 bg-white/85 px-4 py-6 sm:mx-0 sm:rounded-3xl sm:border sm:p-6 dark:border-white/10 dark:bg-slate-900/70"
      >
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">プラン詳細比較</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base sm:leading-8">
          公開方法と運用上限を中心に、実運用で必要な項目を比較
        </p>

        <div className="mt-4 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-black/20 [-webkit-overflow-scrolling:touch] dark:border-white/10">
          <table className="w-180 text-xs sm:w-full sm:min-w-220 sm:text-sm">
            <colgroup>
              <col className="w-[22%] sm:w-[22%]" />
              <col className="w-[19.5%] sm:w-[19.5%]" />
              <col className="w-[19.5%] sm:w-[19.5%]" />
              <col className="w-[19.5%] sm:w-[19.5%]" />
              <col className="w-[19.5%] sm:w-[19.5%]" />
            </colgroup>
            <thead className="bg-zinc-100/90 dark:bg-slate-800/80">
              <tr>
                <th className="bg-zinc-100/95 px-3 py-3 font-semibold whitespace-nowrap sm:px-4 dark:bg-slate-800/95 text-center">
                  項目
                </th>
                <th className="px-2 py-3 text-center font-semibold whitespace-nowrap sm:px-3">Starter</th>
                <th className="px-2 py-3 text-center font-semibold whitespace-nowrap sm:px-3">Lite</th>
                <th className="px-2 py-3 text-center font-semibold whitespace-nowrap sm:px-3">Standard</th>
                <th className="px-2 py-3 text-center font-semibold whitespace-nowrap sm:px-3">Pro</th>
              </tr>
            </thead>
            <tbody>
              {pricingComparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-black/20 dark:border-white/10">
                  <td className="bg-white px-3 py-3 font-medium text-zinc-800 sm:px-4 dark:bg-slate-900 dark:text-zinc-100">
                    {row.label}
                  </td>
                  <td className="px-2 py-3 text-zinc-700 whitespace-nowrap sm:px-3 dark:text-zinc-200">
                    <span className="inline-flex items-center gap-2">{renderCell(row.label, row.values.starter)}</span>
                  </td>
                  <td className="px-2 py-3 text-zinc-700 whitespace-nowrap sm:px-3 dark:text-zinc-200">
                    <span className="inline-flex items-center gap-2">{renderCell(row.label, row.values.lite)}</span>
                  </td>
                  <td className="px-2 py-3 text-zinc-700 whitespace-nowrap sm:px-3 dark:text-zinc-200">
                    <span className="inline-flex items-center gap-2">{renderCell(row.label, row.values.standard)}</span>
                  </td>
                  <td className="px-2 py-3 text-zinc-700 whitespace-nowrap sm:px-3 dark:text-zinc-200">
                    <span className="inline-flex items-center gap-2">{renderCell(row.label, row.values.pro)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="-mx-4 grid gap-3 border-y border-black/20 bg-white/85 px-4 py-5 sm:mx-0 sm:gap-4 sm:rounded-2xl sm:border sm:p-6 dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-2">
        <article className="border-b border-black/15 pb-4 last:border-b-0 lg:border-b-0 lg:pb-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/85 sm:p-6 dark:border-white/10 sm:dark:bg-slate-950/35">
          <h3 className="text-lg font-semibold tracking-tight sm:text-2xl">導入の進め方</h3>
          <ol className="mt-2 grid gap-2 text-[13px] leading-6 text-zinc-800 dark:text-zinc-100 sm:mt-3 sm:gap-2.5 sm:text-base sm:leading-8">
            <li>1. Starterで既存サイトへのWidget設置から始める</li>
            <li>2. 利用が増えてきたらLiteへ（メッセージ3倍以上）</li>
            <li>3. Hosted URLやAPI連携が必要になったらStandardへ</li>
            <li>4. 複数部門展開・大規模運用はProへ移行</li>
          </ol>
          <div className="mt-4 gap-3 flex sm:flex-wrap">
            <Button asChild variant="outline" className="rounded-full border-black/40 dark:border-white/40 hover:shadow-xl">
              <Link href="/use-cases">活用例を見る</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-black/40 dark:border-white/40 hover:shadow-xl">
              <Link href="/contact">見積もり相談</Link>
            </Button>
          </div>
        </article>

        <article className="sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/85 sm:p-6 sm:dark:border-white/10 sm:dark:bg-slate-950/35">
          <h3 className="text-lg font-semibold tracking-tight sm:text-2xl">ご利用ポリシー</h3>
          <div className="mt-2 grid gap-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-300 sm:mt-3 sm:gap-2.5 sm:text-base sm:leading-8">
            <p>- お支払いに問題が発生した場合でも、管理画面から設定確認・見直しは継続して行えます。</p>
            <p>- 登録済みデータは保持されるため、再開時は既存構成を活かしてスムーズに運用を戻せます。</p>
            <p>- 公開設定(埋め込み許可ドメイン、API利用範囲など)は、運用状況に合わせて調整できます。</p>
          </div>
        </article>
      </section>
    </div>
  )
}

export { PricingShowcase }
