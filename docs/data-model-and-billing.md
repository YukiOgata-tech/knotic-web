# Data Model / Billing設計メモ（v0）

最終更新: 2026-02-24

## 目的
- 後から作り直しを避けるため、MVP段階で本番拡張可能な境界を先に定義する
- 認証、マルチテナント、課金、RAG運用データを分離しつつ関連付ける

## コア境界
1. `auth.users`（Supabase Auth）: 認証の唯一ソース
2. `tenants` + `tenant_memberships`: 契約主体と権限
3. `plans` + `subscriptions` + `billing_customers` + `billing_events`: 課金
4. `bots` + `sources` + `documents` + `chunks` + `embeddings`: RAG知識
5. `chat_logs` + `usage_daily` + `response_cache`: 運用/原価制御

## 課金設計方針
- プロバイダ抽象化: `billing_provider` enum を持ち、将来のPSP変更余地を確保
- サブスク状態: `subscription_status` を保持し、上限判定は状態+プランの組み合わせで実施
- 監査性: `billing_events` にWebhookペイロードを記録
- 冪等性: `provider_event_id` と `provider_subscription_id` にユニーク制約

## 初期運用ルール
- 新規サインアップ時に `tenant` / `profile` / `membership(owner)` を自動作成
- RLSですべての業務テーブルを `tenant_id` 境界に制限
- 管理者相当処理は server key (`SUPABASE_SECRET_KEY` 優先) 経由で実行

## 実装ファイル
- スキーマ本体: `supabase/schema.sql`
- 接続基盤: `lib/supabase/*`
- 認証導線: `app/signup/page.tsx`, `app/login/page.tsx`, `app/auth/callback/route.ts`
- 保護ページ: `app/app/page.tsx`
