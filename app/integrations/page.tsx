import type { Metadata } from "next"
import Link from "next/link"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "連携",
  description:
    "共有URL公開、埋め込みWidget、API連携などknoticの提供形態を紹介。運用フェーズに応じて段階的に拡張できます。",
  path: "/integrations",
  keywords: ["チャットボット連携", "API連携", "Widget", "共有URL"],
})

const integrationItems = [
  {
    title: "共有URLページ",
    description: "サービスドメイン配下の公開ページで、すぐに利用開始できる導線を提供します。",
  },
  {
    title: "埋め込みWidget",
    description: "scriptタグで顧客サイトにチャットUIを導入。導入負荷を最小化します。",
  },
  {
    title: "API連携",
    description: "上位プランで `POST /v1/chat` を想定。社内システムや外部チャネルと統合できます。",
  },
  {
    title: "LINE連携（予定）",
    description: "Webhook受信・署名検証・Bot紐付けを含む運用設計を段階的に追加します。",
  },
]

export default function IntegrationsPage() {
  return (
    <PageFrame
      eyebrow="Integrations"
      title="公開・埋め込み・API連携までを段階的に"
      description="まずは共有URLで価値検証し、必要になった段階で埋め込みや外部連携に拡張できる構成で設計します。"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {integrationItems.map((item) => (
          <Card key={item.title} className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.description}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-black/20 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">技術検討の入り口</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/security">セキュリティ要件</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/pricing">プラン別機能</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">連携相談</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
