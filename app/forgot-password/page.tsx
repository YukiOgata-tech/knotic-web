import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "パスワード再設定",
  description: "登録済みメールアドレスにパスワード再設定用URLを送信します。",
  path: "/forgot-password",
  noIndex: true,
})

export default function ForgotPasswordPage() {
  return (
    <PageFrame
      eyebrow="Password Reset"
      title="パスワードをお忘れですか？"
      description="登録済みのメールアドレスを入力してください。パスワード再設定用のURLをお送りします。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>パスワード再設定</CardTitle>
            <CardDescription>メールアドレスにリンクを送信します</CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
