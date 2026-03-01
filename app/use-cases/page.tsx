import { UseCasesShowcase } from "@/components/marketing/use-cases-showcase"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"

export default function UseCasesPage() {
  return (
    <PageFrame
      eyebrow="Use Cases"
      title="どんな用途に使えるか、実例で確認する"
      description="問い合わせ対応・マニュアル案内・社内ナレッジ共有・オンボーディング支援の4用途が代表的です。まずは1つに絞ってスタートし、効果を見ながら段階的に展開できます。"
    >
      <UseCasesShowcase />

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
