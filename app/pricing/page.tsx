import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { plans } from "@/lib/marketing-content"

export default function PricingPage() {
  return (
    <PageFrame
      eyebrow="Pricing"
      title="3つのプランで段階導入"
      description="まずはLiteで導入し、運用ボリュームに合わせてStandard/Proへ拡張できる構成にしています。細かな上限値は今後確定予定です。"
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="border-black/10 bg-white/90 transition-transform duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/75"
          >
            <CardHeader>
              <p className="text-sm text-muted-foreground">{plan.note}</p>
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
                <Link href="/contact">相談する</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">導入の進め方</h2>
        <ol className="mt-4 grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <li>1. Liteで1Botを立ち上げて、問い合わせ削減や回答品質の基準を確認</li>
          <li>2. 運用が安定したらStandardでデータ量とメッセージ上限を拡張</li>
          <li>3. 複数部門展開やAPI/LINE連携が必要になったらProへ移行</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/use-cases">活用例を見る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">見積もり相談</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
