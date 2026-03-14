import type { Metadata } from "next"

import { getAppUrl } from "@/lib/env"

type BuildMarketingMetadataInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
  noIndex?: boolean
}

function absoluteUrl(path: string) {
  const base = getAppUrl()
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return new URL(normalizedPath, base).toString()
}

const DEFAULT_OG_IMAGE = "/images/hero-knotic-pc.png"

export function buildMarketingMetadata(input: BuildMarketingMetadataInput): Metadata {
  const canonical = absoluteUrl(input.path)
  const ogImageUrl = absoluteUrl(DEFAULT_OG_IMAGE)
  const noIndex = Boolean(input.noIndex)
  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${input.title} | knotic`,
      description: input.description,
      url: canonical,
      type: "website",
      siteName: "knotic",
      locale: "ja_JP",
      images: [{ url: ogImageUrl, alt: `${input.title} | knotic` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | knotic`,
      description: input.description,
      images: [ogImageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
        },
  }
}
