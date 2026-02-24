import Link from "next/link"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { features } from "@/lib/marketing-content"

export default function FeaturesPage() {
  return (
    <PageFrame
      eyebrow="Features"
      title="運用しやすいRAGボット基盤"
      description="投入、インデックス、回答、運用改善までをひとつながりで扱えるように、MVP段階から実装優先度を明確にしています。"
    >
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((item) => (
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
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">次に見るべきページ</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/pricing">料金を見る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/integrations">連携を見る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/security">セキュリティを見る</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
