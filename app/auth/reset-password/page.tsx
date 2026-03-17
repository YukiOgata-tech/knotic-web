import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = buildMarketingMetadata({
  title: "新しいパスワードの設定",
  description: "新しいパスワードを設定します。",
  path: "/auth/reset-password",
  noIndex: true,
})

export default async function ResetPasswordPage() {
  // コールバックでセッションが確立済みであることを確認
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/forgot-password?error=リンクの有効期限が切れています。再度お試しください。")
  }

  return (
    <PageFrame
      eyebrow="Password Reset"
      title="新しいパスワードを設定"
      description="新しいパスワードを入力してください。設定完了後、管理画面に移動します。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>新しいパスワード</CardTitle>
            <CardDescription>8文字以上で入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
