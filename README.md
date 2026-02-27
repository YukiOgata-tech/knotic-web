# knotic-web

Knotic のマーケティングサイト + 管理コンソール + RAG基盤のリポジトリです。  
既存事業 `make-it-tech.com` と運営者は同一ですが、開発リポジトリは分離しています。

## 概要
- Framework: Next.js App Router
- Backend: Supabase（Auth / Postgres / Storage）
- AI: OpenAI Responses + Embeddings
- Console: `/console`
- Hosted Chat URL: `/chat-by-knotic/[public_id]`
- Platform Admin Console: `operations.knotic.<your-domain>` -> `/sub-domain` (proxy rewrite)

## 実装済み（2026-02-27時点）
- マーケティングページ群（トップ/機能/価格/FAQ等）
- ダーク/ライトモード切替
- 認証導線（signup/login/callback）
- コンソール画面
  - `/console/overview`
  - `/console/operations`（運用ダッシュボード）
  - `/console/bots`
  - `/console/sources`
  - `/console/api-keys`
  - `/console/audit`（監査ログ）
  - `/console/settings`
- Bot管理
  - Bot作成
  - 公開ON/OFF切替
  - Hosted設定（用途、表示名、初期文、入力文言、免責、引用表示、アクセスモード）
  - Hostedヘッダー/フッター配色設定
  - リアルタイムプレビュー + テストチャット
- Hostedチャット
  - ChatGPT風UI
  - 24時間のローカル履歴保持（公開モード）
  - 参照根拠（URL/PDFリンク）表示
  - 初期メッセージ内URLの自動リンク化
- API/認証
  - `POST /api/v1/chat`
  - 契約者APIキー認証
  - Widgetトークン認証（origin制限）
  - 公開/社内モード制御
- ソース投入とインデックス
  - URL登録
  - PDFアップロード
  - キュー投入
  - 手動ワーカー実行（1件）
  - ベクトル検索 `app.match_chunks`
- 制限/運用
  - プラン制約（Bot数、月間メッセージ、ストレージ）
  - 通知（上限近接）
  - 監査ログ（操作証跡）
- お問い合わせ機能
  - `/contact` フォーム + `POST /api/contact`
  - Resend連携（HTMLメールテンプレート/ロゴ表示）
  - スパム対策（ハニーポット/送信時間トラップ/Originチェック/入力検証/レート制限）
- DB
  - 基本構成: `supabase/schema.sql`
  - 監査ログ/運用ダッシュボード拡張: `supabase/patch-20260226-audit-and-ops.sql`

## プラン（現在実装値）
- Lite: `¥10,000` / Bot `1` / 月間 `1,000` メッセージ
- Standard: `¥24,800` / Bot `2` / 月間 `5,000` メッセージ
- Pro: `¥100,000` / Bot表示無制限（内部上限あり） / 月間 `20,000` メッセージ

## 未実装 / 次フェーズ
- 課金運用の最終強化
  - Stripe webhookイベントの監視範囲拡張（将来イベント含む）
  - 失敗イベントの再処理運用（自動再試行 + アラート + 管理UI）
  - 契約状態遷移（active/past_due/canceled）の厳密な表示ルール統一
- 課金UI/契約導線の仕上げ
  - プラン変更時の適用タイミング文言と法務文言の最終化
  - キャンセル/再開/失効時のユーザー体験整備
- スパム/セキュリティの本番強化
  - CAPTCHA導入（Cloudflare Turnstile or reCAPTCHA）
  - WAF/レート制限のインフラ側設定（Vercel/Cloudflare）
  - 監査ログの保持期間・エクスポート運用
- インデックス/ワーカー運用の本番化
  - 常時ワーカー実行（cron）
  - 失敗ジョブのDead Letter運用と再実行UI
  - 大規模クロール時の並列数/タイムアウト/リソース制御
- 通知センター拡張
  - `tenant_notifications` の既読化・履歴閲覧UI
  - 管理者向け通知ルール設定（しきい値/通知先/通知種別）
- アクセス制御の詳細化（必要時）
  - 社内用途向けの追加権限（機能単位）
  - テナント/ボットの停止ポリシーと運用手順の明文化

## セットアップ

### 1. 依存関係
```bash
npm install
```

### 2. 環境変数
`.env.example` を `.env.local` にコピーし、値を設定してください。

最低限必要:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（または `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- `SUPABASE_SECRET_KEY`（または `SUPABASE_SERVICE_ROLE_KEY`）
- `OPENAI_API_KEY`
- `INDEXER_RUNNER_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_CONTACT_TO_EMAIL`

### 3. DB作成
`supabase/schema.sql` を Supabase SQL Editor で実行します。  
監査ログ/運用ダッシュボードを使う場合は追加で以下を実行します。
- `supabase/patch-20260226-audit-and-ops.sql`

### 4. Storageバケット作成
- `source-files`（PDF原本）
- `source-artifacts`（クロール/抽出成果物）

いずれも private で運用してください。

## 開発実行
```bash
npm run dev
```

本番ビルド確認:
```bash
npm run build
```

## 主要エンドポイント
- `GET /api/supabase/ping` 接続確認
- `POST /api/contact` お問い合わせ送信（Resend）
- `POST /api/internal/indexing/run` インデックスジョブ実行（内部用）
  - Header: `Authorization: Bearer <INDEXER_RUNNER_SECRET>`
- `POST /api/v1/chat` RAG回答API

## 補足
- Embeddingは `text-embedding-3-small` を標準採用
- 回答モデルはコンソール設定で `5-nano / 5-mini / 5 / 4o-mini / 4o` を選択可能
- docsは更新中のものを含みます。最新運用は本READMEと `docs/supabase-setup.md` を優先してください。

## 関連ドキュメント
- `docs/supabase-setup.md`
- `docs/plan-feature-matrix.md`
- `docs/data-model-and-billing.md`
- `docs/contractor-operation-manual-draft.md`
- `docs/stripe-setup.md`








