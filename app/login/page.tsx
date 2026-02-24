import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/login-form"
import { PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/app")
  }

  return (
    <PageFrame
      eyebrow="Login"
      title="ログインしてAI構築を再開"
      description="作成中のAIボット管理画面に入り、ナレッジ追加や公開設定を続けられます。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>サインイン</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
