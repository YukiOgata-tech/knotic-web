import type { Metadata } from "next"
import Link from "next/link"
import { FileCheck2, KeyRound, LifeBuoy, ShieldCheck } from "lucide-react"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import {
  securityChecklist,
  securityHighlights,
  securityMeta,
  securityNotes,
  securitySections,
} from "@/content/security"
import { Button } from "@/components/ui/button"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: securityMeta.title,
  description: securityMeta.description,
  path: "/security",
  keywords: ["knotic セキュリティ", "RLS", "APIキー管理", "監査ログ", "Widgetオリジン制限"],
})

const iconBySectionId: Record<string, typeof ShieldCheck> = {
  "access-control": ShieldCheck,
  "token-management": KeyRound,
  "input-validation": FileCheck2,
  "audit-ops": ShieldCheck,
  "abuse-control": ShieldCheck,
  billing: KeyRound,
  "chat-data": ShieldCheck,
}

export default function SecurityPage() {
  return (
    <PageFrame
      eyebrow="Security"
      title="セキュリティ情報"
      description="knoticで実装済みのセキュリティ対策を公開しています。運用時の設定チェック項目もあわせてご確認ください。"
    >
      <section className="-mx-4 rounded-none border-y border-black/20 bg-white/90 px-4 py-5 dark:border-white/10 dark:bg-slate-900/75 sm:mx-0 sm:rounded-2xl sm:border sm:p-6">
        <div className="mb-4 grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <p>施行日: {securityMeta.effectiveDate}</p>
          <p>最終改定日: {securityMeta.revisedAt}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {securityHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-black/15 bg-white/85 px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/70"
            >
              <p className="text-[11px] font-medium tracking-wide text-cyan-700 dark:text-cyan-300">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold">{item.value}</p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-600 dark:text-zinc-300">
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 mt-5 border-y border-black/20 bg-white/85 px-4 py-4 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:mt-6 sm:rounded-2xl sm:border sm:px-6 sm:py-6">
        <div className="grid gap-4">
        {securitySections.map((section) => {
          const Icon = iconBySectionId[section.id] ?? ShieldCheck
          return (
            <article
              key={section.id}
              className="border-b border-black/15 pb-4 last:border-b-0 last:pb-0 dark:border-white/10"
            >
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-600/25 px-2.5 py-1 text-[11px] font-semibold text-cyan-800 dark:border-cyan-300/30 dark:text-cyan-200">
                <Icon className="size-3.5" />
                実装項目
              </div>
              <h2 className="mt-2 text-base font-semibold tracking-tight sm:text-xl">{section.title}</h2>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-300 sm:text-sm sm:leading-7">
                {section.summary}
              </p>
              <ul className="mt-2 grid gap-1.5 text-[13px] leading-6 text-zinc-700 dark:text-zinc-200 sm:text-sm sm:leading-7">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-cyan-600 dark:bg-cyan-300" />
                      <span className="break-words">{item}</span>
                    </li>
                  ))}
              </ul>
            </article>
          )
        })}
        </div>
      </section>

      <section className="-mx-4 mt-5 rounded-none border-y border-black/20 bg-white/85 px-4 py-5 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:mt-6 sm:rounded-2xl sm:border sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">運用チェックリスト</h2>
        <ul className="mt-3 grid gap-2 text-[13px] leading-6 text-zinc-700 dark:text-zinc-200 sm:text-sm sm:leading-7">
          {securityChecklist.map((item) => (
            <li key={item.title} className="flex items-start gap-2 border-b border-black/10 pb-2 last:border-b-0 last:pb-0 dark:border-white/10">
              <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-cyan-600 dark:bg-cyan-300" />
              <span className="break-words">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</span>
                <span className="text-zinc-600 dark:text-zinc-300">: {item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="-mx-4 mt-5 rounded-none border-y border-black/20 bg-white/80 px-4 py-5 dark:border-white/10 dark:bg-slate-900/65 sm:mx-0 sm:mt-6 sm:rounded-2xl sm:border sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">補足事項</h2>
        <ul className="mt-3 grid gap-2 text-[13px] leading-6 text-zinc-600 dark:text-zinc-300 sm:text-sm sm:leading-7">
          {securityNotes.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-zinc-500 dark:bg-zinc-300" />
              <span className="break-words">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="-mx-4 mt-5 rounded-none border-y border-black/20 bg-white/80 px-4 py-5 dark:border-white/10 dark:bg-slate-900/70 sm:mx-0 sm:mt-6 sm:rounded-2xl sm:border sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">関連ページ</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/privacy">プライバシーポリシー</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/terms">利用規約</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/help">利用者ドキュメント</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact" className="inline-flex items-center gap-1.5">
              <LifeBuoy className="size-4" />
              セキュリティ相談
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
