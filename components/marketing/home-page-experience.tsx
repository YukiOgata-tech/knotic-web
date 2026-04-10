"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  XCircle,
} from "lucide-react"

import { faqs } from "@/content/faqs"
import { AuthAwareCtaButton } from "@/components/auth/auth-aware"
import { Container } from "@/components/layout/container"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { FeaturesPreview } from "@/components/marketing/features-preview"
import { PlanCtaButton } from "@/components/marketing/plan-cta-button"
import { CTASection } from "@/components/marketing/page-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { plans, useCases } from "@/lib/marketing-content"

const problems = [
  "問い合わせ対応に毎日時間を取られている",
  "マニュアルがPDFのまま活用されていない",
  "FAQページが増えすぎて探しにくくなった",
  "サポート担当者が同じ質問を繰り返し受けている",
  "社内ナレッジが属人化・散在している",
  "エンジニアなしでAIを導入する方法がわからない",
]

const steps = [
  {
    number: "01",
    title: "Botを作成",
    description: "サインアップしてBotを作成。名前と説明を入力するだけで準備完了。",
  },
  {
    number: "02",
    title: "データを登録",
    description: "URLを貼り付けるかPDFをアップロード。AIが自動でナレッジをインデックス化します。",
  },
  {
    number: "03",
    title: "公開・埋め込み",
    description: "Widget埋め込みまたは共有URLで即日公開。scriptタグ1行で既存サイトに設置できます。",
  },
]

const stats = [
  { label: "公開形式", value: "3種類", sub: "Widget / Hosted / API" },
  { label: "対応データ", value: "URL + PDF", sub: "複数組み合わせ可" },
  { label: "最短導入", value: "数分〜", sub: "エンジニア不要" },
]

const typedPhrases = [
  "問い合わせ対応を自動化",
  "マニュアル案内を24時間化",
  "社内ナレッジ検索を高速化",
]

function TypingHeadline({ phrases }: { phrases: string[] }) {
  const shouldReduceMotion = useReducedMotion()
  const [phraseIndex, setPhraseIndex] = React.useState(0)
  const [visibleCount, setVisibleCount] = React.useState(0)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const longestPhrase = React.useMemo(
    () => phrases.reduce((longest, phrase) => (phrase.length > longest.length ? phrase : longest), ""),
    [phrases]
  )

  React.useEffect(() => {
    if (shouldReduceMotion) return

    const current = phrases[phraseIndex] ?? ""
    const reachedEnd = visibleCount === current.length
    const reachedStart = visibleCount === 0

    const timeout = window.setTimeout(() => {
      if (!isDeleting) {
        if (reachedEnd) {
          setIsDeleting(true)
          return
        }
        setVisibleCount((count) => Math.min(count + 1, current.length))
        return
      }

      if (reachedStart) {
        setIsDeleting(false)
        setPhraseIndex((index) => (index + 1) % phrases.length)
        return
      }

      setVisibleCount((count) => Math.max(count - 1, 0))
    }, isDeleting ? 26 : reachedEnd ? 1200 : 56)

    return () => window.clearTimeout(timeout)
  }, [isDeleting, phraseIndex, phrases, shouldReduceMotion, visibleCount])

  const activePhrase = shouldReduceMotion
    ? phrases[0] ?? ""
    : (phrases[phraseIndex] ?? "").slice(0, visibleCount)

  return (
    <span
      className="relative inline-grid min-h-[1.15em] items-center font-mono text-cyan-700 dark:text-cyan-300"
      style={{ minWidth: `${Math.max(longestPhrase.length, 8)}ch` }}
    >
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {longestPhrase}
      </span>
      <span className="col-start-1 row-start-1 inline-flex items-center gap-1 whitespace-nowrap">
        <span>{activePhrase}</span>
        <motion.span
          aria-hidden="true"
          animate={shouldReduceMotion ? undefined : { opacity: [1, 0, 1] }}
          transition={shouldReduceMotion ? undefined : { duration: 0.9, repeat: Number.POSITIVE_INFINITY }}
          className="inline-block h-[0.95em] w-[0.08em] rounded-full bg-current"
        />
      </span>
    </span>
  )
}

function Reveal({
  children,
  delay = 0,
  amount = 0.25,
  distance = 26,
}: {
  children: React.ReactNode
  delay?: number
  amount?: number
  distance?: number
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: distance, filter: "blur(14px)" }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function SectionReveal({
  children,
  className,
  delay = 0,
  amount = 0.18,
  id,
}: {
  children: React.ReactNode
  className: string
  delay?: number
  amount?: number
  id?: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const ref = React.useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "end 0.15"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 0 : 30, shouldReduceMotion ? 0 : -10])

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 32, filter: "blur(16px)" }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      style={shouldReduceMotion ? undefined : { y }}
      className={`relative ${className}`}
    >
      {children}
    </motion.section>
  )
}

function StaggerItem({
  children,
  index,
  className,
}: {
  children: React.ReactNode
  index: number
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const x = index % 2 === 0 ? -18 : 18
  const rotate = index % 2 === 0 ? -1.4 : 1.4

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, x, y: 22, rotate, filter: "blur(10px)" }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HomePageExperience() {
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.22], [0, shouldReduceMotion ? 0 : 70])
  const heroRotate = useTransform(scrollYProgress, [0, 0.22], [0, shouldReduceMotion ? 0 : -2.5])
  const heroTextY = useTransform(scrollYProgress, [0, 0.18], [0, shouldReduceMotion ? 0 : -18])
  const heroBadgeY = useTransform(scrollYProgress, [0, 0.15], [0, shouldReduceMotion ? 0 : -10])
  const ambientLeftY = useTransform(scrollYProgress, [0, 0.4], [0, shouldReduceMotion ? 0 : 110])
  const ambientRightY = useTransform(scrollYProgress, [0, 0.4], [0, shouldReduceMotion ? 0 : 70])
  const ambientGridY = useTransform(scrollYProgress, [0, 0.4], [0, shouldReduceMotion ? 0 : 34])

  return (
    <div className="font-jp relative overflow-x-clip bg-[linear-gradient(180deg,#fff7ea_0%,#fffdf7_28%,#f3fbff_74%,#edf7ff_100%)] text-zinc-900 dark:bg-[linear-gradient(180deg,#091423_0%,#0b1220_42%,#08111c_100%)] dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-176 overflow-hidden">
        <motion.div
          style={shouldReduceMotion ? undefined : { y: ambientLeftY }}
          className="absolute left-[-8%] -top-24 h-80 w-[20rem] rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-200/10"
        />
        <motion.div
          style={shouldReduceMotion ? undefined : { y: ambientRightY }}
          className="absolute right-[-10%] top-4 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-300/10"
        />
        <motion.div
          style={shouldReduceMotion ? undefined : { y: ambientGridY }}
          className="absolute inset-0 opacity-45 bg-[linear-gradient(to_right,rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.08)_1px,transparent_1px)] bg-size-[44px_44px] dark:opacity-15"
        />
      </div>

      <section className="relative isolate">
        <Container size="wide" className="relative pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-18 lg:pb-18">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] lg:gap-10">
            <Reveal>
              <motion.div style={shouldReduceMotion ? undefined : { y: heroTextY }}>
                <motion.div style={shouldReduceMotion ? undefined : { y: heroBadgeY }} className="inline-flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-amber-400/40 bg-amber-400/90 px-3 py-1 text-[11px] tracking-[0.16em] text-white hover:bg-amber-400/90">
                    AI BOT PLATFORM
                  </Badge>
                  <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-medium text-zinc-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/60 dark:text-zinc-200">
                    URL とファイルで、公開まで一気通貫
                  </span>
                </motion.div>

                <div className="mt-5 max-w-4xl space-y-5">
                  <h1 className="text-[2.35rem] font-black leading-[0.98] tracking-[-0.04em] sm:text-[4.2rem] lg:text-[4.2rem]">
                    <span className="block">URL<span className="text-xl sm:text-4xl">や</span>資料<span className="text-xl sm:text-4xl">を</span>準備するだけ</span>
                    <span className="mt-2 block text-[1.55rem] font-semibold tracking-[-0.03em] sm:text-[2.7rem] lg:text-[3.35rem]">
                      <TypingHeadline phrases={typedPhrases} />
                    </span>
                  </h1>

                  <p className="max-w-2xl text-sm leading-7 text-zinc-600 sm:text-lg sm:leading-8 dark:text-zinc-300">
                    URLやファイルを登録するだけで、Webサイト埋め込み･共有URL･APIから使えるAIボットを構築。
                    公開導線と運用導線を分けず、導入後の改善まで同じ画面で進められます。
                  </p>
                </div>
              </motion.div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <AuthAwareCtaButton
                  guestHref="/signup"
                  guestLabel="無料で試す"
                  authHref="/console"
                  authLabel="管理画面へ"
                  className="rounded-full bg-cyan-600 px-6 text-white hover:bg-cyan-700"
                />
                <Button asChild variant="outline" className="rounded-full border-black/15 bg-white/70 px-6 backdrop-blur dark:border-white/20 dark:bg-slate-950/45">
                  <Link href="/demo">デモを見る</Link>
                </Button>
              </div>

              {/* <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {heroSignals.map((signal, index) => (
                  <motion.div
                    key={signal.label}
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.36, delay: 0.12 + index * 0.08 }}
                    className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55 dark:shadow-[0_14px_36px_rgba(2,6,23,0.22)]"
                  >
                    <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                      <signal.icon className="size-4.5" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{signal.label}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{signal.value}</p>
                  </motion.div>
                ))}
              </div> */}

              <a
                href="#home-stats"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              >
                スクロールして体験を見る
                <motion.span
                  animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
                  transition={shouldReduceMotion ? undefined : { duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </a>
            </Reveal>

            <Reveal delay={0.08}>
              <motion.div
                style={{ y: heroY, rotate: heroRotate }}
                className="-mx-4 relative w-[calc(100%+2rem)] sm:mx-auto sm:w-full sm:max-w-184 xl:max-w-208"
              >
                <div className="absolute -left-3 top-10 hidden rounded-2xl border border-white/60 bg-white/75 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur md:block dark:border-white/10 dark:bg-slate-950/55 dark:shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Launch in</p>
                  <p className="mt-1 text-2xl font-black">3 ways</p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Widget / Hosted / API</p>
                </div>
                <div className="absolute -right-3 -bottom-16 hidden rounded-2xl border border-black/10 bg-zinc-950 px-4 py-3 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] md:block dark:border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Quality Loop</p>
                  <p className="mt-1 text-sm font-semibold">登録 → 検証 → 改善</p>
                </div>
                <div className="overflow-hidden bg-transparent p-0 sm:rounded-[2rem] sm:border sm:border-black/10 sm:bg-white/70 sm:shadow-[0_24px_64px_rgba(15,23,42,0.16)] sm:backdrop-blur md:p-0 dark:sm:border-white/10 dark:sm:bg-slate-950/45 dark:sm:shadow-[0_28px_72px_rgba(2,6,23,0.34)]">
                  <div className="overflow-hidden bg-transparent sm:rounded-[1.5rem] sm:border sm:border-white/70 sm:bg-[linear-gradient(180deg,rgba(255,255,255,.76),rgba(247,250,255,.92))] dark:sm:border-white/10 dark:sm:bg-[linear-gradient(180deg,rgba(15,23,42,.76),rgba(8,15,26,.96))]">
                    <div className="hidden items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10 sm:flex">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-rose-400" />
                        <span className="size-2.5 rounded-full bg-amber-400" />
                        <span className="size-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm dark:bg-slate-900/70 dark:text-zinc-300">
                        KNOTIC とは?
                      </div>
                    </div>
                    <Image
                      src="/images/hero-knotic-pc.png"
                      alt="knotic hero visual"
                      width={1648}
                      height={824}
                      sizes="(min-width: 1280px) 52rem, (min-width: 1024px) 46rem, 100vw"
                      className="hidden h-auto w-full md:block"
                      priority
                    />
                    <Image
                      src="/images/hero-knotic-mobile.png"
                      alt="knotic hero visual"
                      width={900}
                      height={1200}
                      sizes="100vw"
                      className="block h-auto w-full md:hidden"
                      priority
                    />
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </Container>
      </section>

      <Container size="full" className="relative z-10 flex flex-col gap-8 py-6 sm:w-[90%] sm:gap-14 sm:py-10">
        <SectionReveal
          id="home-stats"
          className="grid grid-cols-3 divide-x divide-black/10 overflow-hidden rounded-2xl border border-black/40 bg-white/80 py-3 shadow-sm dark:divide-white/10 dark:border-white/50 dark:bg-slate-900/70 sm:py-4"
        >
          {stats.map((stat, index) => (
            <StaggerItem key={stat.label} index={index}>
              <div className="flex flex-col items-center gap-0.5 px-2 text-center">
                <span className="text-base font-bold sm:text-2xl">{stat.value}</span>
                <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 sm:text-sm">{stat.label}</span>
                <span className="hidden text-xs font-semibold text-zinc-800 dark:text-zinc-200 sm:block">{stat.sub}</span>
              </div>
            </StaggerItem>
          ))}
        </SectionReveal>

        <SectionReveal
          className="-mx-4 space-y-3 border-y border-black/40 bg-white/80 px-4 py-4 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:space-y-5 sm:rounded-3xl sm:border sm:p-8"
        >
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">こんな"課題"ありませんか？</h2>
            <p className="hidden text-zinc-800 dark:text-zinc-200 sm:block">多くのチームが同じ問題を抱えています。knoticでその問題を解決しましょう。</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            {problems.map((problem, index) => (
              <StaggerItem key={problem} index={index}>
                <div
                key={problem}
                className="flex items-start gap-2 rounded-xl border border-black/40 bg-white/70 px-3 py-2 dark:border-white/50 dark:bg-slate-900/60 sm:px-4 sm:py-3"
              >
                <XCircle className="mt-0.5 size-3.5 shrink-0 text-rose-500 sm:size-4" />
                <span className="text-xs text-zinc-700 dark:text-zinc-200 sm:text-sm">{problem}</span>
                </div>
              </StaggerItem>
            ))}
          </div>
        </SectionReveal>

        <SectionReveal
          className="space-y-3 sm:space-y-5"
        >
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">3ステップで公開!</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">エンジニア不要。最短数分でAIボットを本番公開できます。</p>
          </div>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-4">
            {steps.map((step, index) => (
              <StaggerItem key={step.number} index={index}>
                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 rounded-xl border border-black/40 bg-gray-200/50 px-4 py-3 dark:border-white/10 dark:bg-gray-800/70 sm:flex-col sm:rounded-2xl sm:p-6"
                >
                  <span className="shrink-0 text-xl font-bold text-cyan-600/90 hover:underline dark:text-cyan-400 sm:text-4xl">{step.number}</span>
                  <div>
                    <h3 className="text-sm font-semibold sm:mt-2 sm:text-lg">{step.title}</h3>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300 sm:mt-1 sm:text-sm">{step.description}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </div>
        </SectionReveal>

        <FeaturesPreview />

        <SectionReveal
          className="space-y-3 sm:space-y-5"
        >
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">活用シーン</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">さまざまな業務課題に対応できます。</p>
          </div>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-4">
            {useCases.map((uc, index) => (
              <StaggerItem key={uc.title} index={index}>
                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { y: -5 }}
                  transition={{ duration: 0.22 }}
                  className="rounded-xl border-y border-black/40 bg-slate-100/80 px-4 py-3 shadow-2xl dark:border-white/40 dark:bg-slate-900/70 sm:rounded-2xl sm:p-6"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 shrink-0 text-cyan-600 dark:text-cyan-400 sm:size-6" />
                    <h3 className="text-sm font-semibold sm:text-lg">{uc.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-2 sm:text-sm">{uc.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </div>
        </SectionReveal>

        <SectionReveal
          className="space-y-3 sm:space-y-5"
        >
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">料金プラン</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">小さく始められる価格帯から、運用規模に合わせて段階的に拡張できます。</p>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 lg:grid lg:grid-cols-4 lg:overflow-visible ">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 26, scale: 0.96, filter: "blur(10px)" }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
                className="shrink-0 sm:w-[60vw] lg:w-auto"
              >
                <Card className="w-[60vw] snap-start border-black/40 bg-white/90 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/75 sm:w-[60vw] lg:w-auto">
                  <CardHeader className="pb-1 sm:pb-6">
                    <CardDescription className="text-gray-700 dark:text-white">{plan.note}</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl">- {plan.name} -</CardTitle>
                    <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{plan.price}</p>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-200 sm:space-y-2">
                    {plan.points.map((point) => (
                      <div key={point} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-3.5 text-cyan-600 sm:size-4" />
                        <span className="text-xs sm:text-sm">{point}</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    {plan.code === "pro" ? (
                      <Button asChild variant="outline" className="w-[80%] rounded-none border-x-0 border-black dark:border-white">
                        <Link href="/contact" className="text-xs sm:text-base">お問合せする</Link>
                      </Button>
                    ) : (
                      <PlanCtaButton
                        planCode={plan.code}
                        planName={plan.name}
                        className="w-[80%] rounded-none border border-x-0 border-black bg-transparent text-xs text-zinc-900 hover:bg-zinc-100 dark:border-white dark:text-white dark:hover:bg-slate-800 sm:text-base"
                      />
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
          <Button asChild variant="outline" className="gap-2 rounded-2xl border-x-0 border-black dark:border-white">
            <Link href="/pricing">
              料金詳細へ
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </SectionReveal>

        <SectionReveal
          className="-mx-4 space-y-3 border-y border-black/40 bg-white/80 px-4 py-4 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:space-y-5 sm:rounded-3xl sm:border sm:p-8"
        >
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">埋め込み方法、公開URL、主な用途、料金感などを先に確認できます。</p>
          </div>
          <FaqAccordion items={faqs.slice(0, 4)} compactMobile />
          <Button asChild variant="outline" className="gap-2 rounded-2xl border-x-0 border-black dark:border-white">
            <Link href="/faq">
              すべてのFAQを見る
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </SectionReveal>

        <Reveal amount={0.2} distance={34}>
          <CTASection />
        </Reveal>
      </Container>
    </div>
  )
}
