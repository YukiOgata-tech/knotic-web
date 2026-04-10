"use client"

import * as React from "react"

const TOC_ITEMS = [
  { id: "prerequisites", label: "始める前に" },
  { id: "section-wordpress-wpcode", label: "1. WordPress（WPCode）" },
  { id: "section-wordpress-block", label: "2. WordPress（ブロックエディタ）" },
  { id: "section-wix", label: "3. Wix" },
  { id: "section-studio", label: "4. STUDIO" },
  { id: "section-squarespace", label: "5. Squarespace" },
  { id: "section-webflow", label: "6. Webflow" },
  { id: "section-jimdo", label: "7. Jimdo" },
  { id: "section-shopify", label: "8. Shopify" },
  { id: "section-base", label: "9. BASE" },
  { id: "section-unsupported", label: "10. 非対応サービス" },
  { id: "section-script-options", label: "上書きオプション（任意）" },
  { id: "section-checklist", label: "設置後の確認" },
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
