import Link from "next/link"
import { AlertTriangle, ArrowLeft, BookOpen, ExternalLink, Info, Lightbulb, Lock, Shield } from "lucide-react"

import { PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { buildHowToJsonLd } from "@/lib/seo/structured-data"
import { CodeBlock } from "./code-block"
import { TableOfContents } from "./toc"

export const metadata = buildMarketingMetadata({
  title: "Widget 埋め込みガイド",
  description: "knotic チャットウィジェットをWebサイトへ埋め込む方法。HTML・Next.js・React・Vue.js・WordPress 向けのコード例を掲載。Bot IDとWidgetトークンの取得から公開まで解説。",
  path: "/help/widget",
  keywords: ["チャットウィジェット 埋め込み", "knotic widget", "AIチャット 設置方法", "Next.js チャットボット", "WordPress AIチャット"],
})

const howToJsonLd = buildHowToJsonLd({
  name: "knoticチャットウィジェットをWebサイトに埋め込む方法",
  description: "knoticのAIチャットウィジェットをあなたのWebサイトへ設置する手順です。HTML・Next.js・React・Vue.js・WordPressに対応しています。",
  steps: [
    {
      name: "Bot IDとWidgetトークンを取得する",
      text: "knoticコンソールにログインし、対象のBotの設定画面 → Widgetタブを開きます。表示されているBot IDとWidgetトークンをコピーします。",
    },
    {
      name: "scriptタグをHTMLに追加する",
      text: "サイトのHTML（またはフレームワークのルートレイアウト）のbody末尾に、widget.jsを読み込むscriptタグを追加します。",
    },
    {
      name: "data属性にBot IDとWidgetトークンを設定する",
      text: "scriptタグのdata-bot-id属性にBot ID、data-widget-token属性にWidgetトークンを設定します。ボタン位置・表示モードはコンソールのWidget設定から変更できます。",
    },
    {
      name: "サイトを保存してウィジェットの動作を確認する",
      text: "ページを保存・デプロイし、ブラウザでサイトを開きます。画面の指定位置にチャットボタンが表示されたら設置完了です。",
    },
  ],
})

const WIDGET_SCRIPT_URL = "https://knotic.make-it-tech.com/widget.js"

const BASIC_HTML = `<!-- knotic Widget -->
<script
  src="${WIDGET_SCRIPT_URL}"
  data-bot-id="YOUR_BOT_ID"
  data-widget-token="YOUR_WIDGET_TOKEN"
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
        defer
    ></script>';
}
add_action( 'wp_footer', 'knotic_widget_script' );`

const ATTRIBUTES = `<!-- 必須属性のみで動作します -->
<script
  src="${WIDGET_SCRIPT_URL}"
  data-bot-id="bot_xxxxxxxxxx"       <!-- 必須: Bot の公開ID -->
  data-widget-token="knotic_wgt_xx"  <!-- 必須: Widgetトークン -->
></script>

<!-- コンソール設定を上書きしたい場合のみ追加 -->
<script
  src="${WIDGET_SCRIPT_URL}"
  data-bot-id="bot_xxxxxxxxxx"
  data-widget-token="knotic_wgt_xx"
  data-mode="overlay"                <!-- 任意: コンソール設定を上書き / overlay / redirect / both -->
  data-position="right-bottom"       <!-- 任意: コンソール設定を上書き / right-bottom / right-top -->
></script>`

export default function WidgetDocsPage() {
  return (
    <PageFrame
      eyebrow="Help Center"
      title="Widget 埋め込みガイド"
      description="チャットウィジェットをあなたのサイトに組み込む手順をフレームワーク別に解説します。"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
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
              <div className="mb-4 rounded-lg border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>ボタン位置・表示モードはコンソールのWidget設定から変更できます。</strong>
                  {" "}scriptタグには <code className="font-mono">data-bot-id</code> と <code className="font-mono">data-widget-token</code> の2つのみ記述すれば動作します。
                  <code className="font-mono">data-mode</code> / <code className="font-mono">data-position</code> は省略した場合にコンソールの設定値が自動的に使用されます。
                  同一Botを複数サイトに設置してサイトごとに見た目を変えたい場合などに任意で追加してください。
                </p>
              </div>
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
                      ["data-mode", "", "overlay / redirect / both", "表示モードの上書き（省略時はコンソール設定値を使用）"],
                      ["data-position", "", "right-bottom / right-top", "ボタン位置の上書き（省略時はコンソール設定値を使用）"],
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

            {/* ===== Part 2: 参考・対処 ===== */}
            <div className="mb-8 mt-14 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              <span className="rounded-full border border-black/15 bg-slate-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-400">
                参考・対処
              </span>
              <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            </div>

            {/* トラブルシューティング */}
            <section id="section-troubleshoot" className="mb-10 scroll-mt-28 rounded-xl border border-slate-300/60 bg-slate-50/80 p-5 dark:border-slate-600/40 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-semibold">トラブルシューティング</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Widget が表示されない・動作しない場合は、まずブラウザの開発者ツール（F12）→「Console」タブでエラーメッセージを確認してください。
              </p>
              <div className="grid gap-3">
                {[
                  {
                    error: "origin not allowed",
                    cause: "設置先のドメインが許可オリジンに未登録",
                    fix: "コンソール → Bot設定 → Widgetタブ →「許可オリジン」に設置先URL（例: https://example.com）を追加して保存",
                  },
                  {
                    error: "invalid widget token",
                    cause: "Widgetトークンが無効または再発行後の古いトークンを使用中",
                    fix: "コンソールのWidgetトークン管理で「トークン再発行」し、新しいトークンでscriptタグを更新",
                  },
                  {
                    error: "widget is disabled",
                    cause: "コンソールでWidgetが無効化されている",
                    fix: "コンソール → Bot設定 → Widgetタブで「Widgetを有効にする」をオンにして保存",
                  },
                  {
                    error: "bot is not ready",
                    cause: "ソースのインデックス処理が未完了",
                    fix: "コンソールのソース一覧でインデックス状態を確認。処理中の場合は完了後に再試行",
                  },
                  {
                    error: "bot is not public",
                    cause: "Botの公開設定がオフになっている",
                    fix: "コンソール → Bot設定 → 基本タブで「公開する」をオンにして保存",
                  },
                  {
                    error: "bot is force-stopped",
                    cause: "Botが運営側により停止中",
                    fix: "サポートにお問い合わせください",
                  },
                ].map(({ error, cause, fix }) => (
                  <div key={error} className="rounded-lg border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50">
                    <p className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
                    <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-slate-700 dark:text-slate-300">原因: </span>{cause}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground"><span className="font-medium text-slate-700 dark:text-slate-300">対処: </span>{fix}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>それでも解決しない場合：</strong>
                  開発者ツール →「Network」タブで <code className="font-mono">/api/widget/config</code> へのリクエストを確認してください。
                  レスポンスの <code className="font-mono">error</code> フィールドに詳細が含まれています。
                </p>
              </div>
            </section>

            {/* セキュリティ */}
            <section id="section-security" className="mb-10 scroll-mt-28 rounded-xl border border-slate-300/60 bg-slate-50/80 p-5 dark:border-slate-600/40 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="size-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-semibold">セキュリティについて</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Widgetトークン（<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">knotic_wgt_</code>）はHTMLソースに公開されます。これは意図的な設計ですが、以下の仕組みで保護されています。
              </p>
              <div className="grid gap-3">
                <div className="rounded-lg border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">許可オリジンによるCORS制御</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <code className="font-mono">/api/widget/config</code> はリクエスト元のOriginヘッダーを検証します。
                    コンソールの「許可オリジン」に登録されていないドメインからのリクエストは <code className="font-mono">403</code> を返します。
                    トークンが漏洩しても、登録外のドメインからは利用できません。
                  </p>
                </div>
                <div className="rounded-lg border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">トークン即時無効化</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    トークンが漏洩した恐れがある場合は、コンソールのWidgetトークン管理から「トークン再発行」を実行してください。
                    旧トークンは即時無効化されます。新しいトークンでscriptタグを更新すれば復旧できます。
                  </p>
                </div>
                <div className="rounded-lg border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">ハッシュ保存</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Widgetトークンはデータベースにハッシュ値のみ保存されています。平文のトークンはコンソールでの発行時に1度だけ表示されます。
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-rose-200/60 bg-rose-50/70 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-950/20">
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  <strong>注意：</strong>フロントエンドのコードに <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> や <code className="font-mono">STRIPE_SECRET_KEY</code> などのサーバー専用シークレットを含めないでください。
                  Widgetトークンのみをフロントエンドに公開する設計としてください。
                </p>
              </div>
            </section>

            {/* CSP */}
            <section id="section-csp" className="mb-10 scroll-mt-28 rounded-xl border border-slate-300/60 bg-slate-50/80 p-5 dark:border-slate-600/40 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="size-4 text-slate-600 dark:text-slate-400" />
                <h2 className="text-sm font-semibold">CSP（Content Security Policy）対応</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                サイトにContent Security Policyを設定している場合、以下のディレクティブを追加してください。
              </p>
              <CodeBlock language="http" code={`# 必要なCSPディレクティブ
Content-Security-Policy:
  script-src  'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")};
  connect-src 'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")};
  frame-src   'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")};
  img-src     'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")} data:;`} />
              <div className="mt-4 grid gap-3">
                {[
                  { directive: "script-src", desc: "widget.js スクリプト本体の読み込みを許可" },
                  { directive: "connect-src", desc: "/api/widget/config・/api/v1/chat など API通信を許可" },
                  { directive: "frame-src", desc: "チャット画面をiframeで表示する場合に必要" },
                  { directive: "img-src", desc: "チャット内の画像・アイコン表示を許可（data: はBot設定のロゴ等で使用）" },
                ].map(({ directive, desc }) => (
                  <div key={directive} className="flex items-start gap-3 rounded-lg border border-black/10 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-slate-950/50">
                    <code className="mt-0.5 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-cyan-700 dark:bg-slate-800 dark:text-cyan-400">{directive}</code>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/50">
                <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Next.js での設定例（next.config.ts）</p>
                <CodeBlock language="ts" code={`// next.config.ts
const cspHeader = [
  \`script-src 'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")}\`,
  \`connect-src 'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")}\`,
  \`frame-src 'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")}\`,
  \`img-src 'self' ${WIDGET_SCRIPT_URL.replace("/widget.js", "")} data:\`,
].join("; ")

export default {
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: cspHeader }] }]
  },
}`} />
              </div>
              <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>注意：</strong><code className="font-mono">unsafe-inline</code> や <code className="font-mono">unsafe-eval</code> の追加は不要です。
                  既存のCSPポリシーがある場合は、上記のホストのみを追記してください。
                </p>
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
