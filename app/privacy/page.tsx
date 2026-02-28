import { privacyPolicyMeta, privacyPolicySections } from "@/content/privacy-policy"
import Link from "next/link"
import { PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <PageFrame
      eyebrow="Privacy Policy"
      title="プライバシーポリシー"
      description="knotic の契約者および利用者情報の取扱い方針を定めています。内容は法令やサービス変更に応じて更新される場合があります。"
    >
      <section className="-mx-4 rounded-none border-y border-black/10 bg-white/90 px-4 py-6 dark:border-white/10 dark:bg-slate-900/75 sm:mx-0 sm:rounded-2xl sm:border sm:p-8">
        <div className="mb-6 grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <p>施行日: {privacyPolicyMeta.effectiveDate}</p>
          <p>最終改定日: {privacyPolicyMeta.revisedAt}</p>
        </div>

        <div className="grid gap-6">
          {privacyPolicySections.map((section) => (
            <article key={section.id} className="grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-lg">{paragraph}</p>
              ))}
              {section.items ? (
                <ul className="grid gap-1 text-lg">
                  {section.items.map((item) => (
                    <li key={item}>・{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-4 -mx-4 rounded-none border-y border-black/10 bg-white/80 px-4 py-4 text-xs text-zinc-600 dark:border-white/10 dark:bg-slate-900/65 dark:text-zinc-300 sm:mx-0 sm:rounded-xl sm:border sm:p-5">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">関連ページ</p>
        <p className="mt-1">サービス利用条件は利用規約をご確認ください。</p>
        <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
          <Link href="/terms">利用規約を見る</Link>
        </Button>
      </section>
    </PageFrame>
  )
}
