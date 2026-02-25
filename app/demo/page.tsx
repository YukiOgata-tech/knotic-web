import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { AuthAwareCtaButton } from "@/components/auth/auth-aware"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const steps = [
  "サインアップしてBotを1つ作成",
  "URL/PDFを投入してインデックス完了を待つ",
  "テストチャットで回答品質と出典を確認",
  "共有URLまたはWidgetで公開",
]

export default function DemoPage() {
  return (
    <PageFrame
      eyebrow="Demo"
      title="デモ導線"
      description="このページは導入イメージを具体的に掴むためのデモ案内です。将来的には実際の体験デモに置き換えます。"
    >
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>デモの流れ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {steps.map((step) => (
              <div key={step} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-cyan-600" />
                {step}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>次のアクション</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <AuthAwareCtaButton
              guestHref="/signup"
              guestLabel="無料トライアルを始める"
              authHref="/console"
              authLabel="管理画面へ"
              variant="outline"
              className="rounded-full"
            />
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/contact">個別相談をする</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/pricing">プランを比較する</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
