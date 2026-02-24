import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { Container } from "@/components/layout/container"
import { CTASection } from "@/components/marketing/page-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { faqs, features, plans } from "@/lib/marketing-content"

export default function Home() {
  return (
    <div className="relative overflow-x-clip bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_32%,#f7fbff_100%)] text-zinc-900 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-80 bg-[radial-gradient(circle_at_20%_40%,rgba(255,166,0,.18),transparent_55%),radial-gradient(circle_at_78%_12%,rgba(6,182,212,.18),transparent_52%)] dark:bg-[radial-gradient(circle_at_20%_40%,rgba(250,204,21,.15),transparent_55%),radial-gradient(circle_at_78%_12%,rgba(34,211,238,.18),transparent_52%)]" />
      <Container className="flex flex-col gap-14 py-10 sm:py-14">
        <section className="relative grid gap-8 rounded-3xl border border-black/5 bg-white/85 p-6 shadow-[0_14px_45px_-30px_rgba(15,23,42,.45)] dark:border-white/10 dark:bg-slate-900/75 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <Badge className="rounded-full bg-amber-500/90 px-3 text-white hover:bg-amber-500">
              URL / PDF ナレッジ投入型AIチャット
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              その情報だけで答える
              <br />
              専用AIボットを最短で公開
            </h1>
            <p className="max-w-2xl text-[1.05rem] leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              knoticは、URLやPDFを投入するだけでRAGチャットボットを構築できるサービスです。公開URLでも埋め込みでも、すぐに運用を開始できます。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full">
                <Link href="/signup">
                  無料で試す
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
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

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">主要機能</h2>
            <p className="text-zinc-600 dark:text-zinc-300">
              MVP公開に向けて、運用性と信頼性を重視した機能から実装します。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.slice(0, 3).map((item) => (
              <Card key={item.title} className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
                <CardHeader>
                  <div className="mb-2 inline-flex size-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <item.icon className="size-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.description}</CardContent>
              </Card>
            ))}
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/features">機能一覧を見る</Link>
          </Button>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">料金プラン</h2>
            <p className="text-zinc-600 dark:text-zinc-300">3プランで提供予定です。詳細上限値は運用データを見て確定します。</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className="border-black/10 bg-white/90 transition-transform duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/75"
              >
                <CardHeader>
                  <CardDescription>{plan.note}</CardDescription>
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
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link href="/contact">このプランで相談する</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/pricing">料金詳細へ</Link>
          </Button>
        </section>

        <section className="space-y-5 rounded-3xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>
            <p className="text-zinc-600 dark:text-zinc-300">よくある質問を先に確認して、導入判断をしやすくしています。</p>
          </div>
          <div className="grid gap-3">
            {faqs.slice(0, 3).map((item) => (
              <Card key={item.q} className="gap-3 border-zinc-200 py-4 dark:border-white/10 dark:bg-slate-900/60">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base leading-7">{item.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.a}</CardContent>
              </Card>
            ))}
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/faq">すべてのFAQを見る</Link>
          </Button>
        </section>

        <CTASection />
      </Container>
    </div>
  )
}
