"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

type CopyButtonProps = {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = "コピー", className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className={className}>
      {copied ? <Check className="mr-1 size-3.5" /> : <Copy className="mr-1 size-3.5" />}
      {copied ? "コピー済み" : label}
    </Button>
  )
}

