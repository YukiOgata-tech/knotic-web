import { PricingShowcase } from "@/components/marketing/pricing-showcase"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"

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
