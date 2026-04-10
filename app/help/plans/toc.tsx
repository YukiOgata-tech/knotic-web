"use client"

import * as React from "react"

const TOC_ITEMS = [
  { id: "free-tier", label: "無料プランでできること" },
  { id: "data-retention", label: "データ保持ポリシー" },
  { id: "plan-comparison", label: "プラン比較" },
  { id: "billing-screen", label: "Billing画面の見方" },
  { id: "plan-change", label: "プラン変更の方法" },
  { id: "cancel", label: "解約方法" },
  { id: "payment", label: "お支払いについて" },
]

export function TableOfContents() {
  const [activeId, setActiveId] = React.useState<string>("")

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )

    for (const item of TOC_ITEMS) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="目次">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400">
        目次
      </p>
      <ul className="space-y-1.5">
        {TOC_ITEMS.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-no-route-loader="true"
              className={`block rounded-lg px-3 py-2 text-sm leading-snug transition-colors ${
                activeId === item.id
                  ? "bg-cyan-50 font-medium text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
