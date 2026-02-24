import { PageFrame } from "@/components/marketing/page-frame"

export default function PrivacyPage() {
  return (
    <PageFrame
      eyebrow="Privacy Policy"
      title="プライバシーポリシー（ドラフト）"
      description="正式公開前のドラフト版です。収集情報、利用目的、保存期間、問い合わせ窓口などを法務確認後に確定します。"
    >
      <section className="rounded-2xl border border-black/10 bg-white/90 p-6 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-slate-900/75 dark:text-zinc-300 sm:p-8">
        <p>1. 取得する情報: アカウント情報、利用ログ、問い合わせ内容など。</p>
        <p>2. 利用目的: サービス提供、品質改善、サポート対応、不正防止。</p>
        <p>3. 保持期間: 目的達成に必要な範囲で保持し、不要データは削除。</p>
        <p>4. 第三者提供: 法令に基づく場合等を除き、同意なく提供しません。</p>
        <p>5. 改定: 本ポリシーは必要に応じて更新する場合があります。</p>
      </section>
    </PageFrame>
  )
}
