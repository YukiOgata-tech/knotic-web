import { FeaturesExperience } from "@/components/marketing/features-experience"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"

export default function FeaturesPage() {
  return (
    <PageFrame
      eyebrow="Features"
      title="URLを貼るだけで、AIチャットボットが完成"
      description="WebサイトのURLやPDFを登録するだけでAIが自動でインデックス化。自社サイトへの埋め込みや専用URLでの公開も、コンソールから設定ひとつで完了します。"
    >
      <FeaturesExperience />

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
