import type { Metadata } from "next"

import { PricingShowcase } from "@/components/marketing/pricing-showcase"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "料金プラン",
  description:
    "knoticのLite・Standard・Proプランを比較。Bot数、月間メッセージ数、公開方式など運用規模に合わせた料金設計を確認できます。",
  path: "/pricing",
  keywords: ["AIチャットボット料金", "SaaSプラン比較", "Lite Standard Pro"],
})

export default function PricingPage() {
  return (
    <PageFrame
      eyebrow="Pricing"
      title="埋め込み公開を軸にした、実運用向け料金設計"
      description="まずは問い合わせ対応やマニュアル案内を小さく始め、公開規模と運用負荷に合わせて段階的に拡張できる3プラン構成です。"
    >
      <PricingShowcase />

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
