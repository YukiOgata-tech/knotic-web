import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"

import { requirePlatformAdminContext } from "@/app/sub-domain/_lib/data"
import { AdminNav } from "@/app/sub-domain/_components/admin-nav"
import { AdminMobileNav } from "@/app/sub-domain/_components/admin-mobile-nav"
import { AdminLogoutButton } from "@/app/sub-domain/_components/admin-logout-button"
import { isPlatformAdminAccessHost } from "@/lib/platform-admin-host"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Platform Admin",
  description: "knotic platform admin console",
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

export default async function SubDomainLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host") ?? ""
  if (!isPlatformAdminAccessHost(host)) {
    redirect("/")
  }

  try {
    const { user, role } = await requirePlatformAdminContext()

    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* ── デスクトップサイドバー ── */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-slate-950 lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          {/* ブランド */}
          <div className="border-b border-white/10 px-4 py-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-amber-400" />
              <span className="text-sm font-bold tracking-tight text-amber-400">knotic admin</span>
            </div>
            <p className="mt-2 truncate text-xs text-slate-400">{user.email ?? "-"}</p>
            <Badge
              variant="outline"
              className="mt-1.5 border-amber-500/40 text-[10px] text-amber-400"
            >
              {role}
            </Badge>
          </div>

          {/* ナビゲーション */}
          <div className="flex-1 overflow-y-auto p-3">
            <AdminNav />
          </div>

          {/* フッター */}
          <div className="border-t border-white/10 p-3">
            <AdminLogoutButton />
          </div>
        </aside>

        {/* ── コンテンツエリア ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* モバイルナビ */}
          <AdminMobileNav adminEmail={user.email ?? "-"} role={role} />

          {/* メインコンテンツ */}
          <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
    )
  } catch {
    redirect("/sub-domain/login")
  }
}
