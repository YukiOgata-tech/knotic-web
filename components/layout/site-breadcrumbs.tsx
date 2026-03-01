"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { headerLinks } from "@/lib/marketing-content"

const hiddenPrefixes = ["/api", "/console", "/sub-domain", "/chat-by-knotic", "/auth"]
const hiddenExactPaths = new Set(["/", "/login", "/signup", "/signup-user"])

const routeLabelMap: Record<string, string> = {
  ...Object.fromEntries(headerLinks.map((item) => [item.href, item.label])),
  "/contact": "お問い合わせ",
  "/demo": "デモ",
  "/integrations": "連携",
  "/privacy": "プライバシーポリシー",
  "/security": "セキュリティ",
  "/specified-commercial-transactions": "特定商取引法に基づく表記",
  "/terms": "利用規約",
}

function getLabel(path: string, segment: string) {
  const mapped = routeLabelMap[path]
  if (mapped) return mapped
  return decodeURIComponent(segment).replace(/-/g, " ")
}

function SiteBreadcrumbs() {
  const pathname = usePathname()

  if (hiddenExactPaths.has(pathname)) return null
  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) return null

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  return (
    <nav
      aria-label="パンくず"
      className="sticky top-16 z-30 border-b border-black/20 bg-background/85 backdrop-blur-md dark:border-white/10"
    >
      <Container className="max-w-none px-4 py-2 sm:px-8 xl:px-12">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
          <li>
            <Link href="/" className="transition-colors hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
              ホーム
            </Link>
          </li>
          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`
            const isLast = index === segments.length - 1
            const label = getLabel(href, segment)

            return (
              <li key={href} className="flex items-center gap-1">
                <ChevronRight className="size-3 shrink-0 opacity-70" aria-hidden />
                {isLast ? (
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                ) : (
                  <Link href={href} className="transition-colors hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
                    {label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </Container>
    </nav>
  )
}

export { SiteBreadcrumbs }
