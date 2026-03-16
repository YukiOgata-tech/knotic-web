# Supabase接続手順（認証 + データ）

最終更新: 2026-02-25

## 1. Supabaseプロジェクト作成
1. Supabaseで新規プロジェクトを作成（`dev` 環境）
2. `Project Settings > Data API` で以下を取得
   - `Project URL`
   - `publishable`（または `anon`）キー
   - `secret`（または `service_role`）キー

## 2. 環境変数設定
1. ルートの `.env.example` をコピーして `.env.local` を作成
2. 値を設定

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
INDEXER_RUNNER_SECRET=change-this-long-random-secret
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` がある場合はそちらを優先して使用します。  
未設定なら `NEXT_PUBLIC_SUPABASE_ANON_KEY` を利用します。

`SUPABASE_SECRET_KEY` がある場合はそちらを優先して使用します。  
未設定なら `SUPABASE_SERVICE_ROLE_KEY` を利用します。

## 3. Auth設定（Supabaseコンソール）
1. `Authentication > URL Configuration`
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`
2. `Authentication > Providers`
   - まずは `Email` を有効化

## 4. DB作成（SQL Editor）
`supabase/schema.sql` の内容をSQL Editorで実行してください。  
現在は **schema.sql 1ファイルに統合済み** です（追加パッチ実行は不要）。

このスキーマには以下が含まれています。
- マルチテナントテーブル
- 課金テーブル（`plans / subscriptions / billing_*`）
- Bot/RAG運用テーブル
- 管理コンソール関連テーブル（APIキー、インデックスジョブ、通知など）
- Hosted UI設定（目的、表示名、色設定など）
- RLSポリシー
- 新規ユーザー時の初期テナント自動作成トリガー

## 5. Storageバケット作成
Supabase Storageで次のバケットを作成してください。
1. `source-files`（PDF原本アップロード用）
2. `source-artifacts`（クロールHTML/抽出テキスト保存用）

いずれも公開不要（private）で運用してください。

## 6. このリポジトリで用意済みの接続基盤
- Browser client: `lib/supabase/client.ts`
- Server client: `lib/supabase/server.ts`
- Admin client: `lib/supabase/admin.ts`
- Session更新 proxy: `proxy.ts`, `lib/supabase/middleware.ts`
- 接続確認API: `app/api/supabase/ping/route.ts`
- インデックス実行API: `app/api/internal/indexing/run/route.ts`
- 回答API: `app/api/v1/chat/route.ts`

## 7. 接続確認
1. 開発サーバー起動
2. `GET /api/supabase/ping` にアクセス
3. `ok: true` が返れば接続成功
4. ログイン後に叩くと `user` が返る
5. `signup -> メール確認 -> /auth/callback -> /console` の導線が通ることを確認
6. 管理画面 `Sources` でURL/PDFを追加 -> `インデックス実行` でキュー登録
7. 開発検証は `Sources > キューを1件実行` を実行
8. 本番では `POST /api/internal/indexing/run` に `Authorization: Bearer $INDEXER_RUNNER_SECRET` を付与してCron実行


## 追加パッチ（監査ログ/運用ダッシュボード）


## 追加パッチ（Platform Admin Console）

最初の管理者ユーザー登録:
```sql
insert into public.platform_admin_users (user_id, role, is_active)
values ('<auth.users.id>', 'owner', true)
on conflict (user_id) do update set role = excluded.role, is_active = excluded.is_active;
```
