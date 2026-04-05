"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
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
  const shouldReduceMotion = useReducedMotion()
  const ref = React.useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "end 0.15"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 0 : 28, shouldReduceMotion ? 0 : -10])
  const orbY = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 0 : 36, shouldReduceMotion ? 0 : -18])

  return (
    <motion.section
      ref={ref}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 28, filter: "blur(14px)" }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      style={shouldReduceMotion ? undefined : { y }}
      className="-mx-4 relative overflow-hidden border-y border-black/20 bg-white/85 px-4 py-5 dark:border-white/10 dark:bg-slate-900/75 sm:mx-0 sm:rounded-3xl sm:border sm:p-8"
    >
      <motion.div
        aria-hidden="true"
        style={shouldReduceMotion ? undefined : { y: orbY }}
        className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/20"
      />
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
          Core Features
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          導入しやすく、続けやすい
          <span className="block font-mono text-cyan-700 dark:text-cyan-300">実運用向けAIボット機能</span>
        </h2>
        <p className="max-w-3xl text-zinc-600 dark:text-zinc-300">
          Web問い合わせ対応とマニュアル案内を主目的に、公開導線と運用導線をセットで設計しています。
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 sm:mt-6">
        {previewItems.map((item, index) => (
          <motion.article
            key={item.title}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 22, scale: 0.98, filter: "blur(10px)" }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.08 * index }}
            whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            className="rounded-2xl border border-black/20 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-950/45"
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="size-5 shrink-0 text-cyan-700 dark:text-cyan-300" />
              <h3 className="text-base font-semibold">{item.title}</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.copy}</p>
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
    </motion.section>
  )
}

export { FeaturesPreview }
