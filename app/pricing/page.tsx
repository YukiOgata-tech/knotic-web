import type { Metadata } from "next"

import { PricingShowcase } from "@/components/marketing/pricing-showcase"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { buildAggregateOfferJsonLd } from "@/lib/seo/structured-data"

export const metadata: Metadata = buildMarketingMetadata({
  title: "料金プラン",
  description:
    "knoticのLite・Standard・Proプランを比較。Bot数、月間メッセージ数、公開方式など運用規模に合わせた料金設計を確認できます。",
  path: "/pricing",
  keywords: ["AIチャットボット料金", "SaaSプラン比較", "Lite Standard Pro"],
})

const pricingJsonLd = buildAggregateOfferJsonLd([
  {
    name: "Lite",
    price: "10000",
    description: "月額10,000円。Bot 1体、月間メッセージ1,000件、データ容量100MB。Widgetによる埋め込み公開。小規模な問い合わせ対応の自動化に。",
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
      description="まずは問い合わせ対応やマニュアル案内を小さく始め、公開規模と運用負荷に合わせて段階的に拡張できる3プラン構成です。"
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
