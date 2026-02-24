import Link from "next/link"

import { PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  return (
    <PageFrame
      eyebrow="Signup"
      title="無料トライアルを開始"
      description="正式な認証実装前の仮画面です。導線・入力項目・遷移設計の確認用として利用します。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>アカウント作成</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" placeholder="8文字以上" />
            </div>
            <Button className="rounded-full">無料で始める（仮）</Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/login">既にアカウントをお持ちの方はこちら</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
