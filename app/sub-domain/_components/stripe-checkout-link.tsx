"use client"

import { useState } from "react"
import { Copy, ExternalLink, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  tenantId: string
}

export function StripeCheckoutLink({ tenantId }: Props) {
  const [planCode, setPlanCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url: string; plan_code: string; expires_at: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!planCode) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/sub-domain/stripe-checkout-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, plan_code: planCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました")
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.url) return
    await navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">発行するプラン</label>
        <select
          value={planCode}
          onChange={(e) => { setPlanCode(e.target.value); setResult(null) }}
          className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900"
        >
          <option value="">プランを選択</option>
          <option value="lite">Lite</option>
          <option value="standard">Standard</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      <Button onClick={handleGenerate} disabled={!planCode || loading} size="sm" className="w-fit">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            生成中...
          </>
        ) : (
          "決済URLを発行"
        )}
      </Button>

      {error ? (
        <p className="rounded-md border border-red-300/40 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="rounded-md border border-emerald-200/60 bg-emerald-50/80 p-3 dark:border-emerald-500/30 dark:bg-emerald-950/20">
          <p className="mb-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            決済URL発行済み（{result.plan_code} プラン）
          </p>
          <p className="mb-3 text-[11px] text-emerald-700 dark:text-emerald-400">
            有効期限: {new Date(result.expires_at).toLocaleString("ja-JP")} （約24時間）
          </p>
          <div className="flex gap-2">
            <Input value={result.url} readOnly className="font-mono text-[11px]" />
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "コピー済み" : <Copy className="size-4" />}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-500">
            このURLを顧客に共有してください。顧客が決済を完了すると Webhook 経由でサブスクリプションが自動登録されます。
          </p>
        </div>
      ) : null}
    </div>
  )
}
