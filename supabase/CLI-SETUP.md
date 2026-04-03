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

## SQLスキーマの手動適用（CLI未ログインの場合）

現状はダッシュボードの SQL Editor から手動実行する。

1. [Supabase Dashboard](https://supabase.com/dashboard/project/wbsrawibepsvcvkyzwtm) を開く
2. 左メニュー「SQL Editor」
3. `supabase/schema-02.sql` の内容を貼り付けて実行

## 適用対象ファイル

| ファイル | 内容 |
|---|---|
| `schema-02.sql` | 現行の統合スキーマ（新規環境はこれ1本で再現） |

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
