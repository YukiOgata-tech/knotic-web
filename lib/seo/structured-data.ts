import { getAppUrl } from "@/lib/env"

function absolute(path: string) {
  return new URL(path, getAppUrl()).toString()
}

export function buildOrganizationJsonLd() {
  const siteUrl = getAppUrl()
  return {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "knotic",
    url: siteUrl,
    description: "URLやPDFを登録するだけでAIチャットボットを作成・公開できるサービス",
  }
}

export function buildSoftwareApplicationJsonLd() {
  const siteUrl = getAppUrl()
  return {
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#softwareapplication`,
    name: "knotic",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      priceCurrency: "JPY",
      price: "10000",
      description: "Liteプラン（月額）",
    },
    url: siteUrl,
    description: "URLとPDFを登録してAIチャットボットを公開できるB2B SaaS",
  }
}

export function buildFaqJsonLd(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  }
}

export function buildBreadcrumbJsonLd(pathname: string, labels: string[]) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`
  const segments = normalized.split("/").filter(Boolean)
  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: "ホーム",
      item: absolute("/"),
    },
    ...segments.map((_, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`
      return {
        "@type": "ListItem",
        position: index + 2,
        name: labels[index] ?? segments[index],
        item: absolute(path),
      }
    }),
  ]

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  }
}
