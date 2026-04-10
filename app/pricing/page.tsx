import type { Metadata } from "next"

import { PricingShowcase } from "@/components/marketing/pricing-showcase"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { buildAggregateOfferJsonLd } from "@/lib/seo/structured-data"

export const metadata: Metadata = buildMarketingMetadata({
  title: "料金プラン",
  description:
    "knoticのStarter・Lite・Standard・Proプランを比較。¥4,900のStarterから始め、利用規模に合わせて段階的に拡張できる料金設計です。",
  path: "/pricing",
  keywords: ["AIチャットボット料金", "SaaSプラン比較", "Starter Lite Standard Pro"],
})

const pricingJsonLd = buildAggregateOfferJsonLd([
  {
    name: "Starter",
    price: "4900",
    description: "月額4,900円。Bot 1体、月間メッセージ300件、データ容量75MB。Widgetによる埋め込み公開。既存サイトへの設置から始める小規模事業者向け。",
  },
  {
    name: "Lite",
    price: "9800",
    description: "月額9,800円。Bot 1体、月間メッセージ1,000件、データ容量100MB。Widgetによる埋め込み公開。利用増加に対応した本格Widget運用向け。",
  },
  {
    name: "Standard",
    price: "24800",
    description: "月額24,800円。Bot 2体、月間メッセージ5,000件、データ容量1GB。Widget・Hosted URL・API公開対応。運用の安定化と公開導線の拡充に。",
  },
  {
    name: "Pro",
    price: "100000",
    description: "月額100,000円。Bot無制限（内部上限50体）、月間メッセージ20,000件、データ容量10GB。Widget・Hosted URL・API公開対応。複数部門への本格展開に。",
  },
])

export default function PricingPage() {
  return (
    <PageFrame
      eyebrow="Pricing"
      title="埋め込み公開を軸にした、実運用向け料金設計"
      description="サイト設置から始めて、利用増加・公開規模に合わせて段階的に拡張できる4プラン構成です。"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <PricingShowcase />

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
