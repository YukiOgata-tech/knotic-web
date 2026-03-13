"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, ClipboardList, LayoutDashboard, ScrollText, Settings2, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/sub-domain",
    label: "ダッシュボード",
    icon: LayoutDashboard,
    isActive: (p) =>
      p === "/sub-domain" ||
      (p.startsWith("/sub-domain/tenants/") && p !== "/sub-domain/tenants/new"),
  },
  {
    href: "/sub-domain/tenants/new",
    label: "テナント作成",
    icon: UserPlus,
    isActive: (p) => p === "/sub-domain/tenants/new",
  },
  {
    href: "/sub-domain/audit-logs",
    label: "監査ログ",
    icon: ScrollText,
    isActive: (p) => p.startsWith("/sub-domain/audit-logs"),
  },
  {
    href: "/sub-domain/indexing-jobs",
    label: "インデックスジョブ",
    icon: ClipboardList,
    isActive: (p) => p.startsWith("/sub-domain/indexing-jobs"),
  },
  {
    href: "/sub-domain/plans",
    label: "プラン管理",
    icon: Settings2,
    isActive: (p) => p.startsWith("/sub-domain/plans"),
  },
  {
    href: "/sub-domain/docs",
    label: "運用ドキュメント",
    icon: BookOpen,
    isActive: (p) => p.startsWith("/sub-domain/docs"),
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-amber-500/15 text-amber-400"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
