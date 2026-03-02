import type { MetadataRoute } from "next"

import { getAppUrl } from "@/lib/env"
import { PUBLIC_MARKETING_ROUTES } from "@/lib/seo/site-routes"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppUrl()
  const now = new Date()

  return PUBLIC_MARKETING_ROUTES.map((route) => ({
    url: new URL(route.path, baseUrl).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
