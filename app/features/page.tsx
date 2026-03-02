import type { Metadata } from "next"

import { FeaturesExperience } from "@/components/marketing/features-experience"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "機能一覧",
  description:
    "URLとPDFを登録してAIチャットボットを公開できるknoticの主要機能を紹介。Widget埋め込み、共有URL公開、運用設定まで一元管理できます。",
  path: "/features",
  keywords: ["AIチャットボット機能", "URL学習", "PDF学習", "Widget埋め込み"],
})

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
