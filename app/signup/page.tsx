import { redirect } from "next/navigation"

import { SignupForm } from "@/components/auth/signup-form"
import { PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function SignupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/app")
  }

  return (
    <PageFrame
      eyebrow="Signup"
      title="アカウント登録してAI構築を開始"
      description="登録完了後すぐに、URL/PDFを投入して最初のAIチャットボット構築を開始できます。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>アカウント作成</CardTitle>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
