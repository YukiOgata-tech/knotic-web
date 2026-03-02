"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BarChart3,
  Bot,
  CreditCard,
  KeyRound,
  Menu,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/console/overview",   label: "概要",      icon: BarChart3 },
  { href: "/console/operations", label: "運用",      icon: Activity },
  { href: "/console/bots",       label: "Bot管理",   icon: Bot },
  { href: "/console/api-keys",   label: "APIキー",   icon: KeyRound },
  { href: "/console/billing",    label: "請求・プラン", icon: CreditCard },
  { href: "/console/audit",      label: "監査ログ",  icon: ShieldCheck },
  { href: "/console/members",    label: "メンバー",  icon: Users },
  { href: "/console/settings",   label: "設定",      icon: Settings2 },
]

// ボトムバーに表示する5項目
const BOTTOM_ITEMS = [
  { href: "/console/overview",   label: "概要",   icon: BarChart3 },
  { href: "/console/bots",       label: "Bot",    icon: Bot },
  { href: "/console/operations", label: "運用",   icon: Activity },
  { href: "/console/billing",    label: "請求",   icon: CreditCard },
  { href: "/console/settings",   label: "設定",   icon: Settings2 },
]

type Props = {
  orgName: string
  planLabel: string
}

export function ConsoleMobileNav({ orgName, planLabel }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  // ルート変更でドロワーを閉じる
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  // ドロワー開閉時のスクロールロック
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* ── モバイルトップバー ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/15 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden dark:border-white/10 dark:bg-slate-900/95">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none">knotic console</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {orgName}
            {planLabel ? <span className="ml-1 opacity-60">· {planLabel}</span> : null}
          </p>
        </div>
        <button
          type="button"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setOpen((v) => !v)}
          className="ml-3 shrink-0 rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* ── ドロワーオーバーレイ ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 背景クリックで閉じる */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* ドロワー本体 */}
          <div className="absolute bottom-0 left-0 top-0 w-72 overflow-y-auto bg-white shadow-2xl dark:bg-slate-900">
            {/* ドロワーヘッダー */}
            <div className="flex items-start justify-between border-b border-black/10 px-4 py-4 dark:border-white/10">
              <div>
                <p className="text-sm font-semibold">knotic console</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{orgName}</p>
                {planLabel ? (
                  <p className="text-xs text-muted-foreground">プラン: {planLabel}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* ナビゲーション */}
            <nav className="grid gap-0.5 p-3">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ── ボトムタブバー ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/15 bg-white/95 pb-safe backdrop-blur-sm lg:hidden dark:border-white/10 dark:bg-slate-900/95">
        <div className="flex">
          {BOTTOM_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
