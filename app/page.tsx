import type { Metadata } from "next"

import { HomePageExperience } from "@/components/marketing/home-page-experience"
import { getAppUrl } from "@/lib/env"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "URLとファイルでAIチャットボットを作成・公開",
  description:
    "URLやファイルを登録するだけで、Webサイト埋め込み・共有URL・APIで公開できるAIチャットボット。問い合わせ自動化・マニュアル案内・社内ナレッジ検索に最短数分で導入できます。",
  path: "/",
  keywords: ["AIチャットボット", "FAQ自動化", "Webサイト埋め込み", "PDF検索", "knotic"],
})

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "knotic",
    url: getAppUrl(),
    description: "URLとファイルでAIチャットボットを作成・公開できるSaaSサービス",
    inLanguage: "ja",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageExperience />
    </>
  )
}
