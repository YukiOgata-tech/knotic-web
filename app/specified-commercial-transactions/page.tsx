import Link from "next/link"

import { PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { commercialLawItems, commercialLawMeta } from "@/content/specified-commercial-transactions"

export default function SpecifiedCommercialTransactionsPage() {
  return (
    <PageFrame
      eyebrow="Legal"
      title="特定商取引法に基づく表記"
      description="特定商取引法に基づく表示事項を掲載しています。"
    >
      <section className="rounded-2xl border border-black/10 bg-white/90 p-6 dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
        <div className="mb-6 grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <p>施行日: {commercialLawMeta.effectiveDate}</p>
          <p>最終改定日: {commercialLawMeta.revisedAt}</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <dl className="divide-y divide-black/10 dark:divide-white/10">
            {commercialLawItems.map((item) => (
              <div key={item.label} className="grid gap-2 p-4 sm:grid-cols-[220px_1fr] sm:gap-4 sm:p-5">
                <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.label}</dt>
                <dd className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-black/10 bg-white/80 p-4 text-xs text-zinc-600 dark:border-white/10 dark:bg-slate-900/65 dark:text-zinc-300 sm:p-5">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">関連ページ</p>
        <p className="mt-1">サービス利用条件とデータ取扱い方針は以下をご確認ください。</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/terms">利用規約を見る</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/privacy">プライバシーポリシーを見る</Link>
          </Button>
        </div>
      </section>
    </PageFrame>
  )
}
