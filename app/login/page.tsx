import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/login-form"
import { RedirectTargetPicker } from "@/components/auth/redirect-target-picker"
import { PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = buildMarketingMetadata({
  title: "ログイン",
  description: "knotic管理画面へログインします。",
  path: "/login",
  noIndex: true,
})

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/console")
  }

  return (
    <PageFrame
      eyebrow="Login"
      title="ログインしてAI構築を再開"
      description="作成中のAIボット管理画面に入り、ナレッジ追加や公開設定を続けられます。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>サインイン</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RedirectTargetPicker />
            <LoginForm />
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
