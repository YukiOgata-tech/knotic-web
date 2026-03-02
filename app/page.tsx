import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react"

import { faqs } from "@/content/faqs"
import { AuthAwareCtaButton } from "@/components/auth/auth-aware"
import { Container } from "@/components/layout/container"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { FeaturesPreview } from "@/components/marketing/features-preview"
import { CTASection } from "@/components/marketing/page-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getAppUrl } from "@/lib/env"
import { plans, useCases } from "@/lib/marketing-content"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "URLとPDFでAIチャットボットを作成・公開",
  description:
    "URLやPDFを登録するだけで、Webサイト埋め込み・共有URLで公開できるAIチャットボット。問い合わせ自動化・マニュアル案内・社内ナレッジ検索に最短数分で導入できます。",
  path: "/",
  keywords: ["AIチャットボット", "FAQ自動化", "Webサイト埋め込み", "PDF検索", "knotic"],
})

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

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "knotic",
    url: getAppUrl(),
    description: "URLとPDFでAIチャットボットを作成・公開できるSaaSサービス",
    inLanguage: "ja",
  }

  return (
    <div className="font-jp relative overflow-x-clip bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_32%,#f7fbff_100%)] text-zinc-900 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] dark:text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="w-full">
        <Container className="pt-4 pb-0 sm:pt-12">
          <div className="flex flex-col gap-3 text-center sm:gap-6 sm:text-left">
            <Badge className="mx-auto w-fit rounded-full bg-amber-500/90 px-3 text-white hover:bg-amber-500 sm:mx-0">
              Webに埋め込み、即公開できるAIボット
            </Badge>
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              問い合わせ対応・マニュアル案内を
              <br className="hidden sm:block" />
              <span className="text-cyan-700 dark:text-cyan-300">URLとPDFで自動化</span>
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-5 text-zinc-600 dark:text-zinc-300 sm:mx-0 sm:text-lg sm:leading-6">
              URLやPDFを登録するだけで、Web埋め込みや共有URLで公開できるAIボット作成サービスです。
              <span className="hidden sm:inline">まずは低コストで導入し、運用しながら応答品質を育てていけます。</span>
            </p>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-3">
              <AuthAwareCtaButton
                guestHref="/signup"
                guestLabel="無料で試す"
                authHref="/console"
                authLabel="管理画面へ"
                className="rounded-full"
              />
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/demo">デモを見る</Link>
              </Button>
            </div>
          </div>
        </Container>
        <Image
          src="/images/hero-knotic-mobile.png"
          alt="knotic hero visual"
          width={900}
          height={1200}
          sizes="100vw"
          className="mx-auto mt-3 block h-auto w-full md:hidden"
          priority
        />
        <Image
          src="/images/hero-knotic-pc.png"
          alt="knotic hero visual"
          width={1648}
          height={824}
          sizes="(min-width: 1024px) 80vw, 100vw"
          className="opacity-90 mx-auto mt-6 hidden h-auto w-[90%] drop-shadow-[0_20px_34px_rgba(15,23,42,0.25)] contrast-[1.03] saturate-105 md:block dark:drop-shadow-[0_20px_34px_rgba(2,6,23,0.55)] rounded-3xl"
          priority
        />
      </section>

      <Container className="relative z-10 flex flex-col gap-8 py-6 sm:gap-14 sm:py-10">
        {/* Stats bar */}
        <section className="grid grid-cols-3 divide-x divide-black/10 rounded-2xl border border-black/10 bg-white/80 py-3 shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/70 sm:py-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5 px-2 text-center">
              <span className="text-base font-bold sm:text-2xl">{stat.value}</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 sm:text-sm">{stat.label}</span>
              <span className="hidden text-xs text-zinc-400 dark:text-zinc-500 sm:block">{stat.sub}</span>
            </div>
          ))}
        </section>

        {/* Problem */}
        <section className="space-y-3 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">こんな課題ありませんか？</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">多くのチームが同じ問題を抱えています。knoticはそれを解消します。</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            {problems.map((problem) => (
              <div
                key={problem}
                className="flex items-start gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60 sm:px-4 sm:py-3"
              >
                <XCircle className="mt-0.5 size-3.5 shrink-0 text-rose-500 sm:size-4" />
                <span className="text-xs text-zinc-700 dark:text-zinc-200 sm:text-sm">{problem}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-3 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">3ステップで公開</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">エンジニア不要。最短数分でAIボットを本番公開できます。</p>
          </div>
          {/* モバイル: 横並びコンパクトロー / sm+: 3列カード */}
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-slate-900/70 sm:flex-col sm:rounded-2xl sm:p-6"
              >
                <span className="shrink-0 text-xl font-bold text-cyan-600/40 dark:text-cyan-400/30 sm:text-4xl">{step.number}</span>
                <div>
                  <h3 className="text-sm font-semibold sm:mt-2 sm:text-lg">{step.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300 sm:mt-1 sm:text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <FeaturesPreview />

        {/* Use cases */}
        <section className="space-y-3 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">活用シーン</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">さまざまな業務課題に対応できます。</p>
          </div>
          {/* モバイル: 横並びコンパクトロー / sm+: 3列カード */}
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-4">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-slate-900/70 sm:flex-col sm:rounded-2xl sm:p-6"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-600 dark:text-cyan-400 sm:size-5" />
                <div>
                  <h3 className="text-sm font-semibold sm:mt-3 sm:text-base">{uc.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-1 sm:text-sm">{uc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-3 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">料金プラン</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">小さく始められる価格帯から、運用規模に合わせて段階的に拡張できます。</p>
          </div>
          {/* モバイル: 横スクロール / lg+: 3列グリッド */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className="w-[65vw] shrink-0 snap-start border-black/40 bg-white/90 transition-transform duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/75 sm:w-[60vw] lg:w-auto"
              >
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
                  <Button asChild variant="outline" className="w-[80%] rounded-none border-x-0 border-black dark:border-white">
                    <Link href="/contact" className="text-xs sm:text-base">このプランで相談する</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <Button asChild variant="outline" className="rounded-2xl border-x-0 border-black dark:border-white gap-2">
            <Link href="/pricing">料金詳細へ
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>

        {/* FAQ */}
        <section className="-mx-4 space-y-3 border-y border-black/40 bg-white/80 px-4 py-4 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:space-y-5 sm:rounded-3xl sm:border sm:p-8">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>
            <p className="hidden text-zinc-600 dark:text-zinc-300 sm:block">埋め込み方法、公開URL、主な用途、料金感などを先に確認できます。</p>
          </div>
          <FaqAccordion items={faqs.slice(0, 4)} compactMobile />
          <Button asChild variant="outline" className="rounded-2xl border-x-0 border-black dark:border-white gap-2">
            <Link href="/faq">すべてのFAQを見る
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>

        <CTASection />
      </Container>
    </div>
  )
}
