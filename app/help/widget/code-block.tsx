"use client"

import * as React from "react"
import { CopyButton } from "./copy-button"

export function CodeBlock({ code, language = "html" }: { code: string; language?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-slate-900 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[11px] text-slate-400">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed sm:p-4 sm:text-sm">
        <code className="font-mono text-slate-100">{code}</code>
      </pre>
    </div>
  )
}
