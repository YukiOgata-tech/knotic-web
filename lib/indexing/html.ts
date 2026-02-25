import crypto from "node:crypto"

export type CrawlPage = {
  url: string
  title: string | null
  statusCode: number
  rawHtml: string
  text: string
  contentHash: string
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
}

function stripHtmlToText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")

  const withBreaks = withoutScripts
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")

  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim())
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match) return null
  return decodeHtmlEntities(match[1].replace(/\s+/g, " ").trim())
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return url
  }
}

export function parseSitemapUrls(xml: string, maxUrls: number): string[] {
  const urls = new Set<string>()
  const regex = /<loc>([\s\S]*?)<\/loc>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(xml)) !== null) {
    const value = match[1]?.trim()
    if (!value) continue
    urls.add(normalizeUrl(value))
    if (urls.size >= maxUrls) break
  }

  return [...urls]
}

export async function fetchPage(url: string): Promise<CrawlPage> {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "knotic-indexer/1.0 (+https://knotic.make-it-tech.com)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  })

  const statusCode = response.status
  const rawHtml = await response.text()
  const text = stripHtmlToText(rawHtml)
  const contentHash = crypto.createHash("sha256").update(text).digest("hex")

  return {
    url: normalizeUrl(response.url || url),
    title: extractTitle(rawHtml),
    statusCode,
    rawHtml,
    text,
    contentHash,
  }
}

