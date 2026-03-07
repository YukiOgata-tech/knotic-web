import fs from "node:fs/promises"
import path from "node:path"

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AuditionPresentationClient } from "@/app/audition-pre/presentation-client"
import { buildMarketingMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMarketingMetadata({
  title: "Audition Presentation Preview",
  description: "オーディション用プレゼン資料のプレビューとPDF書き出しページです。",
  path: "/audition-pre",
  noIndex: true,
})

async function loadPresentationHtml() {
  const filePath = path.join(process.cwd(), "docs", "audition_presentation_preview.html")
  return fs.readFile(filePath, "utf8")
}

export default async function AuditionPrePage() {
  const enabledByEnv = process.env.ENABLE_AUDITION_PRE === "1"
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!enabledByEnv && !isDevelopment) {
    notFound()
  }

  const sourceHtml = await loadPresentationHtml()
  return <AuditionPresentationClient sourceHtml={sourceHtml} />
}
