import Link from "next/link"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const securityTopics = [
  {
    title: "テナント境界の徹底",
    description: "`tenant_id` / `bot_id` を前提に、データ取得・検索・回答で境界を強制します。",
  },
  {
    title: "公開トークンの最小権限化",
    description: "Widget用トークンはチャット用途に限定し、管理権限を持たせません。",
  },
  {
    title: "入力検証",
    description: "アップロードサイズ制限・MIMEチェック・不正入力対策を標準実装します。",
  },
  {
    title: "ログと機密情報",
    description: "運用ログは最小限にし、PIIのマスクや保持期間管理を行う方針です。",
  },
]

export default function SecurityPage() {
  return (
    <PageFrame
      eyebrow="Security"
      title="ビジネス利用を前提としたセキュリティ設計"
      description="MVP段階から、テナント分離・トークン管理・ログ管理を設計に組み込み、運用時のリスクを下げます。"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {securityTopics.map((item) => (
          <Card key={item.title} className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{item.description}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">関連ページ</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/privacy">プライバシーポリシー</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/terms">利用規約</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">セキュリティ相談</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
