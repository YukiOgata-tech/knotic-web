"use client"

import { usePathname, useSearchParams } from "next/navigation"

import { SiteFooter } from "@/components/layout/site-footer"

const HIDDEN_PREFIXES = ["/sub-domain"]

export function ConditionalSiteFooter() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isEmbeddedChat = pathname.startsWith("/chat-by-knotic") && ["1", "true", "yes"].includes((searchParams.get("embed") ?? "").toLowerCase())
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p)) || isEmbeddedChat) return null
  return <SiteFooter />
}
