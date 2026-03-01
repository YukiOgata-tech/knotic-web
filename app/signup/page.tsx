import { redirect } from "next/navigation"
import Link from "next/link"

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
      title="テナントオーナーとしてアカウント作成"
      description="この登録は契約者（オーナー）向けです。作成後、管理コンソールからBot設定やメンバー招待を管理できます。"
    >
      <section className="mx-auto max-w-xl">
        <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/75">
          <CardHeader>
            <CardTitle>オーナーアカウント作成</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RedirectTargetPicker />
            <SignupForm mode="owner" />
            <p className="text-xs text-muted-foreground">
              既存テナントへ参加するだけの場合は{" "}
              <Link href="/signup-user" className="underline underline-offset-4">
                knoticユーザーアカウント作成
              </Link>{" "}
              を利用してください。
            </p>
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}
