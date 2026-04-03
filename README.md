# knotic-web

Knotic のマーケティングサイト、契約者コンソール、Hosted Chat、Widget 配布、Platform Admin をまとめたリポジトリです。

## 概要
- Framework: Next.js App Router
- Backend: Supabase（Auth / Postgres / Storage / RLS）
- AI: OpenAI Responses API + OpenAI File Search
- Billing: Stripe
- Mail: Resend
- Console: `/console`
- Hosted Chat URL: `/chat-by-knotic/[public_id]`
- Platform Admin: `operations.knotic.<your-domain>` から `/sub-domain` へリライト

## 現在の主要機能
- マーケティングサイト
  - トップ / 機能 / 価格 / FAQ / ヘルプ / セキュリティ / お問い合わせ
- 認証
  - サインアップ / ログイン / パスワード再設定 / 招待参加
- 契約者コンソール
  - Overview
  - Billing
  - Bots
  - Sources
  - API Keys
  - Audit
  - Settings
  - Members
  - Operations
- Bot 管理
  - Bot作成
  - 公開ON/OFF
  - Hosted設定
  - Widget設定
  - AIモデル設定
  - リアルタイムプレビュー
- 公開チャネル
  - Hosted Chat
  - Widget 埋め込み
  - Chat API
- ナレッジ投入
  - URL登録
  - PDF / 文書 / コード / 表形式ファイル登録
  - 非同期インデックスジョブ
  - OpenAI File Search 同期
- メンバー運用
  - 招待URL / トークン参加
  - Bot単位アクセス制御
- 課金/制限
  - Stripe Webhook 連携
  - Platform Admin からの手動契約オーバーライド
  - Bot数 / Hosted件数 / API利用 / 月間メッセージ / ストレージ上限
- 運用
  - 監査ログ
  - 通知
  - force stop
  - DB-backed rate limiting

## 現行プラン値
- Lite: `¥10,000` / Bot `1` / 月間 `1,000` メッセージ / `100MB`
- Standard: `¥24,800` / Bot `2` / 月間 `5,000` メッセージ / `1,024MB`
- Pro: `¥100,000` / Bot表示無制限（内部上限 `50`） / 月間 `20,000` メッセージ / `10,240MB`

追加制御:
- Lite: APIキー `0` / Hosted `0`
- Standard: APIキー `2` / Hosted `2`
- Pro: APIキー `10` / Hosted `50`

## セットアップ

### 1. 依存関係
```bash
npm install
```

### 2. 環境変数
`.env.example` を `.env.local` にコピーして設定してください。

最低限必要:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` または `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` または `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`
- `INDEXER_RUNNER_SECRET`
- `BILLING_RUNNER_SECRET`（未設定時は `INDEXER_RUNNER_SECRET` をフォールバック）
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_CONTACT_TO_EMAIL`

Stripe を使う場合は追加で以下が必要です。
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_LITE_MONTHLY`
- `STRIPE_PRICE_STANDARD_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`

### 3. DB作成
`supabase/schema-02.sql` を Supabase SQL Editor で実行してください。  
現在は **schema-02.sql 1ファイルに統合済み** で、追加パッチ適用は不要です。

### 4. Storage バケット
手動作成が必要なバケット:
- `source-files`（private）
- `source-artifacts`（private）

補足:
- `bot-logos` は `schema-02.sql` 内で作成される前提です

## 開発
```bash
npm run dev
```

Lint:
```bash
npm run lint
```

本番ビルド確認:
```bash
npm run build
```

## 主要エンドポイント
外部/公開系:
- `POST /api/v1/chat`
- `GET /api/widget/config`
- `POST /api/contact`

Hosted系:
- `POST /api/hosted/chat`
- `POST /api/hosted/rooms`
- `POST /api/hosted/messages`

内部系:
- `POST /api/internal/indexing/run`
  - Header: `Authorization: Bearer <INDEXER_RUNNER_SECRET>`
- `POST /api/internal/billing/enforce`
  - Header: `Authorization: Bearer <BILLING_RUNNER_SECRET>`
  - Body任意: `{ "tenantId": "<uuid>" }`

Stripe系:
- `POST /api/stripe/webhook`
- `POST /api/stripe/checkout`
- `POST /api/stripe/portal`
- `POST /api/stripe/subscription/cancel`
- `POST /api/stripe/subscription/resume`

## 実装メモ
- ナレッジ検索は OpenAI File Search を採用
- URL投入は sitemap ベースの複数ページ取得に対応
- `csv`, `xlsx`, `xls` は Markdown 化して同期
- 回答モデルは `gpt-5-mini` / `gpt-5-nano` / `gpt-4o-mini`
- `response_cache` テーブルは存在するが、現行コードでは中核利用していない
- Platform Admin では `tenant_contract_overrides` による契約上書きが可能

## 運用メモ
- Webhook取りこぼし対策として `POST /api/internal/billing/enforce` を日次実行する前提
- インデックスジョブは `POST /api/internal/indexing/run` を定期実行できる構成
- 監査ログ保持、レートリミット清掃、認証ロックアウト清掃は `schema-02.sql` の cron 定義を参照

## 関連ドキュメント
- `docs/AI-bot-service.md`
- `docs/plan-feature-matrix.md`
- `docs/supabase-setup.md`
- `docs/stripe-setup.md`
- `docs/運用マニュアル.md`
