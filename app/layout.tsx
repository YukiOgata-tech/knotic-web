import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteBreadcrumbs } from "@/components/layout/site-breadcrumbs"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
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
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
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
