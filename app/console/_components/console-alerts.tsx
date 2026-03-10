"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Info, Key } from "lucide-react"

type Props = {
  notice?: string
  error?: string
  issuedApiKey?: string
  widgetToken?: string
}

function Alert({
  children,
  variant,
  icon,
  autoDismiss,
}: {
  children: React.ReactNode
  variant: "success" | "error" | "info"
  icon: React.ReactNode
  autoDismiss?: number
}) {
  const [visible, setVisible] = React.useState(true)
  const [fading, setFading] = React.useState(false)

  React.useEffect(() => {
    if (!autoDismiss) return
    const fadeTimer = setTimeout(() => setFading(true), autoDismiss - 400)
    const hideTimer = setTimeout(() => setVisible(false), autoDismiss)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [autoDismiss])

  if (!visible) return null

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-300",
    info: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-300",
  }[variant]

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-opacity duration-400 ${styles} ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

export function ConsoleAlerts({ notice, error, issuedApiKey, widgetToken }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const hasAny = !!(notice || error || issuedApiKey || widgetToken)

  React.useEffect(() => {
    if (hasAny && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [hasAny])

  if (!hasAny) return null

  return (
    <div ref={ref} className="space-y-2 scroll-mt-4">
      {notice && (
        <Alert variant="success" icon={<CheckCircle2 className="size-4" />} autoDismiss={5000}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="error" icon={<AlertCircle className="size-4" />}>
          {error}
        </Alert>
      )}
      {issuedApiKey && (
        <Alert variant="info" icon={<Key className="size-4" />}>
          発行済みAPIキー（この1回のみ表示）: <code className="ml-1 font-mono text-xs">{issuedApiKey}</code>
        </Alert>
      )}
      {widgetToken && (
        <Alert variant="info" icon={<Info className="size-4" />}>
          発行済みWidgetトークン（この1回のみ表示）: <code className="ml-1 font-mono text-xs">{widgetToken}</code>
        </Alert>
      )}
    </div>
  )
}
