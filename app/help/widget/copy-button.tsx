"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/80 transition-colors hover:bg-white/20 hover:text-white ${className ?? ""}`}
      aria-label="コードをコピー"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "コピー済み" : "コピー"}
    </button>
  )
}
