import Link from "next/link"

import { PageFrame } from "@/components/marketing/page-frame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <PageFrame
      eyebrow="Login"
      title="ログイン"
      description="認証実装前の仮画面です。管理画面導線の確認用として配置しています。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>サインイン</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" placeholder="********" />
            </div>
            <Button className="rounded-full">ログイン（仮）</Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/signup">アカウント作成はこちら</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
