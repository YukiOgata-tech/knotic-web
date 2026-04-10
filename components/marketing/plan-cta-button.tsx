"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogIn, UserPlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"

type Props = {
  planCode: string
  planName: string
  className?: string
}

type BillingStatus = {
  authenticated: boolean
  hasActiveSubscription: boolean
}

type ModalState = "closed" | "unauthenticated"

export function PlanCtaButton({ planCode, planName, className }: Props) {
  const router = useRouter()
  const [modal, setModal] = React.useState<ModalState>("closed")
  const [loading, setLoading] = React.useState(false)
  const [status, setStatus] = React.useState<BillingStatus | null>(null)
  const formRef = React.useRef<HTMLFormElement | null>(null)

  React.useEffect(() => {
    fetch("/api/billing/status")
      .then((res) => res.json())
      .then((data: BillingStatus) => setStatus(data))
      .catch(() => {/* ネットワークエラー時はデフォルト表示のまま */})
  }, [])

  async function handleClick() {
    if (status?.authenticated && status.hasActiveSubscription) {
      router.push("/console/billing")
      return
    }

    setLoading(true)
    try {
      let current: BillingStatus
      if (status) {
        current = status
      } else {
        current = await fetch("/api/billing/status").then((r) => r.json())
      }

      if (!current.authenticated) {
        setModal("unauthenticated")
        return
      }

      if (current.hasActiveSubscription) {
        router.push("/console/billing")
        return
      }

      formRef.current?.requestSubmit()
    } finally {
      setLoading(false)
    }
  }

  const isSubscribed = status?.authenticated && status.hasActiveSubscription

  return (
    <>
      <form ref={formRef} action="/api/stripe/checkout" method="post" className="hidden">
        <input type="hidden" name="plan_code" value={planCode} />
      </form>

      {isSubscribed ? (
        <Button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-2 bg-amber-500/50 text-white hover:bg-amber-600 dark:bg-amber-500/50 dark:hover:bg-amber-400 ${className ?? ""}`}
        >
          <LayoutDashboard className="size-4" />
          管理画面で確認する
        </Button>
      ) : (
        <Button
          type="button"
          disabled={loading}
          onClick={handleClick}
          className={className}
        >
          {loading ? "確認中..." : "このプランで契約する"}
        </Button>
      )}

      {modal === "unauthenticated" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setModal("closed")}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-black/20 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModal("closed")}
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-slate-800 dark:hover:text-zinc-200"
              aria-label="閉じる"
            >
              <X className="size-4" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
              {planName}
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              契約にはアカウントが必要です
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              knoticアカウントをお持ちでない方は新規会員登録、すでにお持ちの方はログインしてご利用ください。
            </p>

            <div className="mt-5 grid gap-2">
              <Button asChild className="w-full rounded-full">
                <Link href="/signup">
                  <UserPlus className="size-4" />
                  新規会員登録
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/login?next=/pricing">
                  <LogIn className="size-4" />
                  ログインはこちら
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              登録・ログイン後に改めてプランをお選びください。
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}
