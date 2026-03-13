"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Bot, CreditCard, LayoutDashboard, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const TABS = [
  { value: "overview",  label: "概要",      icon: LayoutDashboard },
  { value: "billing",   label: "契約・請求", icon: CreditCard },
  { value: "members",   label: "メンバー",   icon: Users },
  { value: "bots",      label: "Bot管理",    icon: Bot },
] as const

type Props = {
  tenantId: string
  current: string
}

export function TenantTabNav({ tenantId, current }: Props) {
  const searchParams = useSearchParams()

  function tabHref(value: string) {
    const qs = new URLSearchParams(searchParams.toString())
    qs.set("tab", value)
    // notice/error はタブ切替時にクリア
    qs.delete("notice")
    qs.delete("error")
    return `/sub-domain/tenants/${tenantId}?${qs.toString()}`
  }

  return (
    <div className="flex gap-0 overflow-x-auto border-b border-black/10 dark:border-white/10">
      {TABS.map((tab) => {
        const active = current === tab.value
        const Icon = tab.icon
        return (
          <Link
            key={tab.value}
            href={tabHref(tab.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
