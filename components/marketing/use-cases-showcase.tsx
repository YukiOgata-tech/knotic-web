"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BadgeHelp, BookText, GraduationCap, Scale } from "lucide-react"

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
    <div className="grid gap-8">
      <section className="rounded-3xl border border-black/10 bg-white/85 p-6 dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
          Primary Use Cases
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          まずは成果が出やすい2用途から
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          主目的は「Web埋め込みまたは共有URLですぐ公開し、問い合わせ対応やマニュアル案内を改善すること」です。
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {primaryCases.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.35, delay: 0.08 * index }}
              className="rounded-2xl border border-black/10 bg-white/85 p-5 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                  <item.icon className="size-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.lead}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/65 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          Extended Use Cases
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          運用が安定したら、社内用途へ拡張
        </h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {extendedCases.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.32, delay: 0.06 * index }}
              className="rounded-2xl border border-black/10 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="size-5 text-emerald-700 dark:text-emerald-300" />
                <p className="text-base font-semibold">{item.title}</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h3 className="text-2xl font-semibold tracking-tight">導入準備チェック</h3>
        <ul className="mt-4 grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <li>1. まずは問い合わせ対応かマニュアル案内のどちらか1用途に絞る</li>
          <li>2. 回答根拠に使うURL/PDFを先に整理する</li>
          <li>3. 公開方法を「Web埋め込み」か「共有URL」で決める</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
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

      <section className="rounded-3xl border border-black/10 bg-white/85 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
          Case Studies
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          匿名企業の導入事例（想定）
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          以下は、実際の運用パターンをもとに整理したモデルケースです。社名は非公開で、数値は導入時の目安として掲載しています。
        </p>

        <div className="mt-6 grid gap-4">
          {anonymizedUseCaseStories.map((story, index) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.34, delay: 0.06 * index }}
              className="rounded-2xl border border-black/10 bg-white/90 p-5 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{story.companyLabel}</p>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {story.industry}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {story.employeeScale}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                目的: {story.primaryGoal}
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{story.before}</p>

              <div className="mt-4 grid gap-1 text-sm leading-7 text-zinc-700 dark:text-zinc-200">
                <p className="font-semibold">実施内容</p>
                {story.rollout.map((item) => (
                  <p key={item}>・{item}</p>
                ))}
              </div>

              <div className="mt-4 grid gap-1 text-sm leading-7 text-emerald-700 dark:text-emerald-300">
                <p className="font-semibold">結果・効果</p>
                {story.results.map((item) => (
                  <p key={item}>・{item}</p>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}

export { UseCasesShowcase }
