import { redirect } from "next/navigation"

import { LogoutButton } from "@/components/auth/logout-button"
import { Container } from "@/components/layout/container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type MembershipRow = {
  role: "owner" | "admin" | "member" | "viewer"
  tenants: {
    id: string
    slug: string
    display_name: string
  } | null
}

export default async function AppPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/app")
  }

  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("role, tenants(id, slug, display_name)")
    .eq("user_id", user.id)
    .eq("is_active", true)

  const primaryMembership = (memberships?.[0] as MembershipRow | undefined) ?? null

  return (
    <div className="relative overflow-x-clip bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_45%,#f7fbff_100%)] py-10 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] sm:py-14">
      <Container className="grid gap-6">
        <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-2xl">管理コンソール（初期）</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-zinc-600 dark:text-zinc-300">
            <p>ログイン済みユーザー: {user.email}</p>
            <p>ユーザーID: {user.id}</p>
            {primaryMembership?.tenants ? (
              <>
                <p>テナント: {primaryMembership.tenants.display_name}</p>
                <p>テナントSlug: {primaryMembership.tenants.slug}</p>
                <p>権限: {primaryMembership.role}</p>
              </>
            ) : (
              <p className="text-amber-700 dark:text-amber-400">
                テナント所属情報が取得できませんでした。`supabase/schema.sql` を適用済みか確認してください。
              </p>
            )}
            <div className="pt-2">
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  )
}
