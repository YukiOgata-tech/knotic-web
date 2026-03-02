import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { RedirectTargetPicker } from "@/components/auth/redirect-target-picker"
import { SignupForm } from "@/components/auth/signup-form"
import { PageFrame } from "@/components/marketing/page-frame"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = buildMarketingMetadata({
  title: "ユーザーアカウント作成",
  description: "既存テナント参加向けのknoticユーザーアカウント作成ページです。",
  path: "/signup-user",
  noIndex: true,
})

export default async function SignupUserPage() {
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
      title="knoticユーザーアカウント作成"
      description="既存テナントへの参加向けアカウントです。ログイン後に、テナント新規作成または招待参加を選択できます。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>knoticユーザー作成</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RedirectTargetPicker />
            <SignupForm mode="member" />
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
