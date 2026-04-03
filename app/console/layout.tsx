import type { Metadata } from "next"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { Container } from "@/components/layout/container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchConsolePlanLabel, requireConsoleContext } from "@/app/console/_lib/data"
import { boolBadge } from "@/app/console/_lib/ui"
import { ConsoleNav } from "@/app/console/_components/console-nav"
import { ConsoleMobileNav } from "@/app/console/_components/console-mobile-nav"
import { MobileDesktopRecommendModal } from "@/app/console/_components/mobile-desktop-recommend-modal"
import { TenantSwitcherButton } from "@/app/console/_components/tenant-switcher-button"
import { stopImpersonationAction } from "@/app/sub-domain/actions"
import { createTenantWorkspaceAction } from "@/app/console/actions"
import { InviteJoinForm } from "@/app/console/_components/invite-join-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Console",
  description: "knotic 管理コンソール",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user, membership, allMemberships, membershipError, impersonation } = await requireConsoleContext()

  if (!membership || membershipError) {
    return (
      <div className="py-10 sm:py-14">
        <Container>
          <Card className="border-amber-300/50 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-600" />
                利用開始の設定をしてください
              </CardTitle>
              <CardDescription>このアカウントはまだテナント未所属です。以下から開始方法を選んでください。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-amber-900 dark:text-amber-200">
              <p>ログインユーザー: {user.email}</p>
              <div className="grid gap-2 rounded-lg border border-amber-300/60 bg-white/70 p-3 dark:border-amber-500/35 dark:bg-slate-900/40">
                <p className="font-medium">1) テナントを新規作成（オーナー開始）</p>
                <form action={createTenantWorkspaceAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="redirect_to" value="/console/overview" />
                  <Input
                    name="display_name"
                    required
                    placeholder="会社名 / 組織名"
                    className="max-w-sm bg-white dark:bg-slate-900"
                  />
                  <Button type="submit" className="rounded-full">
                    テナント作成
                  </Button>
                </form>
              </div>
              <div className="grid gap-2 rounded-lg border border-amber-300/60 bg-white/70 p-3 dark:border-amber-500/35 dark:bg-slate-900/40">
                <p className="font-medium">2) 招待リンクで参加</p>
                <InviteJoinForm />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  受け取った招待URLがある場合は、そのまま開いても参加できます。
                </p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Link href="/" className="text-sm underline underline-offset-4">
                  トップへ戻る
                </Link>
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
    <div className="relative overflow-x-clip bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_45%,#f7fbff_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] lg:py-8">
      <ConsoleMobileNav
        orgName={membership.tenants?.display_name ?? "-"}
        planLabel={planLabel}
      />
      <Container size="full" className="grid gap-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-0">
        <aside className="hidden h-fit rounded-xl border border-black/20 bg-white/90 p-3 dark:border-white/10 dark:bg-slate-900/80 lg:block lg:sticky lg:top-20">
          <div className="mb-3 border-b border-black/20 pb-3 dark:border-white/10">
            <p className="text-sm font-semibold">knotic console</p>
            <p className="text-xs text-muted-foreground">{membership.tenants?.display_name ?? "-"}</p>
            <p className="text-xs text-muted-foreground">プラン: {planLabel}</p>
          </div>
          <ConsoleNav />
          {!impersonation?.active && (
            <div className="border-t border-black/20 pt-3 dark:border-white/10">
              <TenantSwitcherButton
                currentTenantId={membership.tenant_id}
                memberships={allMemberships}
              />
            </div>
          )}
        </aside>

        <main className="grid gap-4 pb-24 lg:pb-0">
          {impersonation?.active ? (
            <Card className="border-amber-300/50 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-200">閲覧モード（閲覧専用）</p>
                  <p className="text-amber-800/90 dark:text-amber-300">tenant: {impersonation.tenantId}</p>
                </div>
                <form action={stopImpersonationAction}>
                  <input type="hidden" name="redirect_to" value="/console/overview" />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md border border-amber-500/40 px-3 py-2 text-sm"
                  >
                    閲覧を終了
                  </button>
                </form>
              </CardContent>
            </Card>
          ) : null}
          <MobileDesktopRecommendModal />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/20 bg-white/90 px-4 py-2.5 dark:border-white/10 dark:bg-slate-900/80">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-x-2">
              {boolBadge(isEditor, "Editor", "Reader")}
              <LogoutButton />
            </div>
          </div>
          {children}
        </main>
      </Container>
    </div>
  )
}
