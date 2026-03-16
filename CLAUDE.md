# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**knotic-web** は、URLとPDFからRAG型AIチャットボットを構築できるマルチテナントSaaSプラットフォームです。単一の Next.js アプリが以下の4つのコンテキストを提供します。

1. **マーケティングサイト** — 公開ページ（`/`、`/features`、`/pricing` など）
2. **テナントコンソール** — `/console/*`（顧客向け認証済みダッシュボード）
3. **ホステッドチャットUI** — `/chat-by-knotic/[public_id]`（公開チャットボットページ）
4. **プラットフォーム管理コンソール** — `operations.knotic.<domain>` → ミドルウェアで `/sub-domain/*` にリライト

## コマンド

```bash
npm install          # 依存関係インストール
npm run dev          # 開発サーバー起動（http://localhost:3000）
npm run build        # 本番ビルド（リリース前確認用）
npm run start        # ビルド済みアプリをローカルで起動
npm run lint         # ESLint（Next.js + TypeScript 設定）
```

自動テストスイートは未実装。API変更の確認は実際の入力でエンドポイントを手動検証すること。自動チェックは lint のみ。

**git 操作ルール**: commit・push はユーザーから明示的に依頼されたときのみ実行すること。`git status` / `git diff` / `git log` などの確認系コマンドは自由に使ってよい。

## アーキテクチャ

### ルーティング & ミドルウェア（`proxy.ts` + `lib/supabase/middleware.ts`）

`proxy.ts` のミドルウェアは2つの役割を持つ:
- リクエストごとに Supabase 認証セッションを更新する
- `operations.*` サブドメインのリクエストを `/sub-domain` プレフィックスにリライトする（プラットフォーム管理）

### Supabase クライアント

用途が異なる3種類のクライアント（互換性なし）:
- `lib/supabase/client.ts` — ブラウザ専用（React Client Components）
- `lib/supabase/server.ts` — サーバー専用・Cookieセッション付き（Server Components、Server Actions）
- `lib/supabase/admin.ts` — サービスロールキー・RLS回避（APIルート、インデックスパイプライン）

### コンソールのデータフロー

コンソールページは Server Components。`app/console/_lib/data.ts` の `requireConsoleContext()` がセッションを検証し `{ user, membership, impersonation }` を返す。データ変更は `app/console/actions.ts` の `"use server"` アクション経由で行い、必ず以下の順序で処理する:
1. `getTenantContext(requireEditor?)` で認証 + 代理閲覧ガード
2. 課金アサーションヘルパー（`assertTenantCanCreateBot` など）の呼び出し
3. `writeAuditLog()` で監査ログを記録
4. 完了時に `redirect()` で `?notice=` または `?error=` を渡す

### RAG パイプライン

`POST /api/v1/chat`（`app/api/v1/chat/route.ts`）:
1. `botPublicId` または `botId` でボットを解決
2. テナント/ボットの強制停止フラグを確認
3. APIキー（`x-knotic-api-key`）、ウィジェットトークン（`x-knotic-widget-token`）、ログイン済みテナントメンバー、公開モードのいずれかで認証
4. `assertTenantCanConsumeMessage()` で月間メッセージクォータを強制
5. クエリをエンベッド → OpenAI File Search（vector store）→ コンテキスト構築 → OpenAI Responses API 呼び出し
6. `chat_logs` に記録、`usage_daily` をインクリメント、上限近接通知を発火

インデックスパイプライン（`lib/indexing/pipeline.ts`）:
- URLソース: ページまたはサイトマップXMLを取得、raw/テキストを `source-artifacts` バケットにアップロード、テキストをチャンク化 → OpenAI File Search 同期
- PDFソース: `source-files` バケットからダウンロード、`pdf-parse` でテキスト抽出 → 同様の File Search 同期フロー
- 手動実行: `runIndexingWorkerAction` または `POST /api/internal/indexing/run`（`Authorization: Bearer <INDEXER_RUNNER_SECRET>` 必須）

### File Search（RAGバックエンド）

`lib/filesearch/openai.ts` が OpenAI File Search 操作を集約:
- `ensureOpenAiVectorStoreForBot()` — Bot の vector store を作成/取得（`bots.file_search_vector_store_id` に保存）
- `syncSourceTextToOpenAiFileSearch()` — ソーステキストを OpenAI /files にアップロードし vector store にアタッチ、`sources.file_search_file_id` を更新
- `answerWithOpenAiFileSearch()` — File Search tool を使って回答生成

### 課金 / プラン制限

`lib/billing/limits.ts` がプラン制約の唯一の情報源。`subscriptions` + `plans` テーブル（Stripe経由）または `tenant_contract_overrides`（手動オーバーライド）から読み込む。サブスクリプションブロック・ボット上限・メッセージ上限・ストレージ上限で `QuotaError` をスロー。

許可AIモデル: `gpt-5-mini`（Standard）、`gpt-5-nano`（Mini）、`gpt-4o-mini`（Nano）— `lib/llm/responses.ts` で正規化。

### DBスキーマ管理

- `supabase/schema.sql` — ベーススキーマ（最初に実行）
- `supabase/patch-*.sql` — ファイル名順に適用する差分パッチ

カラムやテーブルを追加する場合は `patch-YYYYMMDD-<説明>.sql` を新規作成すること。初期セットアップ後にベーススキーマを直接変更しないこと。

### 環境変数

全一覧は `.env.example` を参照。主要グループ:
- **Supabase 公開用** (`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` または `ANON_KEY`)
- **Supabase サーバー用** (`SUPABASE_SECRET_KEY` または `SUPABASE_SERVICE_ROLE_KEY`)
- **OpenAI** (`OPENAI_API_KEY`、`OPENAI_EMBEDDING_MODEL=text-embedding-3-small`)
- **Stripe** (`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`STRIPE_PRICE_*` 3種)
- **内部ランナー** (`INDEXER_RUNNER_SECRET`、`BILLING_RUNNER_SECRET`)
- **Resend** (`RESEND_API_KEY`、`RESEND_FROM_EMAIL`、`RESEND_CONTACT_TO_EMAIL`)

`lib/env.ts` が環境変数アクセスを集約し、未設定時はわかりやすいエラーをスロー。

## コーディング規約

- **TypeScript** を全体で使用。インデント2スペース。`lib/` は named export を優先
- **Tailwind CSS v4** — ユーティリティクラスのみ。`cn()` マージは `lib/utils.ts`
- **shadcn/ui** コンポーネントは `components/ui/` に配置。追加は `npx shadcn add <component>`
- **Server Actions**（`"use server"`）は成功・エラーいずれも `redirect()` でサーチパラメータを渡す。アクションからのJSONレスポンスは不可
- **監査ログ** はコンソールの全ミューテーションで `writeAuditLog()` を呼び出すこと（必須）
- **代理閲覧ガード**: データを変更するアクションは `impersonation?.active` を確認し、active なら例外をスローすること
- シークレットはハッシュ（`key_hash`、`public_token_hash`、`token_hash`）のみ保存。生の値は一度だけ表示し、永続化しない
- エンベッディングモデルは `text-embedding-3-small` 固定（ベクトル次元数1536はスキーマにハードコード）

## Supabase ストレージバケット（必須・private設定）

- `source-files` — テナントがアップロードしたPDF原本
- `source-artifacts` — インデックス処理で生成されたクロール済みHTML・抽出テキスト
