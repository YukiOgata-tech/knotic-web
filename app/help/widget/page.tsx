import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpen, Code2, ExternalLink, Info, Lightbulb } from "lucide-react"

import { PageFrame } from "@/components/marketing/page-frame"
import { CodeBlock } from "./code-block"
import { TableOfContents } from "./toc"

export const metadata: Metadata = {
  title: "Widget 埋め込みガイド | Help",
  description: "knotic Widget を Web サイトに埋め込む方法。HTML・Next.js・React・Vue.js・WordPress 向けの実装例。",
}

const WIDGET_SCRIPT_URL = "https://knotic.make-it-tech.com/widget.js"

const BASIC_HTML = `<!-- knotic Widget -->
<script
  src="${WIDGET_SCRIPT_URL}"
  data-bot-id="YOUR_BOT_ID"
  data-widget-token="YOUR_WIDGET_TOKEN"
  data-mode="overlay"
  data-position="right-bottom"
  defer
></script>`

const NEXTJS_SCRIPT = `// app/layout.tsx（推奨）
import Script from "next/script"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}

        {/* ページ全体に1回だけ読み込む */}
        <Script
          src="${WIDGET_SCRIPT_URL}"
          data-bot-id="YOUR_BOT_ID"
          data-widget-token="YOUR_WIDGET_TOKEN"
          data-mode="overlay"
          data-position="right-bottom"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}`

const NEXTJS_COMPONENT = `// components/knotic-widget.tsx（特定ページのみに表示したい場合）
"use client"

import Script from "next/script"

export function KnoticWidget() {
  return (
    <Script
      src="${WIDGET_SCRIPT_URL}"
      data-bot-id="YOUR_BOT_ID"
      data-widget-token="YOUR_WIDGET_TOKEN"
      data-mode="overlay"
      data-position="right-bottom"
      strategy="lazyOnload"
    />
  )
}

// 使いたいページで:
// import { KnoticWidget } from "@/components/knotic-widget"
// <KnoticWidget />`

const REACT_VITE = `// src/App.tsx または src/main.tsx（Vite / CRA）
import { useEffect } from "react"

function useKnoticWidget() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "${WIDGET_SCRIPT_URL}"
    script.setAttribute("data-bot-id", "YOUR_BOT_ID")
    script.setAttribute("data-widget-token", "YOUR_WIDGET_TOKEN")
    script.setAttribute("data-mode", "overlay")
    script.setAttribute("data-position", "right-bottom")
    script.defer = true
    document.body.appendChild(script)

    return () => {
      // クリーンアップ（SPA でページ離脱時にウィジェットを削除）
      document.body.removeChild(script)
    }
  }, [])
}

export default function App() {
  useKnoticWidget()
  return <div>{/* ... */}</div>
}`

const REACT_INDEX_HTML = `<!-- public/index.html（シンプルに body 末尾へ追加する場合）-->
<body>
  <div id="root"></div>

  <script
    src="${WIDGET_SCRIPT_URL}"
    data-bot-id="YOUR_BOT_ID"
    data-widget-token="YOUR_WIDGET_TOKEN"
    data-mode="overlay"
    data-position="right-bottom"
    defer
  ></script>
</body>`

const VUE = `<!-- src/App.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue"

let scriptEl: HTMLScriptElement | null = null

onMounted(() => {
  scriptEl = document.createElement("script")
  scriptEl.src = "${WIDGET_SCRIPT_URL}"
  scriptEl.setAttribute("data-bot-id", "YOUR_BOT_ID")
  scriptEl.setAttribute("data-widget-token", "YOUR_WIDGET_TOKEN")
  scriptEl.setAttribute("data-mode", "overlay")
  scriptEl.setAttribute("data-position", "right-bottom")
  scriptEl.defer = true
  document.body.appendChild(scriptEl)
})

onUnmounted(() => {
  if (scriptEl) document.body.removeChild(scriptEl)
})
</script>

<template>
  <!-- アプリ本体 -->
</template>`

const WORDPRESS = `<?php
// functions.php に追加（テーマのカスタマイズ推奨）
function knotic_widget_script() {
    echo '<script
        src="${WIDGET_SCRIPT_URL}"
        data-bot-id="YOUR_BOT_ID"
        data-widget-token="YOUR_WIDGET_TOKEN"
        data-mode="overlay"
        data-position="right-bottom"
        defer
    ></script>';
}
add_action( 'wp_footer', 'knotic_widget_script' );`

const ATTRIBUTES = `<!-- data 属性オプション一覧 -->
<script
  src="${WIDGET_SCRIPT_URL}"

  data-bot-id="bot_xxxxxxxxxx"       <!-- 必須: Bot の公開ID -->
  data-widget-token="knotic_wgt_xx"  <!-- 必須: Widgetトークン -->

  data-mode="overlay"                <!-- overlay（デフォルト）/ redirect / both -->
  data-position="right-bottom"       <!-- right-bottom（デフォルト）/ right-top -->
></script>`

export default function WidgetDocsPage() {
  return (
    <PageFrame
      eyebrow="Help Center"
      title="Widget 埋め込みガイド"
      description="チャットウィジェットをあなたのサイトに組み込む手順をフレームワーク別に解説します。"
    >
      <div className="mb-6">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="size-4" />
          ヘルプセンターに戻る
        </Link>
      </div>

      {/* 2カラムレイアウト（PC: 目次 + コンテンツ） */}
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">

          {/* 目次（PCのみ sticky） */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
              <TableOfContents />
            </div>
          </aside>

          {/* メインコンテンツ */}
          <main className="min-w-0">

            {/* 前提 */}
            <section id="prerequisites" className="mb-10 scroll-mt-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
              <div className="mb-3 flex items-center gap-2">
                <Info className="size-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-semibold">始める前に</h2>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                コンソールの Bot 設定 → <strong>Widget タブ</strong> から以下の 2 つを取得してください。
              </p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">1</span>
                  <span><strong>Bot ID</strong>（<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">bot_</code> で始まる公開ID）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">2</span>
                  <span><strong>Widget トークン</strong>（<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">knotic_wgt_</code> で始まる値 — 発行時のみ表示）</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                また、許可オリジン設定にウィジェットを設置するドメインを追加することで、不正なサイトからの呼び出しを防げます。
              </p>
            </section>

            {/* セクション1: 基本HTML */}
            <section id="section-html" className="mb-10 scroll-mt-28">
              <SectionHeading number={1} title="基本実装（HTML）" />
              <p className="mb-4 text-sm text-muted-foreground">
                HTML ファイルの <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">&lt;/body&gt;</code> 直前に貼り付けるだけで動作します。フレームワーク不要のシンプルな方法です。
              </p>
              <CodeBlock code={BASIC_HTML} language="html" />
            </section>

            {/* セクション2: Next.js */}
            <section id="section-nextjs" className="mb-10 scroll-mt-28">
              <SectionHeading number={2} title="Next.js（App Router）" />
              <div className="mb-4 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                  <p>
                    <strong>推奨配置: </strong>
                    <code className="font-mono">app/layout.tsx</code> の最上位 RootLayout に置くのがベストです。
                    全ページに1度だけ読み込まれ、SPA ナビゲーション時も再マウントされません。
                    特定ページのみに表示したい場合はコンポーネント化してください。
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">① layout.tsx に直接（全ページ共通）</p>
                  <CodeBlock code={NEXTJS_SCRIPT} language="tsx" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">② コンポーネント化（特定ページのみ）</p>
                  <CodeBlock code={NEXTJS_COMPONENT} language="tsx" />
                </div>
              </div>
            </section>

            {/* セクション3: React (Vite/CRA) */}
            <section id="section-react" className="mb-10 scroll-mt-28">
              <SectionHeading number={3} title="React（Vite / Create React App）" />
              <div className="mb-4 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                  <p>
                    <strong>推奨配置: </strong>
                    <code className="font-mono">src/App.tsx</code> または <code className="font-mono">src/main.tsx</code> でカスタムフックとして定義するか、
                    <code className="font-mono">public/index.html</code> の body 末尾に直接記述する方法が最もシンプルです。
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">① カスタムフック（動的挿入）</p>
                  <CodeBlock code={REACT_VITE} language="tsx" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">② public/index.html に直接記述（最もシンプル）</p>
                  <CodeBlock code={REACT_INDEX_HTML} language="html" />
                </div>
              </div>
            </section>

            {/* セクション4: Vue.js */}
            <section id="section-vue" className="mb-10 scroll-mt-28">
              <SectionHeading number={4} title="Vue.js（Vue 3 / Nuxt）" />
              <div className="mb-4 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                  <p>
                    <strong>推奨配置: </strong>
                    <code className="font-mono">src/App.vue</code> の <code className="font-mono">onMounted</code> で挿入するのが一般的です。
                    Nuxt を使っている場合は <code className="font-mono">nuxt.config.ts</code> の <code className="font-mono">app.head.script</code> に追加する方法が最もクリーンです。
                  </p>
                </div>
              </div>
              <CodeBlock code={VUE} language="vue" />
            </section>

            {/* セクション5: WordPress */}
            <section id="section-wordpress" className="mb-10 scroll-mt-28">
              <SectionHeading number={5} title="WordPress" />
              <div className="mb-4 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                  <p>
                    <strong>推奨配置: </strong>
                    子テーマの <code className="font-mono">functions.php</code> に <code className="font-mono">wp_footer</code> フックで追加するのがベストプラクティスです。
                    テーマ編集が難しい場合は「外観 → ウィジェット」または「外観 → カスタマイズ → 追加CSS/HTML」からカスタム HTML ブロックとして追加できます。
                  </p>
                </div>
              </div>
              <CodeBlock code={WORDPRESS} language="php" />
            </section>

            {/* セクション6: オプション一覧 */}
            <section id="section-options" className="mb-10 scroll-mt-28">
              <SectionHeading number={6} title="data 属性オプション一覧" />
              <CodeBlock code={ATTRIBUTES} language="html" />
              <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
                <table className="w-full min-w-130 text-xs">
                  <thead>
                    <tr className="border-b border-black/10 bg-slate-50 dark:border-white/10 dark:bg-slate-900/60">
                      <th className="px-3 py-2 text-left font-semibold">属性</th>
                      <th className="px-3 py-2 text-left font-semibold">必須</th>
                      <th className="px-3 py-2 text-left font-semibold">値</th>
                      <th className="px-3 py-2 text-left font-semibold">説明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {[
                      ["data-bot-id", "✓", "bot_xxx", "Bot の公開ID"],
                      ["data-widget-token", "✓", "knotic_wgt_xxx", "Widgetトークン"],
                      ["data-mode", "", "overlay / redirect / both", "表示モード（デフォルト: overlay）"],
                      ["data-position", "", "right-bottom / right-top", "ランチャー位置（デフォルト: right-bottom）"],
                    ].map(([attr, required, values, desc]) => (
                      <tr key={attr} className="bg-white dark:bg-slate-900/40">
                        <td className="px-3 py-2 font-mono text-cyan-700 dark:text-cyan-400">{attr}</td>
                        <td className="px-3 py-2 text-center text-emerald-600">{required}</td>
                        <td className="px-3 py-2 text-muted-foreground">{values}</td>
                        <td className="px-3 py-2 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* フッター */}
            <div className="mt-12 flex flex-col gap-3 rounded-xl border border-black/10 bg-white/80 px-5 py-4 dark:border-white/10 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="size-4 shrink-0" />
                <span>不明な点はコンソールからお問い合わせください。</span>
              </div>
              <Link
                href="/console/bots"
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                コンソールへ
                <ExternalLink className="size-3" />
              </Link>
            </div>

          </main>
        </div>
    </PageFrame>
  )
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
        {number}
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  )
}
