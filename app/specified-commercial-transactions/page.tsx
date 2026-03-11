import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import {
  commercialLawMeta,
  commercialLawSections,
  subscriptionImportantNotices,
} from "@/content/specified-commercial-transactions"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "特定商取引法に基づく表記",
  description:
    "knoticの特定商取引法に基づく表記です。販売事業者情報、料金、支払時期、解約条件など法定表示事項を掲載しています。",
  path: "/specified-commercial-transactions",
})

export default function SpecifiedCommercialTransactionsPage() {
  return (
    <PageFrame
      eyebrow="Legal"
      title="特定商取引法に基づく表記"
      description="特定商取引法（昭和51年法律第57号）第11条および2022年改正に基づき、通信販売に関する事項を以下のとおり表示します。"
    >
      {/* 定期購入に関する重要事項（2022年改正特商法対応） */}
      <section className="mb-4 -mx-4 rounded-none border-y border-amber-300/60 bg-amber-50/80 px-4 py-5 dark:border-amber-500/40 dark:bg-amber-950/25 sm:mx-0 sm:mb-6 sm:rounded-2xl sm:border sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              定期購入（自動更新）に関する重要事項
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
              特定商取引法第11条・2022年改正に基づく定期購入の重要事項
            </p>
            <ul className="mt-3 space-y-2">
              {subscriptionImportantNotices.map((notice) => (
                <li key={notice} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  {notice}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* メインコンテンツ */}
      <section className="-mx-4 rounded-none border-y border-black/20 bg-white/90 px-4 py-6 dark:border-white/10 dark:bg-slate-900/75 sm:mx-0 sm:rounded-2xl sm:border sm:p-8">
        <div className="mb-6 grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <p>施行日: {commercialLawMeta.effectiveDate}</p>
          <p>最終改定日: {commercialLawMeta.revisedAt}</p>
        </div>

        <div className="grid gap-6">
          {commercialLawSections.map((section) => (
            <article key={section.id} className="grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-sm sm:text-lg">{paragraph}</p>
              ))}
              {section.items ? (
                <ul className="grid gap-1 text-sm sm:text-lg">
                  {section.items.map((item) => (
                    <li key={item}>・{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* 関連ページ */}
      <section className="mt-4 -mx-4 rounded-none border-y border-black/20 bg-white/80 px-4 py-4 text-xs text-zinc-600 dark:border-white/10 dark:bg-slate-900/65 dark:text-zinc-300 sm:mx-0 sm:rounded-xl sm:border sm:p-5">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">関連ページ</p>
        <p className="mt-1">サービス利用条件とデータ取扱い方針は以下をご確認ください。</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full hover:shadow-xl">
            <Link href="/terms">利用規約を見る</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full hover:shadow-xl">
            <Link href="/privacy">プライバシーポリシーを見る</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full hover:shadow-xl">
            <Link href="/pricing">料金プランを見る</Link>
          </Button>
        </div>
      </section>
    </PageFrame>
  )
}
