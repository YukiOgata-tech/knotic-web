import type { Metadata } from "next"
import Link from "next/link"

import { ContactForm } from "@/components/contact/contact-form"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "お問い合わせ",
  description:
    "knoticの導入相談、プラン比較、運用設計の問い合わせはこちら。要件に合わせて公開方法や連携方針をご案内します。",
  path: "/contact",
  keywords: ["knotic問い合わせ", "導入相談", "AIチャットボット相談"],
})

export default function ContactPage() {
  return (
    <PageFrame
      eyebrow="Contact"
      title="お問い合わせ"
      description="導入相談、プラン相談、連携要件の確認などを受け付けています。まずは要件の概要から共有してください。"
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>相談フォーム</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ContactForm />
          </CardContent>
        </Card>

        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>相談前に確認できるページ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <Link href="/pricing" className="rounded-lg border border-black/20 px-3 py-2 hover:bg-muted dark:border-white/10">
              料金プラン
            </Link>
            <Link href="/use-cases" className="rounded-lg border border-black/20 px-3 py-2 hover:bg-muted dark:border-white/10">
              活用例
            </Link>
            <Link href="/integrations" className="rounded-lg border border-black/20 px-3 py-2 hover:bg-muted dark:border-white/10">
              連携
            </Link>
            <Link href="/security" className="rounded-lg border border-black/20 px-3 py-2 hover:bg-muted dark:border-white/10">
              セキュリティ
            </Link>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
