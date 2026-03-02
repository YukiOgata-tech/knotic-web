import type { Metadata } from "next"
import Link from "next/link"

import { faqCategories, faqs } from "@/content/faqs"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { buildFaqJsonLd } from "@/lib/seo/structured-data"

export const metadata: Metadata = buildMarketingMetadata({
  title: "よくある質問（FAQ）",
  description:
    "knoticの導入方法・公開方法・料金・セキュリティなど、よくいただく質問をカテゴリ別にまとめています。導入前の疑問をここで解決してください。",
  path: "/faq",
  keywords: ["knotic FAQ", "AIチャットボット導入", "料金質問", "セキュリティ質問"],
})

const faqJsonLd = buildFaqJsonLd(faqs)

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PageFrame
        eyebrow="FAQ"
        title="よくある質問"
        description="サービス概要・機能・料金・セキュリティなど、導入前によくいただく質問をカテゴリ別にまとめています。"
      >
        <section className="-mx-4 border-y border-black/20 bg-white/90 px-4 py-6 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:rounded-3xl sm:border sm:px-6 sm:py-8">
          <div className="grid gap-8">
            {faqCategories.map((category) => (
              <div key={category.label}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
                  {category.label}
                </p>
                <FaqAccordion items={category.items} defaultOpenIndex={-1} compactMobile />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-black/20 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">解決しない場合</h2>
          <p className="mt-2 text-base leading-8 text-zinc-600 dark:text-zinc-300">
            導入条件や運用設計の相談は、用途に合わせて個別にご案内します。
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/contact">問い合わせる</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/demo">デモを確認する</Link>
            </Button>
          </div>
        </section>

        <div className="mt-8">
          <CTASection />
        </div>
      </PageFrame>
    </>
  )
}
