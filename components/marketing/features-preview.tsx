"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, FileSearch, MessagesSquare, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

const previewItems = [
  {
    icon: FileSearch,
    title: "URL/PDF登録ですぐに回答基盤化",
    copy: "問い合わせ回答やマニュアル案内に使う情報を、短時間でボットに反映できます。",
  },
  {
    icon: MessagesSquare,
    title: "Web埋め込みと共有URL公開に対応",
    copy: "既存サイトへの設置と、専用URLでの公開を用途に応じて使い分けられます。",
  },
  {
    icon: ShieldCheck,
    title: "運用しながら品質を改善",
    copy: "再インデックスや利用状況確認を通じて、回答の精度と運用安定性を高められます。",
  },
]

function FeaturesPreview() {
  return (
    <section className="-mx-4 relative overflow-hidden border-y border-black/40 bg-emerald-200/20 px-4 py-5 dark:border-white/40 dark:bg-slate-900/75 sm:mx-0 sm:rounded-3xl sm:border sm:p-8">
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/20" />
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
          Core Features
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          導入しやすく、続けやすい
          <span className="block font-mono text-cyan-700 dark:text-cyan-300">実運用向けAIボット機能</span>
        </h2>
        <p className="max-w-3xl text-zinc-800 dark:text-zinc-200">
          Web問い合わせ対応とマニュアル案内を主目的に、公開導線と運用導線をセットで設計しています。
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 sm:mt-6">
        {previewItems.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.32, delay: 0.06 * index }}
            className="rounded-2xl border border-black/40 bg-gray-300/35 p-4 dark:border-white/40 dark:bg-slate-950/45"
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="size-5 shrink-0 text-cyan-700 dark:text-cyan-200" />
              <h3 className="text-base font-semibold">{item.title}</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{item.copy}</p>
          </motion.article>
        ))}
      </div>

      <div className="mt-5">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/features" className="inline-flex items-center gap-2">
            機能の詳細を見る
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

export { FeaturesPreview }
