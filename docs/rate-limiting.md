# レート制限・ロックアウト設計

最終更新: 2026-03-26

## 概要

Vercel のサーバーレス環境では各リクエストが独立したインスタンスで処理されるため、
プロセスのメモリに状態を保持するレート制限は複数インスタンス間で共有されず機能しない。

本実装では **Supabase の PostgreSQL** をカウンターストアとして使用し、
全インスタンスが同じ DB を参照することで一貫した制限を実現している。

---

## テーブル構成

### `rate_limit_buckets`

汎用スライディングウィンドウカウンター。

| カラム | 型 | 説明 |
|---|---|---|
| `key` | TEXT (PK) | 制限対象の識別子（例: `login:ip:1.2.3.4`） |
| `count` | INTEGER | ウィンドウ内のリクエスト数 |
| `window_start` | TIMESTAMPTZ | 現ウィンドウの開始時刻 |
| `expires_at` | TIMESTAMPTZ | ウィンドウ終了時刻（期限切れでリセット） |

**キー命名規則:**

```
login:ip:min:{ip}      ログイン IP 毎分
login:ip:hr:{ip}       ログイン IP 毎時
signup:ip:hr:{ip}      サインアップ IP 毎時
signup:email:hr:{hash} サインアップ メール毎時（SHA-256）
chat:ip:min:{ip}       チャット API IP 毎分
```

### `auth_lockouts`

ログイン失敗の累積ロックアウト管理。

| カラム | 型 | 説明 |
|---|---|---|
| `email_hash` | TEXT (PK) | メールアドレスの SHA-256 ハッシュ |
| `fail_count` | INTEGER | 累積失敗回数 |
| `locked_until` | TIMESTAMPTZ | ロック解除時刻（NULL = 未ロック） |
| `last_fail_at` | TIMESTAMPTZ | 最終失敗時刻（クリーンアップ用） |

---

## DB 関数

### `rate_limit_check(p_key, p_window_seconds) → INTEGER`

`INSERT ... ON CONFLICT DO UPDATE` によるアトミックなカウント加算。
ウィンドウ期限切れの場合は自動でカウントをリセットして 1 を返す。
戻り値（加算後カウント）が呼び出し側の上限を超えていれば 429 を返す。

### `auth_record_login_failure(p_email_hash) → JSONB`

ログイン失敗を記録し、閾値を超えた場合にロックをセットする。

| 失敗回数 | ロック時間 |
|---|---|
| 10 回 | 15 分 |
| 20 回 | 60 分 |

期限切れのロックは次回の失敗時に自動リセット。
ログイン成功時は `auth_lockouts` から該当行を削除（`clearLoginLockout()`）。

---

## 適用範囲

### 認証フォーム（`/api/auth/bot-check`）

| チェック種別 | 対象 | 上限 |
|---|---|---|
| IP レート制限 | ログイン | 10 回/分、40 回/時 |
| IP レート制限 | サインアップ | 5 回/時 |
| メール レート制限 | サインアップ | 3 回/時 |
| ロックアウト確認 | ログイン | 上記閾値参照 |
| ハニーポット | ログイン・サインアップ | サイレントブロック |
| タイミングチェック | ログイン・サインアップ | 1 秒未満でブロック |
| 使い捨てメール | サインアップ | サイレントブロック |

ロックアウトの記録は `/api/auth/login-failure` で行い、
ログインフォームが Supabase Auth のサインイン失敗後に非同期で呼び出す。

### チャット API（`/api/v1/chat`）

| 認証モード | IP レート制限 |
|---|---|
| `public`（認証なし） | 20 回/分 |
| `widget`（ウィジェットトークン） | 40 回/分 |
| `api_key` | 制限なし（テナント管理） |
| `internal_user` | 制限なし（テナントメンバー） |

---

## フェイルオープン設計

DB エラー時は制限をスキップして `allowed: true` を返す。
正規ユーザーが DB 障害でブロックされることを防ぐための設計。
エラーは `console.error` でログに記録される（Vercel Logs で確認可能）。

---

## クリーンアップ（pg_cron）

| ジョブ名 | スケジュール | 内容 |
|---|---|---|
| `rate-limit-bucket-cleanup` | 毎日 04:00 UTC | 期限切れバケットを削除 |
| `auth-lockout-cleanup` | 毎日 04:00 UTC | 100 時間以上更新のないロックアウト行を削除 |

---

## コード構成

```
lib/rate-limit/db.ts          汎用 DB レート制限ユーティリティ
lib/auth/auth-rate-limit.ts   認証フォーム向けレート制限・ロックアウト
app/api/auth/bot-check/       ログイン・サインアップ事前チェックエンドポイント
app/api/auth/login-failure/   ログイン失敗記録エンドポイント
app/api/v1/chat/              チャット API（IP レート制限適用済み）
supabase/patch-20260326-rate-limit-tables.sql  テーブル・関数・cron 定義
```
