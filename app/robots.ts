import type { MetadataRoute } from "next"

import { getAppUrl } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/console/",
          "/sub-domain/",
          "/chat-by-knotic/",
          "/login",
          "/signup",
          "/signup-user",
          "/invite",
          "/lottie-preview",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
