"use client"

import * as React from "react"

const TOC_ITEMS_EMBED = [
  { id: "prerequisites", label: "始める前に" },
  { id: "section-html", label: "1. 基本実装（HTML）" },
  { id: "section-nextjs", label: "2. Next.js" },
  { id: "section-react", label: "3. React" },
  { id: "section-vue", label: "4. Vue.js" },
  { id: "section-wordpress", label: "5. WordPress" },
  { id: "section-options", label: "6. data 属性一覧" },
]

const TOC_ITEMS_ADVANCED = [
  { id: "section-troubleshoot", label: "トラブルシューティング" },
  { id: "section-security", label: "セキュリティ" },
  { id: "section-csp", label: "CSP 設定" },
]

const TOC_ITEMS = [...TOC_ITEMS_EMBED, ...TOC_ITEMS_ADVANCED]

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
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400">
        埋め込みガイド
      </p>
      <ul className="space-y-1.5">
        {TOC_ITEMS_EMBED.map((item) => (
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
      <div className="my-4 border-t border-black/10 dark:border-white/10" />
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        参考・対処
      </p>
      <ul className="space-y-1.5">
        {TOC_ITEMS_ADVANCED.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-no-route-loader="true"
              className={`block rounded-lg px-3 py-2 text-sm leading-snug transition-colors ${
                activeId === item.id
                  ? "bg-slate-100 font-medium text-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
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
