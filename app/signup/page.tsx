import { redirect } from "next/navigation"

import { RedirectTargetPicker } from "@/components/auth/redirect-target-picker"
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
    redirect("/console")
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
          <CardContent className="grid gap-4">
            <RedirectTargetPicker />
            <SignupForm />
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
