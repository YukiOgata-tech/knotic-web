"use client"
/** テーマ切り替えボタン(light/dark/default) */
import * as React from "react"
import { MonitorCog, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // widget iframe として埋め込まれている場合のみ位置を変更
  const isWidgetEmbed =
    pathname.startsWith("/chat-by-knotic/") &&
    searchParams.get("embed") === "1"

  // widget embed 時: ヘッダー直下に浮かせる（右上）
  // 通常時: 右下固定
  const btnClass = isWidgetEmbed
    ? "fixed right-2 top-[58px] z-50 rounded-full shadow-md"
    : "fixed right-4 bottom-4 z-50 rounded-full shadow-md"

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        className={btnClass}
        aria-label="テーマ切替"
      >
        <Sun className="size-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className={btnClass}
          aria-label="テーマ切替"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={isWidgetEmbed ? "bottom" : "top"} className="mb-2">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="size-4" />
          ライト
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="size-4" />
          ダーク
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <MonitorCog className="size-4" />
          システム
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
