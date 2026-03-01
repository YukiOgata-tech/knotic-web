"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  GraduationCap,
  MessageCircle,
  TrendingUp,
} from "lucide-react"

import { anonymizedUseCaseStories } from "@/content/use-cases"
import { Button } from "@/components/ui/button"

const useCases = [
  {
    icon: MessageCircle,
    tag: "お問い合わせ対応",
    tagClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200",
    iconClass: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    title: "問い合わせ前の自己解決率を上げる",
    before: "FAQページはあるのに、同じ内容の問い合わせが繰り返される",
    solution:
      "サポートサイト・FAQのURLをBotに登録し、Widget埋め込みまたは専用URLで公開。問い合わせ前に自己解決できる導線を作り、サポート工数を削減します。",
  },
  {
    icon: BookOpen,
    tag: "マニュアル・手順書",
    tagClass: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
    iconClass: "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    title: "マニュアルを「探す」から「聞く」へ",
    before: "PDFマニュアルが分散していて、必要な記述を見つけるまでに時間がかかる",
    solution:
      "PDF・Webマニュアルを登録し、質問形式で該当箇所に即アクセス。回答の根拠となったページも提示するため、情報の信頼性も確保されます。",
  },
  {
    icon: Building2,
    tag: "社内ナレッジ共有",
    tagClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    title: "社内の知識を、誰でも引き出せる形に",
    before: "担当者ごとに回答がばらつく。属人化した知識がうまく引き継がれない",
    solution:
      "社内規程・ガイドライン・ナレッジをBotに集約し、社内限定モードで安全に共有。拠点・部門を越えて一貫した情報提供が可能になります。",
  },
  {
    icon: GraduationCap,
    tag: "オンボーディング支援",
    tagClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    iconClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    title: "新人の「聞きにくい」を自己解決に変える",
    before: "新人から同じ質問が繰り返され、先輩が都度対応するコストが高い",
    solution:
      "入社資料・業務手順・ツール説明をBotに登録。新人が自分のペースで調べられる環境を整え、立ち上がり期間と先輩の対応工数を削減できます。",
  },
]

const storyAccents = [
  {
    dotColor: "bg-cyan-500 dark:bg-cyan-400",
    resultBg: "bg-cyan-50/80 dark:bg-cyan-950/25",
    resultBorder: "border-cyan-200/70 dark:border-cyan-500/30",
    resultTitle: "text-cyan-700 dark:text-cyan-300",
    resultText: "text-cyan-900 dark:text-cyan-100",
    goalClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200",
    trendClass: "text-cyan-600 dark:text-cyan-300",
  },
  {
    dotColor: "bg-violet-500 dark:bg-violet-400",
    resultBg: "bg-violet-50/80 dark:bg-violet-950/25",
    resultBorder: "border-violet-200/70 dark:border-violet-500/30",
    resultTitle: "text-violet-700 dark:text-violet-300",
    resultText: "text-violet-900 dark:text-violet-100",
    goalClass: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
    trendClass: "text-violet-600 dark:text-violet-300",
  },
  {
    dotColor: "bg-emerald-500 dark:bg-emerald-400",
    resultBg: "bg-emerald-50/80 dark:bg-emerald-950/25",
    resultBorder: "border-emerald-200/70 dark:border-emerald-500/30",
    resultTitle: "text-emerald-700 dark:text-emerald-300",
    resultText: "text-emerald-900 dark:text-emerald-100",
    goalClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    trendClass: "text-emerald-600 dark:text-emerald-300",
  },
]

const fitPoints = [
  "サポートサイト・FAQページ・PDFマニュアルなど、すでに文書がある",
  "問い合わせ対応や情報探索にかかる工数を削減したい",
  "エンジニアなしで、担当者だけで運用できる環境が必要",
  "まず1用途から始めて、効果を見ながら段階的に展開したい",
  "拠点・部門をまたいで情報提供の品質を統一したい",
]

const gettingStartedSteps = [
  {
    num: "1",
    title: "用途を1つ決める",
    description:
      "問い合わせ対応・マニュアル案内・社内ナレッジのいずれか1用途に絞ってスタートします。",
  },
  {
    num: "2",
    title: "使うURL・PDFを用意する",
    description:
      "登録するWebページやPDFを事前に整理しておくと、スムーズにBotを作成できます。",
  },
  {
    num: "3",
    title: "公開方法を選んで公開する",
    description:
      "既存サイトへのWidget埋め込みか、専用URLでの共有かを選んで、すぐに公開できます。",
  },
]

function UseCasesShowcase() {
  return (
    <div className="grid gap-6 sm:gap-8">
      {/* Section 1: 4つの活用用途 */}
      <section className="rounded-3xl border border-black/20 bg-white/90 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/75">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
          Use Cases
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">4つの代表的な活用用途</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8 dark:text-zinc-300">
          まずは1用途に絞ってスタートし、運用が安定したら段階的に広げていけます。
        </p>

        <div className="mt-5 grid gap-3 sm:gap-4 lg:grid-cols-2">
          {useCases.map((uc, i) => (
            <motion.article
              key={uc.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.32, delay: 0.07 * i }}
              className="rounded-2xl border border-black/20 bg-white/85 p-4 sm:p-5 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${uc.iconClass}`}
                >
                  <uc.icon className="size-5" />
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${uc.tagClass}`}>
                  {uc.tag}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                {uc.title}
              </h3>
              <div className="mt-3 rounded-xl bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-600 dark:bg-slate-900/60 dark:text-zinc-400">
                <span className="mr-1.5 font-semibold text-zinc-500 dark:text-zinc-400">課題:</span>
                {uc.before}
              </div>
              <p className="mt-2.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{uc.solution}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Section 2: 参考導入事例 */}
      <section className="-mx-4 border-y border-black/20 bg-white/90 px-4 py-6 sm:mx-0 sm:rounded-3xl sm:border sm:bg-white/85 sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          Case Studies
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">参考導入事例</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          実際の運用パターンをもとに構成したモデルケースです。社名は非公開としています。
        </p>

        <div className="mt-5 grid gap-4 sm:gap-5">
          {anonymizedUseCaseStories.map((story, index) => {
            const accent = storyAccents[index] ?? storyAccents[0]
            return (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.32, delay: 0.06 * index }}
                className="rounded-2xl border border-black/20 bg-white p-4 sm:p-6 dark:border-white/10 dark:bg-slate-950/45"
              >
                {/* ヘッダー */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/20 pb-4 dark:border-white/10">
                  <div className="grid gap-1.5">
                    <p className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-100">
                      {story.companyLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {story.industry}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {story.employeeScale}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${accent.goalClass}`}
                  >
                    {story.primaryGoal}
                  </span>
                </div>

                {/* ボディ */}
                <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-slate-900/60">
                      <p className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                        導入前の課題
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                        {story.before}
                      </p>
                    </div>
                    <div className="rounded-xl border border-black/20 p-3.5 dark:border-white/10">
                      <p className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                        実施内容
                      </p>
                      <ul className="mt-2 grid gap-1.5">
                        {story.rollout.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200"
                          >
                            <span
                              className={`mt-2 inline-block size-1.5 shrink-0 rounded-full ${accent.dotColor}`}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border p-3.5 sm:p-4 ${accent.resultBg} ${accent.resultBorder}`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`size-4 ${accent.trendClass}`} />
                      <p className={`text-xs font-semibold tracking-wide ${accent.resultTitle}`}>
                        結果・効果
                      </p>
                    </div>
                    <ul className="mt-2.5 grid gap-2">
                      {story.results.map((item) => (
                        <li
                          key={item}
                          className={`flex items-start gap-2 text-sm leading-6 ${accent.resultText}`}
                        >
                          <Check className={`mt-0.5 size-4 shrink-0 ${accent.trendClass}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      {/* Section 3: 向いているケース + 導入の始め方 */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/20 bg-white/85 p-5 sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">こんな場合に向いています</h3>
          <ul className="mt-4 grid gap-2.5">
            {fitPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300"
              >
                <span className="mt-2 inline-block size-2 shrink-0 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                {point}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/20 bg-white/85 p-5 sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
          <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">導入の始め方</h3>
          <ol className="mt-4 grid gap-3">
            {gettingStartedSteps.map((step) => (
              <li key={step.num} className="flex items-start gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {step.num}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/features">機能を詳しく見る</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/contact" className="inline-flex items-center gap-2">
                導入を相談する
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </article>
      </section>
    </div>
  )
}

export { UseCasesShowcase }
