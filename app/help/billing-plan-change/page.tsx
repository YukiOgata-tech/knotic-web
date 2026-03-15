import type { Metadata } from "next"
import Link from "next/link"

import { PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "プラン変更と請求の仕様",
  description:
    "knoticのプラン変更時における課金タイミング、日割り請求、次回更新日反映、解約時の取り扱いを利用者向けに説明します。",
  path: "/help/billing-plan-change",
  keywords: ["knotic 請求", "プラン変更", "アップグレード", "ダウングレード", "日割り課金"],
})

export default function BillingPlanChangeHelpPage() {
  return (
    <PageFrame
      eyebrow="Billing Help"
      title="プラン変更と請求の仕様"
      description="プラン変更は契約内容と請求金額に関わる操作です。本ページでは、管理画面の実際の処理仕様に基づき、適用タイミングと課金設計を説明します。"
    >
      <section className="-mx-4 grid gap-4 px-4 sm:mx-0 sm:px-0">
        <article className="rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-5 dark:sm:border-white/10 dark:sm:bg-slate-900/70">
          <h2 className="text-lg font-semibold">1. 変更操作の前提</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            プラン変更は、管理画面の「請求・プラン」から実行します。実行権限は Editor ロールに限定されます。
            変更操作は Stripe 側のサブスクリプション情報に反映され、同一の顧客情報・同一の支払い方法を継続して利用します。
          </p>
        </article>

        <article className="rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-5 dark:sm:border-white/10 dark:sm:bg-slate-900/70">
          <h2 className="text-lg font-semibold">2. アップグレード時の課金</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            例: Lite から Standard への変更。
            アップグレードは即時反映されます。差額は日割りで計算され、追加請求として処理されます。
            次回請求日は維持され、請求サイクルの起点日は変更されません。
          </p>
          <div className="mt-3 rounded-md border border-cyan-300/60 bg-cyan-50/70 px-3 py-2 text-xs text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-950/25 dark:text-cyan-200">
            即時反映の対象は機能上限（Bot数・Hosted利用可否・API利用可否など）です。
          </div>
        </article>

        <article className="rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-5 dark:sm:border-white/10 dark:sm:bg-slate-900/70">
          <h2 className="text-lg font-semibold">3. ダウングレード時の課金</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            例: Standard から Lite への変更。
            ダウングレードは当日即時ではなく、次回更新日から反映されます。
            現在の請求期間中の返金はありません。次回更新日以降に新プランの上限が適用されます。
          </p>
          <div className="mt-3 rounded-md border border-amber-300/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/25 dark:text-amber-200">
            次回更新日時点で上限を超過している場合、新規作成・追加・再インデックス・Hosted公開など一部操作が停止される設計です。
          </div>
        </article>

        <article className="rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-5 dark:sm:border-white/10 dark:sm:bg-slate-900/70">
          <h2 className="text-lg font-semibold">4. 支払い情報の更新と失敗時対応</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            支払い方法の更新、請求書確認、再請求対応は Customer Portal から行います。
            決済失敗時は管理画面に警告が表示され、カード更新後に支払い状態が回復すると契約状態も追従します。
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            Webhook反映の遅延が発生した場合は、管理画面の「Webhook再同期を実行」で未反映イベントを再処理できます。
          </p>
        </article>

        <article className="rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-5 dark:sm:border-white/10 dark:sm:bg-slate-900/70">
          <h2 className="text-lg font-semibold">5. 関連ドキュメント</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/specified-commercial-transactions"
              className="rounded-full border border-black/20 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-white/15 dark:hover:bg-slate-800"
            >
              特定商取引法に基づく表記
            </Link>
            <Link
              href="/help/widget"
              className="rounded-full border border-black/20 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-white/15 dark:hover:bg-slate-800"
            >
              Widget 利用ガイド
            </Link>
          </div>
        </article>
      </section>
    </PageFrame>
  )
}
