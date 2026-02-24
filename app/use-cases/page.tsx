import Link from "next/link"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCases } from "@/lib/marketing-content"

export default function UseCasesPage() {
  return (
    <PageFrame
      eyebrow="Use Cases"
      title="導入イメージを具体化する活用例"
      description="どの業務で何を改善するのかを明確にすると、必要なナレッジ投入範囲とプラン選定がしやすくなります。"
    >
      <section className="grid gap-4 md:grid-cols-3">
        {useCases.map((item) => (
          <Card key={item.title} className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.description}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">導入準備チェック</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <li>・最初に対象とする問い合わせ領域を1つに絞る</li>
          <li>・回答根拠に使うURL/PDFを先に棚卸しする</li>
          <li>・公開方法（共有URL or 埋め込み）を事前に決める</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/features">機能に戻る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">導入相談</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
