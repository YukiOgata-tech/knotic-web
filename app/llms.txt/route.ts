import { getAppUrl } from "@/lib/env"

/**
 * /llms.txt — LLM検索エンジン（ChatGPT, Perplexity, Claude等）向けの機械可読サイトサマリー。
 * llmstxt.org の仕様に準拠したMarkdown形式。
 */
export function GET() {
  const base = getAppUrl()

  const content = `# knotic

> URLとPDFを登録するだけで、Webサイト埋め込み・共有URLで公開できるAIチャットボット作成サービス（日本語対応）。
> 問い合わせ自動化・マニュアル案内・社内ナレッジ検索などB2Bユースケースに特化したマルチテナントSaaS。

## 製品概要

knoticは、WebサイトのURLやPDFをナレッジソースとして登録し、RAG（Retrieval-Augmented Generation）技術を活用したAIチャットボットを作成・公開できるSaaSプラットフォームです。コーディング不要で、チャットボットをWebサイトに埋め込んだり、専用URLで公開したりできます。

- 対象ユーザー: 中小〜大企業のマーケティング担当・情報システム担当・カスタマーサポート担当
- 提供言語: 日本語
- 技術基盤: OpenAI File Search（RAG）、Next.js、Supabase
- 公開方法: Widgetスクリプト埋め込み / Hosted URL(共有URL) / REST API

## 料金プラン

- **Lite** — ¥10,000/月。Bot 1体、月間1,000メッセージ、100MBデータ。Widget埋め込み公開。
- **Standard** — ¥24,800/月。Bot 2体、月間5,000メッセージ、1GBデータ。Widget・Hosted URL・API公開。
- **Pro** — ¥100,000/月。Bot無制限（内部50体）、月間20,000メッセージ、10GBデータ。Widget・Hosted URL・API公開。

## 主要機能

- URLを登録するだけでナレッジ自動生成（サイトマップ対応・再インデックス機能付き）
- PDFアップロードによるドキュメントナレッジ化
- 出典・引用元の表示（回答の信頼性確保）
- Widget埋め込み（HTML 1行・Next.js・React・Vue.js・WordPress対応）
- 専用URLでの独立チャット公開
- マルチテナント・Bot複数管理
- 月間メッセージ使用量モニタリング

## 主要ページ

- [トップページ](${base}/): サービス概要・導入メリット
- [機能一覧](${base}/features): 全機能の詳細説明
- [料金プラン](${base}/pricing): Lite・Standard・Proプランの比較
- [活用例](${base}/use-cases): 問い合わせ対応・マニュアル案内・社内ナレッジ検索などのユースケース
- [よくある質問](${base}/faq): FAQ
- [セキュリティ](${base}/security): データ管理・セキュリティポリシー

## ドキュメント・ヘルプ

- [ヘルプセンター](${base}/help): 操作ガイド・トラブルシューティング
- [Widget埋め込みガイド](${base}/help/widget): Webサイトへのウィジェット設置手順（HTML・Next.js・React・Vue.js・WordPress）

## 法的情報

- [プライバシーポリシー](${base}/privacy)
- [利用規約](${base}/terms)
- [特定商取引法に基づく表記](${base}/specified-commercial-transactions)

## Optional

- [お問い合わせ](${base}/contact): 導入相談・サポート問い合わせ
- [インテグレーション](${base}/integrations): 連携サービス・API情報
`

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
