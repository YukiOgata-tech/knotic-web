import Link from "next/link"

import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  return (
    <PageFrame
      eyebrow="Contact"
      title="お問い合わせ"
      description="導入相談、プラン相談、連携要件の確認などを受け付けています。まずは要件の概要から共有してください。"
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>相談フォーム</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">お名前</Label>
              <Input id="name" placeholder="山田 太郎" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">会社名</Label>
              <Input id="company" placeholder="株式会社サンプル" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">お問い合わせ内容</Label>
              <Textarea
                id="message"
                placeholder="導入目的、対象データ、希望開始時期などを記載してください。"
              />
            </div>
            <Button className="rounded-full">送信する（仮）</Button>
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>相談前に確認できるページ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <Link href="/pricing" className="rounded-lg border border-black/10 px-3 py-2 hover:bg-muted dark:border-white/10">
              料金プラン
            </Link>
            <Link href="/use-cases" className="rounded-lg border border-black/10 px-3 py-2 hover:bg-muted dark:border-white/10">
              活用例
            </Link>
            <Link href="/integrations" className="rounded-lg border border-black/10 px-3 py-2 hover:bg-muted dark:border-white/10">
              連携
            </Link>
            <Link href="/security" className="rounded-lg border border-black/10 px-3 py-2 hover:bg-muted dark:border-white/10">
              セキュリティ
            </Link>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
