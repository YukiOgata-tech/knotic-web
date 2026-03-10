# Data Model / Billing設計メモ

最終更新: 2026-03-10

## 目的
- 後から作り直しを避けるため、MVP段階で本番拡張可能な境界を先に定義する
- 認証、マルチテナント、課金、RAG運用データを分離しつつ関連付ける

## コア境界

1. `auth.users`（Supabase Auth）: 認証の唯一ソース
2. `tenants` + `tenant_memberships`: 契約主体と権限
3. `plans` + `subscriptions` + `billing_customers` + `billing_events`: 課金
4. `bots` + `sources` + `source_pages` + `indexing_jobs`: RAG知識（File Search移行済み）
5. `chat_logs` + `usage_daily`: 運用/原価制御
6. `tenant_notifications`: 上限超過/運用通知
7. `tenant_api_keys` + `bot_public_tokens`: API/Widget認証
8. `tenant_contract_overrides`: 手動オーバーライド（銀行振込・請求書払い契約向け）
9. `audit_logs`: コンソール操作の全ミューテーション記録

> **注**: `documents` / `chunks` / `embeddings` テーブルおよび `pgvector` 拡張は
> 2026-03 パッチで削除済み（Legacy Vector RAG廃止）。

## RAGバックエンド（現行: OpenAI File Search）

**Legacy Vector RAGは廃止。File Search が唯一のRAGバックエンド。**

### インデックスフロー
```
URL/PDF登録
  → indexing_jobs キュー
  → processIndexingJob()（lib/indexing/pipeline.ts）
  → テキスト抽出（URL: fetch + HTML解析 / PDF: pdf-parse）
  → syncSourceTextToOpenAiFileSearch()（lib/filesearch/openai.ts）
  → OpenAI /files アップロード（purpose: assistants）
  → /vector_stores/{id}/files アタッチ
  → sources.file_search_file_id 更新
```

### チャットフロー（POST /api/v1/chat）
```
リクエスト受信
  → botPublicId / botId でBot解決
  → 強制停止フラグ確認（tenant / bot）
  → 認証確認（APIキー / Widgetトークン / テナントメンバー / 公開モード）
  → assertTenantCanConsumeMessage()（クォータ強制）
  → getBotOpenAiVectorStoreId()
  → answerWithOpenAiFileSearch()
      → OpenAI /responses API（file_search tool）
      → guardOutput()（禁止ワードフィルター）
  → citationFileIds → sources テーブル逆引き → 引用情報返却
  → chat_logs 記録 / usage_daily インクリメント
  → 上限近接通知（tenant_notifications）
```

### 関連カラム（パッチ適用済み）
| テーブル | カラム | 内容 |
|---|---|---|
| `bots` | `file_search_provider` | `"openai"` 固定 |
| `bots` | `file_search_vector_store_id` | OpenAI vector store ID |
| `bots` | `faq_questions` | チャットUIのクイックタップ用FAQ（最大5件、`text[]`） |
| `sources` | `file_search_provider` | `"openai"` 固定 |
| `sources` | `file_search_file_id` | OpenAI file ID（引用逆引きに使用） |
| `sources` | `file_search_last_synced_at` | 最終同期日時 |
| `sources` | `file_search_error` | 同期エラー文言 |
| `sources` | `index_mode` | `"raw"` or `"llm"` |
| `indexing_jobs` | `index_mode` | `"raw"` or `"llm"` |

## AIモデル設定

`bots` 単位で管理。テナント単位AI設定は廃止済み。

| 短縮名 | 実APIモデル名 |
|---|---|
| `5-nano` | `gpt-4.1-nano` |
| `5-mini` | `gpt-4.1-mini` |
| `5` | `gpt-4.1` |

- `4o` / `4o-mini` は2026-03パッチで制約から削除済み（廃止）
- モデル名変換は `lib/llm/responses.ts` の `toApiModelName()` が担当
- フォールバックモデル（`ai_fallback_model`）も同じ選択肢から設定可能

## 課金設計方針

- **プラン情報の唯一ソース**: `lib/billing/limits.ts` の `getTenantPlanSnapshot()`
- **優先順位**: `tenant_contract_overrides`（手動）> `subscriptions`（Stripe）
- サブスク状態の区分:
  - 有効: `trialing` / `active` / `past_due`
  - ブロック: `unpaid` / `canceled` / `paused` / `incomplete`
- 課金モード: `stripe` / `bank_transfer` / `invoice` / `manual`
- 監査性: `billing_events` にWebhookペイロードを記録
- 冪等性: `provider_event_id` / `provider_subscription_id` にユニーク制約

### プランが持つ制限値
| フィールド | 内容 |
|---|---|
| `max_bots` | Bot作成上限 |
| `internal_max_bots_cap` | 社内上書き上限（0=無効） |
| `max_hosted_pages` | Hosted URL公開Bot数上限 |
| `max_monthly_messages` | 月間メッセージ上限 |
| `max_storage_mb` | ストレージ上限（MB） |
| `has_api` | APIキー利用可否 |
| `has_hosted_page` | Hosted URL利用可否 |

### クォータアサーション関数（`lib/billing/limits.ts`）
- `assertTenantCanCreateBot()` — Bot作成前に呼ぶ
- `assertTenantCanConsumeMessage()` — チャット毎に呼ぶ
- `assertTenantCanIndexData(bytes)` — インデックス前に呼ぶ
- `assertTenantCanUseHostedPage(botId?)` — Hosted URL公開前に呼ぶ

上限超過時は `QuotaError` をスロー、かつ `tenant_notifications` に通知を記録。

## 初期運用ルール
- 新規サインアップ時に `tenant` / `profile` / `membership(editor)` を自動作成
- RLSですべての業務テーブルを `tenant_id` 境界に制限
- 管理者相当処理は service role key (`SUPABASE_SECRET_KEY`) 経由で実行
- コンソールの全ミューテーションで `writeAuditLog()` 必須
- 代理閲覧中（`impersonation.active`）は書き込み禁止

## DBスキーマ管理
- `supabase/schema.sql` — ベーススキーマ（初期セットアップ後は直接変更禁止）
- `supabase/patch-202603.sql` — 2026-03統合パッチ（File Search移行、Legacy Vector削除、index_mode追加、モデル制約更新）
- `supabase/patch-20260309-faq-questions.sql` — FAQ質問ボタン用カラム追加
- 新規追加は `patch-YYYYMMDD-<説明>.sql` を作成してファイル名順に適用

## 実装ファイル早見表
| 役割 | ファイルパス |
|---|---|
| File Search操作 | `lib/filesearch/openai.ts` |
| インデックスパイプライン | `lib/indexing/pipeline.ts` |
| モデル名変換 | `lib/llm/responses.ts` |
| プラン制限・クォータ | `lib/billing/limits.ts` |
| Supabase接続（3種） | `lib/supabase/client.ts` / `server.ts` / `admin.ts` |
| チャットAPI | `app/api/v1/chat/route.ts` |
| ホステッドチャット用API | `app/api/hosted/chat/route.ts` |
| コンソールデータ取得 | `app/console/_lib/data.ts` |
| コンソールServer Actions | `app/console/actions.ts` |
| ホステッドチャットUI | `app/chat-by-knotic/[public_id]/` |
| ストレージバケット | `source-files`（PDF原本）/ `source-artifacts`（抽出テキスト）|
