import type { Metadata } from "next"

import { LottiePreviewPanel } from "@/components/marketing/lottie-preview-panel"
import { PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "Lottie Preview",
  description: "Lottie JSONを読み込んで、再生状態と表示をブラウザで確認するためのプレビューページです。",
  path: "/lottie-preview",
  keywords: ["lottie", "preview", "animation"],
  noIndex: true,
})

export default function LottiePreviewPage() {
  return (
    <PageFrame
      eyebrow="Animation Tool"
      title="Lottie Preview"
      description="Lottie (.json / .lottie) の読み込みと再生挙動を確認するためのページです。URLパス指定またはファイルアップロードで動作確認できます。"
    >
      <LottiePreviewPanel />
    </PageFrame>
  )
}
