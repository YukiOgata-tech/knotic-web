import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteBreadcrumbs } from "@/components/layout/site-breadcrumbs"
import { RouteTransitionLoader } from "@/components/layout/route-transition-loader"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { getAppUrl } from "@/lib/env"
import { buildOrganizationJsonLd, buildSoftwareApplicationJsonLd } from "@/lib/seo/structured-data"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "knotic | URLとPDFでAIチャットボットを作成・公開",
    template: "%s | knotic",
  },
  description:
    "URLやPDFを登録するだけで、Webサイト埋め込み・共有URLで公開できるAIチャットボット作成サービス。問い合わせ自動化・マニュアル案内・社内ナレッジ検索に。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "knotic",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const rootJsonLd = {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationJsonLd(), buildSoftwareApplicationJsonLd()],
  }

  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
          />
          <Suspense fallback={null}>
            <RouteTransitionLoader />
          </Suspense>
          <div className="min-h-screen bg-background text-foreground">
            <SiteHeader />
            <SiteBreadcrumbs />
            <main>{children}</main>
            <SiteFooter />
          </div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  )
}
