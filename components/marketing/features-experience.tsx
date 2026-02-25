"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Blocks,
  Bot,
  ChartNoAxesCombined,
  FileText,
  Globe,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const pillars = [
  {
    icon: Globe,
    title: "すぐに公開できる導入速度",
    copy: "URL/PDFを登録し、共有URLまたはWeb埋め込みで短い準備時間で公開できます。",
  },
  {
    icon: Bot,
    title: "問い合わせ/マニュアル用途に最適化",
    copy: "よくある質問対応と資料案内を中心に、回答スタイルを業務に合わせて調整できます。",
  },
  {
    icon: ShieldCheck,
    title: "低コストで始めて拡張できる",
    copy: "小さく導入し、運用実績に応じて公開チャネルや連携方法を段階的に広げられます。",
  },
]

const flow = [
  {
    title: "Collect",
    headline: "情報を集める",
    copy: "URL / PDFを登録し、対象領域のナレッジをまとめます。",
    icon: FileText,
  },
  {
    title: "Index",
    headline: "検索可能にする",
    copy: "抽出・分割・埋め込みまでを処理し、質問に使える状態へ整えます。",
    icon: Blocks,
  },
  {
    title: "Answer",
    headline: "根拠付きで回答",
    copy: "関連情報を参照しながら応答を生成し、出典を返せる設計です。",
    icon: Sparkles,
  },
  {
    title: "Operate",
    headline: "継続改善する",
    copy: "公開後もソース更新や再インデックスで品質を維持できます。",
    icon: ChartNoAxesCombined,
  },
]

const highlights = [
  {
    title: "埋め込みと公開URLを主軸に設計",
    copy: "最初の導入障壁を下げるため、Web導入しやすい公開方式を優先しています。",
  },
  {
    title: "主用途は問い合わせとマニュアル案内",
    copy: "まずは成果が見えやすい用途に集中し、運用改善を回しやすくしています。",
  },
  {
    title: "拡張用途にも展開可能",
    copy: "社内教育ボットや規約監査の一次チェック支援にも応用できます。",
  },
]

function FeaturesExperience() {
  return (
    <div className="grid gap-8">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white/85 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/75">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/20" />
        <div className="pointer-events-none absolute -bottom-16 -left-14 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-300/15" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
          className="relative"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            Feature Story
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            <span className="block">使い始めやすさを最優先にしつつ、</span>
            <span className="block">
              <span className="bg-gradient-to-r from-cyan-700 to-emerald-600 bg-clip-text font-mono tracking-tight text-transparent dark:from-cyan-300 dark:to-emerald-300">
                運用で育てるAIボット
              </span>
              <span> を主目的に設計。</span>
            </span>
          </h2>
          <p className="mt-4 max-w-3xl text-[1.02rem] leading-8 text-zinc-600 dark:text-zinc-300">
            knoticは、Web埋め込みと共有URL公開を中心に、問い合わせ対応とマニュアル案内を早く立ち上げることを重視しています。さらに、社内教育や規約監査の一次チェック支援まで展開できるように構成しています。
          </p>
        </motion.div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.35, delay: 0.08 * index }}
              className="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/45"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, delay: 0.06 * index }}
            className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-[0_12px_35px_-30px_rgba(15,23,42,.6)] dark:border-white/10 dark:bg-slate-900/75"
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                <item.icon className="size-5" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.copy}</p>
          </motion.article>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white/85 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Workflow
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">仕組みが分かる4ステップ</h3>
          </div>
          <ArrowRight className="hidden size-6 text-zinc-400 sm:block" />
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {flow.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.36, delay: 0.08 * index }}
              className="relative rounded-2xl border border-black/10 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  {item.title}
                </span>
                <item.icon className="size-4 text-cyan-600 dark:text-cyan-300" />
              </div>
              <p className="mt-2 text-base font-semibold">{item.headline}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h3 className="text-2xl font-semibold tracking-tight">次に確認するページ</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          導入判断を進める場合は、料金・活用例・セキュリティの順に確認すると、公開方法と運用体制を整理しやすくなります。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/pricing">料金を見る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/use-cases">活用例を見る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/security">セキュリティを見る</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export { FeaturesExperience }
