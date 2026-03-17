"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type ExportState = "idle" | "loading" | "done" | "error"

type Props = {
  action?: string
  targetType?: string
}

export function AuditExportButton({ action, targetType }: Props) {
  const [state, setState] = React.useState<ExportState>("idle")

  async function handleExport() {
    if (state === "loading") return
    setState("loading")

    try {
      const params = new URLSearchParams()
      if (action) params.set("action", action)
      if (targetType) params.set("target_type", targetType)

      const res = await fetch(`/api/console/audit-export?${params.toString()}`)
      if (!res.ok) throw new Error("export failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`

      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      setState("done")
      setTimeout(() => setState("idle"), 3000)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={state === "loading"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all duration-200",
        state === "idle" &&
          "border-black/15 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-slate-800",
        state === "loading" &&
          "cursor-not-allowed border-black/10 text-slate-400 dark:border-white/10 dark:text-slate-500",
        state === "done" &&
          "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-300",
        state === "error" &&
          "border-red-300 bg-red-50 text-red-700 dark:border-red-700/50 dark:bg-red-950/30 dark:text-red-300"
      )}
    >
      {state === "idle" && (
        <>
          <Download className="size-3.5" />
          CSVエクスポート
        </>
      )}
      {state === "loading" && (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          エクスポート中...
        </>
      )}
      {state === "done" && (
        <>
          <CheckCircle2 className="size-3.5" />
          ダウンロード完了
        </>
      )}
      {state === "error" && (
        <>
          <AlertCircle className="size-3.5" />
          失敗しました
        </>
      )}
    </button>
  )
}
