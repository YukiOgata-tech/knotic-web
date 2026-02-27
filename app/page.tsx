import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { faqs } from "@/content/faqs"
import { AuthAwareCtaButton } from "@/components/auth/auth-aware"
import { Container } from "@/components/layout/container"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { FeaturesPreview } from "@/components/marketing/features-preview"
import { CTASection } from "@/components/marketing/page-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { plans } from "@/lib/marketing-content"


const primaryH1 = "問い合わせ対応とマニュアル案内を、Web埋め込みですぐ公開できるAIボット"

export default function Home() {
  return (
    <div className="font-jp relative overflow-x-clip bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_32%,#f7fbff_100%)] text-zinc-900 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] dark:text-zinc-100">
      <section className="w-full">
        <h1 className="sr-only">{primaryH1}</h1>
        <Image
          src="/images/hero-knotic-mobile.png"
          alt="knotic hero visual"
          width={900}
          height={1200}
          sizes="100vw"
          className="mx-auto mt-1 block h-auto w-full md:hidden"
          priority
        />
        <Image
          src="/images/hero-knotic-pc.png"
          alt="knotic hero visual"
          width={1648}
          height={824}
          sizes="(min-width: 1024px) 80vw, 100vw"
          className="opacity-90 mx-auto mt-1 hidden h-auto w-[90%] drop-shadow-[0_20px_34px_rgba(15,23,42,0.25)] contrast-[1.03] saturate-105 md:block dark:drop-shadow-[0_20px_34px_rgba(2,6,23,0.55)] rounded-3xl"
          priority
        />
      </section>
      <Container className="relative z-10 flex flex-col gap-14 py-10 sm:py-14">
        <section className="relative grid gap-4 sm:gap-8 rounded-3xl border border-black/5 bg-white/85 p-6 shadow-[0_14px_45px_-30px_rgba(15,23,42,.45)] dark:border-white/10 dark:bg-slate-900/75 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <Badge className="rounded-full bg-amber-500/90 px-3 text-white hover:bg-amber-500">
              Webに埋め込み、即公開できるAIボット
            </Badge>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
              問い合わせ・マニュアル対応も
              <br />
              すぐ使えるAIボットに
            </h2>
            <p className="max-w-2xl text-md leading-6 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              knoticは、URLやPDFを登録するだけで、Web埋め込みや共有URL公開ができるAIボット作成サービスです。まずは低コストで導入し、運用しながら応答品質を育てていけます。
            </p>
            <div className="flex gap-3 flex-row">
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
          <Card className="border-zinc-200/80 bg-[linear-gradient(160deg,#ffffff_20%,#f3fbff_78%)] dark:border-white/15 dark:bg-[linear-gradient(160deg,#111827_20%,#0f2030_78%)]">
            <CardHeader>
              <CardTitle className="text-xl">初期導入の流れ</CardTitle>
              <CardDescription>最短数分で公開まで到達</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-cyan-600" />
                サインアップしてBotを作成
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-cyan-600" />
                URL/PDFを登録してインデックス
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-cyan-600" />
                共有URLまたはWidgetで公開
              </div>
            </CardContent>
          </Card>
        </section>

        <FeaturesPreview />

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">料金プラン</h2>
            <p className="text-zinc-600 dark:text-zinc-300">小さく始められる価格帯から、運用規模に合わせて段階的に拡張できます。</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className="border-black/40 bg-white/90 transition-transform duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/75"
              >
                <CardHeader>
                  <CardDescription className="text-gray-700 dark:text-white">{plan.note}</CardDescription>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-3xl font-semibold tracking-tight">{plan.price}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 text-cyan-600" />
                      {point}
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-[80%] rounded-none border-x-0 border-black dark:border-white">
                    <Link href="/contact">このプランで相談する</Link>
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

        <section className="-mx-4 space-y-5 border-y border-black/40 bg-white/80 px-4 py-6 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:rounded-3xl sm:border sm:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>
            <p className="text-zinc-600 dark:text-zinc-300">埋め込み方法、公開URL、主な用途、料金感などを先に確認できます。</p>
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
