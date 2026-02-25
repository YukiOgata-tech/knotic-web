import Link from "next/link"

import { faqs } from "@/content/faqs"
import { FaqAccordion } from "@/components/marketing/faq-accordion"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"

export default function FaqPage() {
  return (
    <PageFrame
      eyebrow="FAQ"
      title="よくある質問"
      description="埋め込み方法、共有URL公開、主な活用用途、料金感など、導入前によくいただく質問をまとめています。"
    >
      <section className="rounded-3xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45 sm:p-6">
        <FaqAccordion items={faqs} />
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">解決しない場合</h2>
        <div className="mt-5 flex flex-wrap gap-3">
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
  )
}
