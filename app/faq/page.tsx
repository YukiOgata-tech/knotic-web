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
      <section className="-mx-4 space-y-5 border-y border-black/40 bg-white/80 px-4 py-6 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:rounded-3xl sm:border sm:px-6 sm:py-8">
        <div className="grid gap-4 rounded-2xl border border-black/10 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/65 sm:p-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
              Quick Guide
            </p>
            <p className="mt-2 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-100 sm:text-lg sm:leading-8">
              まずは「埋め込み方法」と「料金・公開範囲」を確認するのがおすすめです。
            </p>
          </div>
          <div className="grid gap-2 text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            <p>・導入初期: Web埋め込みで問い合わせ導線を作る</p>
            <p>・運用拡張: 共有URLやAPI連携を追加する</p>
            <p>・改善運用: FAQ追加と再インデックスを定期化する</p>
          </div>
        </div>
        <FaqAccordion items={faqs} compactMobile />
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-3xl font-semibold tracking-tight">解決しない場合</h2>
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
  )
}
