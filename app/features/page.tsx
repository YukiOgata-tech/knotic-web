import { FeaturesExperience } from "@/components/marketing/features-experience"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"

export default function FeaturesPage() {
  return (
    <PageFrame
      eyebrow="Features"
      title="埋め込み公開に強い、実運用向けAIボット機能"
      description="問い合わせ対応とマニュアル案内を短期間で立ち上げられるように、Web埋め込み・共有URL公開・継続改善を一連の流れで扱える構成にしています。"
    >
      <FeaturesExperience />

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
