import Link from "next/link"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { faqs } from "@/lib/marketing-content"

export default function FaqPage() {
  return (
    <PageFrame
      eyebrow="FAQ"
      title="よくある質問"
      description="仕様は初期段階のため、実運用のフィードバックを反映して順次更新していきます。"
    >
      <section className="grid gap-3">
        {faqs.map((item) => (
          <Card key={item.q} className="gap-3 border-black/10 bg-white/90 py-4 dark:border-white/10 dark:bg-slate-900/75">
            <CardHeader className="pb-0">
              <CardTitle className="text-base leading-7">{item.q}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.a}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">解決しない場合</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">問い合わせる</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/demo">デモを確認する</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
