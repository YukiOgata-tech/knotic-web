# knotic-web

Knotic のマーケティングサイト + 管理コンソール + RAG運用基盤（開発中）です。  
既存事業 `make-it-tech.com` と運営者は同一ですが、リポジトリは分離しています。

## 概要
- Next.js App Router ベース
- Supabase（Auth / Postgres / Storage）を利用
- 管理画面は `/console`
- 提供チャネル想定:
  - API提供（契約者サーバー連携）
  - 埋め込みWidget（scriptタグ）
  - Hostedページ（`/b/[public_id]` 想定）

## 現在の実装状況

### 実装済み
- マーケティングページ群（基本導線）
- ライト/ダークモード切替
- ヘッダー/フッター、認証導線
- コンソールUI（左ナビの管理画面）
  - `/console/overview`
  - `/console/bots`
  - `/console/sources`
  - `/console/api-keys`
  - `/console/settings`
- Bot作成、公開切替、Widgetトークン発行、APIキー発行
- URL/PDFのソース登録
- インデックスジョブキュー投入
- インデックス処理基盤
  - URLクロール -> テキスト化 -> チャンク化 -> Embedding保存
  - PDF抽出 -> チャンク化 -> Embedding保存
- 回答API（RAG）
  - `POST /api/v1/chat`
  - 引用（citations）返却
  - 契約者APIキー / Widgetトークン / 公開Bot認証
- 制限強制（Bot数 / 月間メッセージ / ストレージ）
- 通知テーブル連携（上限近接・到達）

### 未実装 / 次フェーズ
- Hostedチャットページ本実装（`/b/[public_id]` のUI/UX完成）
- Widget配布スクリプト本実装（導入用scriptの最終形）
- CAPTCHA・高度レート制限などスパム対策の本番強化
- インデックスジョブの本番運用監視（失敗通知、再実行戦略）
- Stripe本連携（Webhookで `subscriptions` 自動同期）
- 通知既読化UI、履歴管理UI
- 監査ログ/運用ダッシュボード強化

## セットアップ

### 1. 依存関係
```bash
npm install
```

### 2. 環境変数
`.env.example` を `.env.local` にコピーして設定してください。

最低限必要:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（または `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- `SUPABASE_SECRET_KEY`（または `SUPABASE_SERVICE_ROLE_KEY`）
- `OPENAI_API_KEY`
- `INDEXER_RUNNER_SECRET`

### 3. Supabase SQL適用順
1. `supabase/schema.sql`
2. `supabase/patch-20260224-current-user-tenant-ids-definer.sql`
3. `supabase/patch-20260224-console-management.sql`
4. `supabase/patch-20260224-indexing-pipeline.sql`
5. `supabase/patch-20260224-quotas-and-notifications.sql`

### 4. Supabase Storageバケット作成
- `source-files`（PDF原本）
- `source-artifacts`（クロール/抽出成果物）

いずれも private 運用を推奨。

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
  - `Authorization: Bearer <INDEXER_RUNNER_SECRET>`
- `POST /api/v1/chat` RAG回答API

## 運用メモ
- Embeddingモデルは `text-embedding-3-small` を標準採用
- 失効/未払い時はボット応答停止、管理画面アクセスは継続する方針
- 開発中は `Sources` 画面からキュー1件実行が可能

## 関連ドキュメント
- `docs/supabase-setup.md`
- `docs/data-model-and-billing.md`
- `docs/plan-feature-matrix.md`
- `docs/contractor-operation-manual-draft.md`
