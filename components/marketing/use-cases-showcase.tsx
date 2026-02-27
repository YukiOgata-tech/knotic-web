"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BadgeHelp,
  BookText,
  GraduationCap,
  Scale,
  TrendingUp,
} from "lucide-react"

import { anonymizedUseCaseStories } from "@/content/use-cases"
import { Button } from "@/components/ui/button"

const primaryCases = [
  {
    icon: BadgeHelp,
    title: "Web問い合わせ対応ボット",
    lead: "最初に立ち上げる用途として最適",
    copy: "公開サイトのFAQや案内ページを取り込み、問い合わせ前の自己解決率を高める導線を作れます。",
  },
  {
    icon: BookText,
    title: "マニュアル案内ボット",
    lead: "資料案内の工数を削減",
    copy: "PDFマニュアルや手順書を取り込み、必要な章や記述にすばやくアクセスできる案内導線を提供できます。",
  },
]

const extendedCases = [
  {
    icon: GraduationCap,
    title: "社内教育ボット",
    copy: "オンボーディング資料や手順書をもとに、社内教育の質問対応を標準化できます。",
  },
  {
    icon: Scale,
    title: "規約監査の一次チェック支援",
    copy: "規約・ガイドラインを参照し、確認観点の洗い出しを支援する用途にも展開できます。",
  },
]

function UseCasesShowcase() {
  return (
    <div className="grid gap-6 sm:gap-8">
      <div className="-mx-4 sticky top-16 z-20 border-y border-black/10 bg-white/90 px-4 py-2 backdrop-blur sm:hidden dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <a href="#primary-cases" className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs dark:border-white/10">
            主用途
          </a>
          <a href="#extended-cases" className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs dark:border-white/10">
            拡張用途
          </a>
          <a href="#checklist" className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs dark:border-white/10">
            導入準備
          </a>
          <a href="#case-studies" className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs dark:border-white/10">
            導入事例
          </a>
        </div>
      </div>

      <section
        id="primary-cases"
        className="-mx-4 border-y border-black/10 bg-white/90 px-4 py-6 sm:mx-0 sm:rounded-3xl sm:border sm:bg-white/85 sm:p-8 dark:border-white/10 dark:bg-slate-900/75"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
          Primary Use Cases
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          まずは成果が出やすい2用途から
        </h2>
        <p className="mt-3 text-base leading-8 text-zinc-600 dark:text-zinc-300">
          主目的は「Web埋め込みまたは共有URLですぐ公開し、問い合わせ対応やマニュアル案内を改善すること」です。
        </p>

        <div className="mt-5 -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0">
          {primaryCases.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              className="min-w-[88%] snap-start rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-950/45 sm:p-5 lg:min-w-0"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                  <item.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold leading-7 sm:text-xl">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 sm:text-base">{item.lead}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base sm:leading-8">
                {item.copy}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section
        id="extended-cases"
        className="-mx-4 border-y border-black/10 bg-white/85 px-4 py-6 sm:mx-0 sm:rounded-3xl sm:border sm:p-8 dark:border-white/10 dark:bg-slate-900/65"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
          Extended Use Cases
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          運用が安定したら、社内用途へ拡張
        </h3>
        <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2">
          {extendedCases.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.28, delay: 0.05 * index }}
              className="rounded-2xl border border-black/10 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-950/45 sm:p-5"
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="size-5 text-emerald-700 dark:text-emerald-300" />
                <p className="text-base font-semibold sm:text-lg">{item.title}</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base sm:leading-8">
                {item.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="checklist"
        className="-mx-4 border-y border-black/10 bg-white/80 px-4 py-6 sm:mx-0 sm:rounded-2xl sm:border sm:p-8 dark:border-white/10 dark:bg-slate-900/70"
      >
        <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">導入準備チェック</h3>
        <ul className="mt-4 grid gap-2.5 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:gap-3 sm:text-base sm:leading-8">
          <li>1. まずは問い合わせ対応かマニュアル案内のどちらか1用途に絞る</li>
          <li>2. 回答根拠に使うURL/PDFを先に整理する</li>
          <li>3. 公開方法を「Web埋め込み」か「共有URL」で決める</li>
        </ul>
        <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/features">機能に戻る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact" className="inline-flex items-center gap-2">
              導入相談
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section
        id="case-studies"
        className="-mx-4 border-y border-black/10 bg-white/90 px-4 py-6 sm:mx-0 sm:rounded-3xl sm:border sm:bg-white/85 sm:p-8 dark:border-white/10 dark:bg-slate-900/70"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
          Case Studies
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          匿名企業の導入事例（想定）
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base sm:leading-8">
          実運用パターンをもとに、導入時の流れと効果を分かりやすく整理したモデルケースです。
        </p>

        <div className="mt-5 grid gap-4 sm:gap-5">
          {anonymizedUseCaseStories.map((story, index) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: 0.05 * index }}
              className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-950/45 sm:p-6"
            >
              <div className="border-b border-black/10 pb-3 dark:border-white/10">
                <p className="text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-100 sm:text-xl sm:leading-8">
                  {story.companyLabel}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:text-sm">
                    {story.industry}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:text-sm">
                    {story.employeeScale}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:text-base">
                  目的: {story.primaryGoal}
                </p>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-slate-900/70 sm:p-4">
                    <p className="text-xs font-semibold tracking-[0.1em] text-zinc-500 dark:text-zinc-400 sm:text-sm">
                      導入前の課題
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-200 sm:text-base sm:leading-8">
                      {story.before}
                    </p>
                  </div>

                  <div className="rounded-xl border border-black/10 p-3.5 dark:border-white/10 sm:p-4">
                    <p className="text-xs font-semibold tracking-[0.1em] text-zinc-500 dark:text-zinc-400 sm:text-sm">
                      実施内容
                    </p>
                    <ul className="mt-2 grid gap-2 text-sm leading-7 text-zinc-700 dark:text-zinc-200 sm:text-base sm:leading-8">
                      {story.rollout.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-cyan-600 dark:bg-cyan-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-500/35 dark:bg-emerald-950/25 sm:p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-emerald-700 dark:text-emerald-300" />
                    <p className="text-xs font-semibold tracking-[0.1em] text-emerald-700 dark:text-emerald-300 sm:text-sm">
                      結果・効果
                    </p>
                  </div>
                  <ul className="mt-2 grid gap-2 text-sm leading-7 text-emerald-800 dark:text-emerald-200 sm:text-base sm:leading-8">
                    {story.results.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}

export { UseCasesShowcase }
