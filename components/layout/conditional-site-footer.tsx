"use client"

import { usePathname } from "next/navigation"

import { SiteFooter } from "@/components/layout/site-footer"

const HIDDEN_PREFIXES = ["/sub-domain", "/chat-by-knotic"]

export function ConditionalSiteFooter() {
  const pathname = usePathname()
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null
  return <SiteFooter />
}
