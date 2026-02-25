"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

import { pricingComparisonRows, pricingPlans } from "@/content/pricing"
import { Button } from "@/components/ui/button"

function PricingShowcase() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan, index) => {
          const isRecommended = plan.code === "standard"
          return (
            <motion.article
              key={plan.code}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: 0.08 * index }}
              className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 ${
                isRecommended
                  ? "border-cyan-300/70 bg-[linear-gradient(165deg,#f5feff_0%,#ffffff_55%,#f6fffb_100%)] shadow-[0_18px_45px_-32px_rgba(8,145,178,.55)] dark:border-cyan-500/40 dark:bg-[linear-gradient(165deg,#072126_0%,#0b1d2a_55%,#0c251f_100%)]"
                  : "border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75"
              }`}
            >
              {isRecommended ? (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-600/90 px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="size-3.5" />
                  推奨プラン
                </div>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-300">
                {plan.name}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{plan.priceLabel}</p>
              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.tagline}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{plan.target}</p>

              <div className="mt-5 grid gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <p>Bot上限: {plan.botLimitLabel}</p>
                <p>月間メッセージ: {plan.monthlyMessagesLabel}</p>
                <p>データ量: {plan.storageLabel}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  Widget {plan.channels.widget ? "可" : "不可"}
                </span>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  Hosted {plan.channels.hostedPage ? "可" : "不可"}
                </span>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  API {plan.channels.api ? "可" : "不可"}
                </span>
              </div>

              <Button asChild className="mt-6 w-full rounded-full">
                <Link href="/contact">このプランで相談する</Link>
              </Button>
            </motion.article>
          )
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-black/10 bg-white/85 dark:border-white/10 dark:bg-slate-900/70">
        <div className="border-b border-black/10 px-5 py-4 dark:border-white/10 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">プラン詳細比較</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            「埋め込み公開のしやすさ」と「運用上限」を中心に、実運用で必要な項目を比較できます。
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-zinc-100/80 dark:bg-slate-800/70">
              <tr>
                <th className="px-4 py-3 text-left font-semibold sm:px-6">項目</th>
                <th className="px-4 py-3 text-left font-semibold">Lite</th>
                <th className="px-4 py-3 text-left font-semibold">Standard</th>
                <th className="px-4 py-3 text-left font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {pricingComparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-4 py-3 font-medium sm:px-6">{row.label}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{row.values.lite}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{row.values.standard}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{row.values.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white/85 p-6 dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-xl font-semibold tracking-tight">導入の進め方</h3>
          <ol className="mt-3 grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            <li>1. Liteで問い合わせ対応またはマニュアル案内の1用途を公開</li>
            <li>2. 運用が安定したらStandardで公開チャネルと上限を拡張</li>
            <li>3. 複数部門展開やAPI連携が必要ならProへ移行</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/use-cases">活用例を見る</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/contact">見積もり相談</Link>
            </Button>
          </div>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white/85 p-6 dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-xl font-semibold tracking-tight">ご利用ポリシー</h3>
          <div className="mt-3 grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            <p>お支払いに問題が発生した場合でも、管理画面から設定確認・見直しは継続して行えます。</p>
            <p>登録済みデータは保持されるため、再開時は既存構成を活かしてスムーズに運用を戻せます。</p>
            <p>公開設定（埋め込み許可ドメイン、API利用範囲など）は、運用状況に合わせて調整できます。</p>
          </div>
        </article>
      </section>
    </div>
  )
}

export { PricingShowcase }
