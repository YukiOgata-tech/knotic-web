import type { Metadata } from "next"

import { UseCasesShowcase } from "@/components/marketing/use-cases-showcase"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "活用事例",
  description:
    "問い合わせ対応、社内ナレッジ検索、オンボーディング支援など、knoticの代表的な活用例を用途別に紹介します。",
  path: "/use-cases",
  keywords: ["チャットボット活用例", "問い合わせ自動化", "社内ナレッジ"],
})

export default function UseCasesPage() {
  return (
    <PageFrame
      eyebrow="Use Cases"
      title="どんな用途に使えるか、実例で確認する"
      description="問い合わせ対応・マニュアル案内・社内ナレッジ共有・オンボーディング支援の4用途が代表的です。まずは1つに絞ってスタートし、効果を見ながら段階的に展開できます。"
    >
      <UseCasesShowcase />

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
