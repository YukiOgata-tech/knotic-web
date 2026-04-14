"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Menu,
  ScrollText,
  Settings2,
  ShieldCheck,
  Tag,
  UserPlus,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { AdminLogoutButton } from "@/app/sub-domain/_components/admin-logout-button"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  isActive: (pathname: string) => boolean
}

type TabItem = NavItem & { shortLabel: string }

/** ドロワー用：全ナビ項目 */
const ALL_NAV_ITEMS: NavItem[] = [
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
    href: "/sub-domain/notifications",
    label: "テナント通知",
    icon: Bell,
    isActive: (p) => p.startsWith("/sub-domain/notifications"),
  },
  {
    href: "/sub-domain/billing-events",
    label: "支払いイベント",
    icon: CreditCard,
    isActive: (p) => p.startsWith("/sub-domain/billing-events"),
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
    href: "/sub-domain/promo-codes",
    label: "招待コード管理",
    icon: Tag,
    isActive: (p) => p.startsWith("/sub-domain/promo-codes"),
  },
  {
    href: "/sub-domain/docs",
    label: "運用ドキュメント",
    icon: BookOpen,
    isActive: (p) => p.startsWith("/sub-domain/docs"),
  },
]

/** ボトムタブ用：最重要5項目のみ・短縮ラベル付き */
const TAB_ITEMS: TabItem[] = [
  { ...ALL_NAV_ITEMS[0], shortLabel: "ホーム" },
  { ...ALL_NAV_ITEMS[2], shortLabel: "通知" },
  { ...ALL_NAV_ITEMS[3], shortLabel: "支払い" },
  { ...ALL_NAV_ITEMS[5], shortLabel: "ジョブ" },
  { ...ALL_NAV_ITEMS[4], shortLabel: "ログ" },
]

type Props = {
  adminEmail: string
  role: string
}

export function AdminMobileNav({ adminEmail, role }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* モバイルトップバー */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-400">knotic admin</span>
        </div>
        <button
          type="button"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* ドロワー（全項目） */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 top-0 w-64 overflow-y-auto bg-slate-950 shadow-2xl">
            {/* ドロワーヘッダー */}
            <div className="flex items-start justify-between border-b border-white/10 px-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">knotic admin</span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">{adminEmail}</p>
                <span className="mt-1 inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  {role}
                </span>
              </div>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 全ナビゲーション */}
            <nav className="grid gap-0.5 p-2">
              {ALL_NAV_ITEMS.map((item) => {
                const active = item.isActive(pathname)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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

            {/* ログアウト */}
            <div className="border-t border-white/10 p-3">
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* ボトムタブバー（5項目固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/95 pb-safe backdrop-blur-sm lg:hidden">
        <div className="flex">
          {TAB_ITEMS.map((item) => {
            const active = item.isActive(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Icon
                  className={cn("size-5 transition-transform", active && "scale-110")}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                <span className="leading-none">{item.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
