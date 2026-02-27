import { AlertCircle } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { Container } from "@/components/layout/container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchConsolePlanLabel, requireConsoleContext } from "@/app/console/_lib/data"
import { boolBadge } from "@/app/console/_lib/ui"
import { ConsoleNav } from "@/app/console/_components/console-nav"
import { MobileDesktopRecommendModal } from "@/app/console/_components/mobile-desktop-recommend-modal"
import { stopImpersonationAction } from "@/app/sub-domain/actions"

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user, membership, membershipError, impersonation } = await requireConsoleContext()

  if (!membership || membershipError) {
    return (
      <div className="py-10 sm:py-14">
        <Container>
          <Card className="border-amber-300/50 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-600" />
                テナント情報が取得できません
              </CardTitle>
              <CardDescription>
                `supabase/schema.sql` 実行後、必要であれば `supabase/patch-20260224-current-user-tenant-ids-definer.sql` も実行してください。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 dark:text-amber-200">
              <p>ログインユーザー: {user.email}</p>
              <p>エラー: {membershipError?.message ?? "tenant_memberships が空です。"}</p>
              <div className="mt-4">
                <LogoutButton />
              </div>
            </CardContent>
          </Card>
        </Container>
      </div>
    )
  }

  const isEditor = membership.role === "editor"
  const planLabel = await fetchConsolePlanLabel(membership.tenant_id)

  return (
    <div className="relative overflow-x-clip bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_45%,#f7fbff_100%)] py-6 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] sm:py-8">
      <Container className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-black/10 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 lg:sticky lg:top-20">
          <div className="mb-3 border-b border-black/10 pb-3 dark:border-white/10">
            <p className="text-sm font-semibold">knotic console</p>
            <p className="text-xs text-muted-foreground">{membership.tenants?.display_name ?? "-"}</p>
          </div>
          <ConsoleNav />
        </aside>

        <main className="grid gap-4">
          {impersonation?.active ? (
            <Card className="border-amber-300/50 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-200">代理閲覧モード（読み取り専用）</p>
                  <p className="text-amber-800/90 dark:text-amber-300">tenant: {impersonation.tenantId}</p>
                </div>
                <form action={stopImpersonationAction}>
                  <input type="hidden" name="redirect_to" value="/console/overview" />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md border border-amber-500/40 px-3 py-2 text-sm"
                  >
                    代理閲覧を終了
                  </button>
                </form>
              </CardContent>
            </Card>
          ) : null}
          <MobileDesktopRecommendModal />
          <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-muted-foreground">ログイン中</p>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">契約プラン: {planLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                {boolBadge(isEditor, "Editor", "Reader")}
                <LogoutButton />
              </div>
            </CardContent>
          </Card>
          {children}
        </main>
      </Container>
    </div>
  )
}
