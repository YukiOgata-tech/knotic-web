"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

export function RedirectTargetPicker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentNext = searchParams.get("next") ?? "/console"

  const toConsole = `${pathname}?next=/console`
  const toHome = `${pathname}?next=/`

  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-black/15 p-3 text-sm dark:border-white/20">
      <p className="text-muted-foreground">ログイン後の遷移先</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant={currentNext === "/console" ? "default" : "outline"} className="rounded-full">
          <Link href={toConsole}>管理画面へ</Link>
        </Button>
        <Button asChild size="sm" variant={currentNext === "/" ? "default" : "outline"} className="rounded-full">
          <Link href={toHome}>トップページへ</Link>
        </Button>
      </div>
    </div>
  )
}
