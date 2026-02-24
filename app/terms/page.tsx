import { PageFrame } from "@/components/marketing/page-frame"

export default function TermsPage() {
  return (
    <PageFrame
      eyebrow="Terms"
      title="利用規約（ドラフト）"
      description="正式公開前のドラフト版です。禁止事項、免責、契約期間、解約条件などを最終確定予定です。"
    >
      <section className="rounded-2xl border border-black/10 bg-white/90 p-6 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-slate-900/75 dark:text-zinc-300 sm:p-8">
        <p>1. 本サービスは、規約に同意した利用者に提供します。</p>
        <p>2. 利用者は、法令違反または第三者の権利侵害となる利用を行ってはなりません。</p>
        <p>3. サービス内容は改善のため変更される場合があります。</p>
        <p>4. 当社は、故意または重過失を除き、利用に伴う損害を保証しません。</p>
        <p>5. 本規約に関する準拠法・裁判管轄は別途定めます。</p>
      </section>
    </PageFrame>
  )
}
