import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AlertCircle, ShieldCheck } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { Container } from "@/components/layout/container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requirePlatformAdminContext } from "@/app/sub-domain/_lib/data"
import { isPlatformAdminAccessHost } from "@/lib/platform-admin-host"

export default async function SubDomainLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host") ?? ""
  if (!isPlatformAdminAccessHost(host)) {
    redirect("/")
  }

  try {
    const { user, role } = await requirePlatformAdminContext()

    return (
      <div className="relative overflow-x-clip bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f9fafb_100%)] py-6 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_45%,#0a0f1a_100%)] sm:py-8">
        <Container className="grid gap-4">
          <Card className="border-black/10 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="space-y-1">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4" />
                  knotic platform admin
                </p>
                <p className="text-xs text-muted-foreground">{user.email ?? "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">{role}</Badge>
                <LogoutButton />
              </div>
            </CardContent>
          </Card>
          {children}
        </Container>
      </div>
    )
  } catch (error) {
    return (
      <div className="py-10 sm:py-14">
        <Container>
          <Card className="border-amber-300/50 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-600" />
                管理者アクセスが必要です
              </CardTitle>
              <CardDescription>
                `platform_admin_users` に現在ユーザーを登録してください。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 dark:text-amber-200">
              {error instanceof Error ? error.message : "権限確認中にエラーが発生しました。"}
            </CardContent>
          </Card>
        </Container>
      </div>
    )
  }
}

