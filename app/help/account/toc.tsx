"use client"

import * as React from "react"

const TOC_ITEMS = [
  { id: "login", label: "ログイン方法" },
  { id: "password-reset", label: "パスワードを忘れた場合" },
  { id: "email-change", label: "メールアドレス変更" },
  { id: "password-change", label: "パスワード変更" },
  { id: "bot-delete", label: "Bot を削除する" },
  { id: "leave-tenant", label: "テナントから脱退する" },
  { id: "tenant-delete", label: "テナントの削除について" },
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
