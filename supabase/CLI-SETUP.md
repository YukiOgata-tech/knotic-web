# Supabase CLI メモ

## 接続情報

| 項目 | 値 |
|---|---|
| プロジェクトRef | `wbsrawibepsvcvkyzwtm` |
| プロジェクトURL | `https://wbsrawibepsvcvkyzwtm.supabase.co` |
| CLI バージョン | v2.76.13（`npx supabase --version`） |

## 現状

- `supabase/config.toml` が存在しない → CLIのマイグレーション管理**未初期化**
- CLI は未ログイン状態（個人アクセストークンが必要）
- `.env.local` に直接PostgreSQL接続URLはない

## CLIを使えるようにする

### 方法A — ブラウザでログイン

```bash
npx supabase login
# ブラウザが開くのでダッシュボードで personal access token を発行してペースト
```

### 方法B — 環境変数で指定（CI/自動化向け）

```bash
# Supabase ダッシュボード > Account > Access Tokens で発行
export SUPABASE_ACCESS_TOKEN=sbp_xxxx

npx supabase db push --project-ref wbsrawibepsvcvkyzwtm
```

## ログイン後に使えるコマンド例

```bash
# リモートのスキーマをローカルに取り込む
npx supabase db pull --project-ref wbsrawibepsvcvkyzwtm

# ローカルの migrations をリモートに適用
npx supabase db push --project-ref wbsrawibepsvcvkyzwtm

# 差分確認
npx supabase db diff --project-ref wbsrawibepsvcvkyzwtm

# マイグレーション一覧
npx supabase migration list --project-ref wbsrawibepsvcvkyzwtm
```

## SQLパッチの手動適用（CLI未ログインの場合）

現状はダッシュボードの SQL Editor から手動実行する。

1. [Supabase Dashboard](https://supabase.com/dashboard/project/wbsrawibepsvcvkyzwtm) を開く
2. 左メニュー「SQL Editor」
3. `supabase/patch-*.sql` の内容をファイル名順に貼り付けて実行

## 適用済みパッチ

| ファイル | 内容 |
|---|---|
| `schema.sql` | ベーススキーマ（最初に1回のみ実行） |
| `patch-20260228-hosted-rooms-and-invites.sql` | Hosted招待・ルーム機能 |

> 新しいパッチを追加した場合はこの表を更新すること

## Edge Functions デプロイ

### 初回セットアップ

```bash
# CLIにログイン
npx supabase login

# プロジェクトにリンク
npx supabase link --project-ref wbsrawibepsvcvkyzwtm
```

### index-url 関数のデプロイ

```bash
# 関数をデプロイ
npx supabase functions deploy index-url --project-ref wbsrawibepsvcvkyzwtm

# シークレット設定（OPENAI_API_KEYは必須）
npx supabase secrets set OPENAI_API_KEY=<your-key> --project-ref wbsrawibepsvcvkyzwtm
```

またはダッシュボードから:
1. [Supabase Dashboard](https://supabase.com/dashboard/project/wbsrawibepsvcvkyzwtm) → Edge Functions
2. `supabase/functions/index-url/index.ts` の内容を貼り付けてデプロイ
3. Settings → Edge Function Secrets → `OPENAI_API_KEY` を追加

### Vercel Pro に移行する場合（インライン SSE に切り替え）

`hosted-config-editor.tsx` の `handleUrlSubmit` で呼び出し先を変更するだけ:
- **Supabase Functions（現在）**: Step1 `/api/v1/index-url-init` → Step2 Edge Function SSE
- **Vercel Pro（切替後）**: `/api/v1/index-url` に直接 POST（既存ルート、変更なし）
