# Supabase接続手順（認証 + データ）

最終更新: 2026-02-24

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

## 4. 最小テーブル作成（SQL Editor）
MVP開始時の最小構成例:

```sql
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
```

## 5. このリポジトリで用意済みの接続基盤
- Browser client: `lib/supabase/client.ts`
- Server client: `lib/supabase/server.ts`
- Admin client: `lib/supabase/admin.ts`
- Session更新 proxy: `proxy.ts`, `lib/supabase/middleware.ts`
- 接続確認API: `app/api/supabase/ping/route.ts`

## 6. 接続確認
1. 開発サーバー起動
2. `GET /api/supabase/ping` にアクセス
3. `ok: true` が返れば接続成功
4. ログイン後に叩くと `user` が返る

## 7. 次に実装すること（推奨順）
1. `signup/login` ページを Supabase Auth に接続
2. サインアップ時に `tenants` と `profiles` を初期化
3. 管理画面ルートを `auth.getUser()` で保護
4. RLSポリシーを `tenant_id` 境界で整備
