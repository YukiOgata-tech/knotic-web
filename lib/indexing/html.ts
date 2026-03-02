import crypto from "node:crypto"

export type CrawlPage = {
  url: string
  title: string | null
  statusCode: number
  rawHtml: string
  text: string
  contentHash: string
}

const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "yclid",
  "mc_cid",
  "mc_eid",
])

const USER_AGENT = "knotic-indexer/1.0 (+https://knotic.make-it-tech.com)"
const ROBOTS_CACHE = new Map<string, string | null>()

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

  return decodeHtmlEntities(
    withBreaks
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match) return null
  return decodeHtmlEntities(match[1].replace(/\s+/g, " ").trim())
}

function stripTrackingParams(url: URL) {
  const deleteKeys: string[] = []
  for (const key of url.searchParams.keys()) {
    const lower = key.toLowerCase()
    if (lower.startsWith("utm_") || TRACKING_QUERY_KEYS.has(lower)) {
      deleteKeys.push(key)
    }
  }
  for (const key of deleteKeys) {
    url.searchParams.delete(key)
  }
}

export function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    stripTrackingParams(parsed)
    return parsed.toString()
  } catch {
    return url
  }
}

function extractCanonicalUrl(html: string, baseUrl: string) {
  const match = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i)
  if (!match) return null
  const hrefMatch = match[0].match(/href=["']([^"']+)["']/i)
  const href = hrefMatch?.[1]?.trim()
  if (!href) return null
  try {
    return normalizeUrl(new URL(href, baseUrl).toString())
  } catch {
    return null
  }
}

function wildcardToRegExp(pattern: string) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp("^" + escaped.replace(/\*/g, ".*") + "$")
}

function matchRobotsPath(rulePath: string, targetPath: string) {
  if (!rulePath) return false
  if (rulePath === "/") return true
  if (rulePath.includes("*")) return wildcardToRegExp(rulePath).test(targetPath)
  return targetPath.startsWith(rulePath)
}

function parseRobotsRules(robotsText: string) {
  const lines = robotsText
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)

  type RuleBlock = {
    agents: string[]
    allow: string[]
    disallow: string[]
  }

  const blocks: RuleBlock[] = []
  let current: RuleBlock | null = null

  for (const line of lines) {
    const idx = line.indexOf(":")
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()

    if (key === "user-agent") {
      if (!current || current.allow.length > 0 || current.disallow.length > 0) {
        current = { agents: [], allow: [], disallow: [] }
        blocks.push(current)
      }
      current.agents.push(value.toLowerCase())
      continue
    }

    if (!current) continue
    if (key === "allow") current.allow.push(value)
    if (key === "disallow") current.disallow.push(value)
  }

  return blocks
}

function selectRobotsBlock(robotsText: string) {
  const blocks = parseRobotsRules(robotsText)
  const targetAgent = USER_AGENT.toLowerCase()

  let best: ReturnType<typeof parseRobotsRules>[number] | null = null
  let bestScore = -1

  for (const block of blocks) {
    for (const agent of block.agents) {
      const normalized = agent.trim()
      let score = -1
      if (normalized === "*") score = 1
      else if (targetAgent.includes(normalized)) score = normalized.length + 1
      if (score > bestScore) {
        best = block
        bestScore = score
      }
    }
  }

  return best
}

async function fetchWithRetry(url: string, init: RequestInit, maxAttempts = 3) {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, init)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxAttempts) {
          const waitMs = 250 * attempt
          await new Promise((resolve) => setTimeout(resolve, waitMs))
          continue
        }
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        const waitMs = 250 * attempt
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        continue
      }
      throw error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("fetch failed")
}

async function fetchRobotsTxt(origin: string) {
  if (ROBOTS_CACHE.has(origin)) return ROBOTS_CACHE.get(origin) ?? null
  try {
    const response = await fetchWithRetry(`${origin}/robots.txt`, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/plain,*/*;q=0.1",
      },
      cache: "no-store",
      redirect: "follow",
    })
    if (!response.ok) {
      ROBOTS_CACHE.set(origin, null)
      return null
    }
    const text = await response.text()
    ROBOTS_CACHE.set(origin, text)
    return text
  } catch {
    ROBOTS_CACHE.set(origin, null)
    return null
  }
}

async function assertCrawlAllowed(targetUrl: string) {
  const parsed = new URL(targetUrl)
  const robotsText = await fetchRobotsTxt(parsed.origin)
  if (!robotsText) return

  const block = selectRobotsBlock(robotsText)
  if (!block) return

  const path = `${parsed.pathname}${parsed.search}` || "/"
  let matchedAllowLen = -1
  let matchedDisallowLen = -1

  for (const rule of block.allow) {
    if (matchRobotsPath(rule, path)) {
      matchedAllowLen = Math.max(matchedAllowLen, rule.length)
    }
  }

  for (const rule of block.disallow) {
    if (!rule) continue
    if (matchRobotsPath(rule, path)) {
      matchedDisallowLen = Math.max(matchedDisallowLen, rule.length)
    }
  }

  if (matchedDisallowLen > matchedAllowLen) {
    throw new Error(`robots.txt disallow: ${normalizeUrl(targetUrl)}`)
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

export function filterUrlsByHost(seedUrl: string, urls: string[]) {
  try {
    const seed = new URL(seedUrl)
    const host = seed.host.toLowerCase()
    return urls.filter((value) => {
      try {
        return new URL(value).host.toLowerCase() === host
      } catch {
        return false
      }
    })
  } catch {
    return urls
  }
}

export async function fetchPage(url: string): Promise<CrawlPage> {
  const normalized = normalizeUrl(url)
  await assertCrawlAllowed(normalized)

  const response = await fetchWithRetry(normalized, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  })

  const statusCode = response.status
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase()
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`unsupported content type for crawl: ${contentType || "unknown"}`)
  }

  const rawHtml = await response.text()
  const title = extractTitle(rawHtml)
  const fallbackUrl = normalizeUrl(response.url || normalized)
  const canonicalUrl = extractCanonicalUrl(rawHtml, fallbackUrl)
  const finalUrl = canonicalUrl ?? fallbackUrl
  const text = stripHtmlToText(rawHtml)
  const contentHash = crypto.createHash("sha256").update(text).digest("hex")

  return {
    url: finalUrl,
    title,
    statusCode,
    rawHtml,
    text,
    contentHash,
  }
}
