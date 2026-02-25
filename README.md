# knotic-web

Knotic のマーケティングサイト + 管理コンソール + RAG基盤のリポジトリです。  
既存事業 `make-it-tech.com` と運営者は同一ですが、開発リポジトリは分離しています。

## 概要
- Framework: Next.js App Router
- Backend: Supabase（Auth / Postgres / Storage）
- AI: OpenAI Responses + Embeddings
- Console: `/console`
- Hosted Chat URL: `/chat-by-knotic/[public_id]`

## 実装済み（2026-02-25時点）
- マーケティングページ群（トップ/機能/価格/FAQ等）
- ダーク/ライトモード切替
- 認証導線（signup/login/callback）
- コンソール画面
  - `/console/overview`
  - `/console/bots`
  - `/console/sources`
  - `/console/api-keys`
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
- DB
  - `supabase/schema.sql` に統合済み（パッチ不要）

## プラン（現在実装値）
- Lite: `¥10,000` / Bot `1` / 月間 `1,000` メッセージ
- Standard: `¥24,800` / Bot `2` / 月間 `5,000` メッセージ
- Pro: `¥100,000` / Bot表示無制限（内部上限あり） / 月間 `20,000` メッセージ

## 未実装 / 次フェーズ
- Stripe本番連携（Checkout/Portal/Webhookの本実装）
- 未払い/期限切れ時の課金状態同期の完全自動化
- Widget配布スクリプト本実装（`<script ...>` の公開導線完成）
- CAPTCHA/高度レート制限/不正対策の本番強化
- インデックスワーカーの本番監視（再試行戦略、失敗通知の強化）
- 通知の既読化UI・履歴UI
- 監査ログ / 運用ダッシュボード拡張
- 社内用途向けのより詳細なアクセス制御（必要時）

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

### 3. DB作成
`supabase/schema.sql` を Supabase SQL Editor で実行します。  
現在は **schema.sql 1ファイルで完結** しています。

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

