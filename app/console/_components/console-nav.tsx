"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Bot, CreditCard, KeyRound, Settings2, ShieldCheck, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/console/overview", label: "Overview", icon: BarChart3 },
  { href: "/console/operations", label: "Operations", icon: Activity },
  { href: "/console/bots", label: "Bots", icon: Bot },
  { href: "/console/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/console/billing", label: "Billing", icon: CreditCard },
  { href: "/console/audit", label: "Audit", icon: ShieldCheck },
  { href: "/console/members", label: "Members", icon: Users },
  { href: "/console/settings", label: "Settings", icon: Settings2 },
]

export function ConsoleNav() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
