"use client"

import Link from "next/link"
import * as React from "react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("[app error]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-md text-center">
        <p className="font-mono text-7xl font-bold tracking-tight text-slate-200 dark:text-slate-700">
          500
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
          エラーが発生しました
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          予期しないエラーが発生しました。しばらく時間をおいてから再度お試しください。
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-400 dark:text-slate-600">
            エラーID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-full bg-cyan-600 px-6 text-sm font-medium text-white transition-colors hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400"
          >
            もう一度試す
          </button>
          <Link
            href="/console"
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            管理画面へ
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            トップページへ
          </Link>
        </div>
      </div>
    </div>
  )
}
