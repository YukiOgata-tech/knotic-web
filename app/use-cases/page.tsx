import { UseCasesShowcase } from "@/components/marketing/use-cases-showcase"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"

export default function UseCasesPage() {
  return (
    <PageFrame
      eyebrow="Use Cases"
      title="成果が見えやすい活用例から始める"
      description="主用途は、Web問い合わせ対応とマニュアル案内です。運用が定着した後に、社内教育や規約監査の一次チェック支援へ段階的に展開できます。"
    >
      <UseCasesShowcase />

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
