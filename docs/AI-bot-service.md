# knotic AI Bot Service 現行仕様書
更新日: 2026-04-04  
ステータス: Current

---

## 0. この文書の位置づけ
この文書は、`knotic-web` リポジトリにおける **現行のAIチャットボットSaaS実装** をまとめたものです。  
初期構想や検討メモではなく、現在のコードと `supabase/schema-02.sql` を基準に整理しています。

### 0.1 Source of Truth
- DB構造: `supabase/schema-02.sql`
- アプリ実装: `app/`, `lib/`, `components/`
- 運用補助資料: `README.md`, `docs/運用マニュアル.md`, `docs/stripe-setup.md`, `docs/supabase-setup.md`

---

## 1. サービス概要
knotic は、URL やファイルを登録するだけで、専用AIチャットボットを作成し、以下の3つの形で公開できるマルチテナントSaaSです。

1. Hosted Chat
2. Widget 埋め込み
3. API 呼び出し

主な用途:
- 問い合わせ自動化
- マニュアル案内
- FAQ検索
- 社内ナレッジ検索
- オンボーディング支援

---

## 2. 現行アーキテクチャ
### 2.1 アプリケーション構成
- フロント/サーバー: Next.js App Router
- 認証/DB/Storage: Supabase
- AI応答: OpenAI Responses API
- ナレッジ検索: OpenAI File Search
- 課金: Stripe
- メール: Resend

### 2.2 主要な公開導線
- サービスサイト: `/`
- 契約者コンソール: `/console`
- Hosted Chat: `/chat-by-knotic/{bot_public_id}`
- Widget配布スクリプト: `/widget.js`
- Platform Admin: `operations.<domain>` から `/sub-domain` にリライト

### 2.3 マルチテナント前提
- すべての契約主体は `tenants` に属する
- Bot、Source、Usage、APIキー、監査ログ、通知は `tenant_id` を基準に分離
- RLS によって契約者コンソールの参照/更新範囲を制御

---

## 3. 提供チャネル
### 3.1 Hosted Chat
- 共有URLで公開できるチャットページ
- URL形式: `/chat-by-knotic/{bot_public_id}`
- 公開モードと社内限定モードの両方をサポート
- Widget埋め込み時は `?embed=1&widgetToken=...` 形式で iframe として利用

### 3.2 Widget
- 顧客サイトに `<script>` タグを貼るだけで利用可能
- WidgetトークンによりBotを認証
- `allowed_origins` による埋め込み元ドメイン制限あり
- 表示モード:
  - `overlay`
  - `redirect`
  - `both` を想定した設定値を保持
- 表示位置:
  - `right-bottom`
  - `right-top`

### 3.3 API
- エンドポイント: `POST /api/v1/chat`
- 認証:
  - `x-knotic-api-key`
  - または `Authorization: Bearer knotic_api_...`
- 上位プランでのみ利用可能

---

## 4. ユーザー・権限モデル
### 4.1 契約者側
- `editor`
  - テナント設定、Bot作成、Source追加、Widget設定、APIキー発行、メンバー招待などを実行可能
- `reader`
  - 閲覧中心
  - 将来的な権限制御拡張を見越した役割

### 4.2 テナントオーナー
- `tenants.owner_user_id` で表現
- 初回サインアップ時はテナント作成 + `editor` membership 付与

### 4.3 Platform Admin
- `platform_admin_users`
- ロール:
  - `owner`
  - `staff`
- `/sub-domain` 配下でテナント横断の運用管理を実施

### 4.4 Hosted利用者
- 公開Bot利用者はログイン不要
- 社内限定Botは `tenant_memberships` のアクティブメンバーのみ利用可能
- さらに `bot_hosted_access_blocks` による Bot 単位制限あり

---

## 5. Bot とナレッジ管理
### 5.1 Bot
1つの Bot は以下を持ちます。
- 公開ID (`public_id`)
- 表示名、説明、用途
- 公開/非公開
- アクセスモード
  - `public`
  - `internal`
- Hosted UI設定
  - welcome message
  - placeholder
  - disclaimer
  - citation 表示可否
  - 履歴ターン数
  - ヘッダー/フッター配色
  - FAQ候補
  - ロゴ
- Widget設定
  - 有効/無効
  - モード
  - 表示位置
  - ラベル
  - 保持ポリシー文言
  - 新規タブ遷移可否
- AI設定
  - `gpt-5-mini`
  - `gpt-5-nano`
  - `gpt-4o-mini`
  - fallback model
  - max output tokens

### 5.2 Source
Bot に投入できる Source は以下です。
- `url`
- `pdf`
- `file`

対応ファイル形式:
- 文書: `pdf`, `doc`, `docx`, `pptx`, `tex`, `txt`, `md`
- Web/テキスト: `html`, `css`, `json`
- コード: `c`, `cpp`, `cs`, `go`, `java`, `js`, `ts`, `py`, `rb`, `rs`, `sh`, `php`
- 表形式: `csv`, `xlsx`, `xls`

### 5.3 ステータス
- Bot: `draft`, `queued`, `running`, `ready`, `failed`, `archived`
- Source: `queued`, `running`, `ready`, `failed`, `deleted`

---

## 6. ナレッジ投入とインデックス方式
### 6.1 現行方式
現行実装は、初期案にあった独自 `chunks` / `embeddings` テーブル中心の方式ではなく、**OpenAI File Search 同期** を中心にしています。

### 6.2 URL投入
- URLを `sources` に登録
- `indexing_jobs` にキュー登録
- ワーカーが URL を取得
- XML sitemap の場合は配下URLを抽出して複数ページを巡回
- 各ページの抽出テキストとHTMLを `source_pages` / Storage artifact に保存
- 集約テキストを OpenAI File Search に同期

### 6.3 ファイル投入
- `source-files` バケットへアップロード
- PDFや文書ファイルを OpenAI File Search に同期
- `csv`, `xlsx`, `xls` は Markdown 化して同期

### 6.4 使用する Storage
- `source-files`
  - 原本ファイル保存
- `source-artifacts`
  - URL取得結果や抽出テキスト
- `bot-logos`
  - Botロゴ画像

### 6.5 インデックス処理の特徴
- 非同期キュー型
- `indexing_jobs` で状態管理
- `source_pages` にURL取得結果を保持
- OpenAI vector store / file ID を `bots` と `sources` に保持

---

## 7. チャット応答の動作
### 7.1 回答生成
`POST /api/v1/chat` では以下を実施します。

1. Bot特定
2. テナント停止/Bot停止の確認
3. 認証方式の判定
4. プラン制限チェック
5. OpenAI File Search でナレッジ検索
6. OpenAI Responses API で回答生成
7. citation 整形
8. `chat_logs` / `usage_daily` 更新
9. 上限接近時は `tenant_notifications` 作成

### 7.2 認証モード
- APIキー認証
- Widgetトークン認証
- テナントメンバー認証
- 公開アクセス

### 7.3 セキュリティ制御
- Widget は `allowed_origins` を検証
- 公開/Widget アクセスは IP ベースのレート制限あり
- 契約状態・メッセージ上限・Hosted上限を毎回判定
- 内部技術情報が応答に混ざる場合はガードで差し替え

### 7.4 citation
- URLソースはページURLを返す
- PDF / file ソースは署名付きURLで返す
- テキスト本文中の引用マーカーは除去し、別配列で返す

---

## 8. Hosted Chat の公開モード
### 8.1 公開モード
- `is_public = true`
- 一般公開利用可能
- プラン上の Hosted URL 利用可否・件数制限を受ける

### 8.2 社内限定モード
- `access_mode = internal`
- または `require_auth_for_hosted = true`
- テナントメンバーのみ利用可能
- 必要に応じて Bot 単位で追加制限

### 8.3 プレビュー
- テナントメンバーは非公開状態でもプレビュー表示可能
- 一般ユーザー向け公開可否とは別扱い

---

## 9. Widget 仕様
### 9.1 埋め込みコード
```html
<script
  src="https://your-domain.com/widget.js"
  data-bot-id="bot_xxxxxxxxxxxx"
  data-widget-token="knotic_wgt_xxxxxxxxx"
  data-mode="overlay"
  data-position="right-bottom"
></script>
```

### 9.2 必須属性
- `data-bot-id`
- `data-widget-token`

### 9.3 任意属性
- `data-mode`
  - `overlay`
  - `redirect`
- `data-position`
  - `right-bottom`
  - `right-top`

### 9.4 現行仕様上の注意
- 旧文書の `data-public-token` は現行実装では使用しない
- 実際の属性名は `data-widget-token`
- Widget は `public/widget.js` から配布される
- 事前に Bot を `ready` かつ `is_public` にしておく必要がある

---

## 10. 課金・プラン制御
### 10.1 課金基盤
- Stripe を標準採用
- `subscriptions` と `billing_events` で契約状態を保持
- Webhook で契約同期

### 10.2 手動契約オーバーライド
- `tenant_contract_overrides` により Stripe を無視して制御可能
- 主な用途:
  - 請求書払い
  - 銀行振込
  - 特別契約
  - 運営による暫定制御

### 10.3 現行プラン値
`schema-02.sql` 時点の主要値:

| Plan | 月額 | Bot上限表示 | 内部Bot上限 | 月間メッセージ | ストレージ | API | Hosted | Widget | APIキー上限 | Hosted上限 |
|---|---:|---:|---:|---:|---:|---|---|---|---:|---:|
| Lite | ¥10,000 | 1 | 50 | 1,000 | 100MB | 不可 | 不可 | 可 | 0 | 0 |
| Standard | ¥24,800 | 2 | 50 | 5,000 | 1,024MB | 可 | 可 | 可 | 2 | 2 |
| Pro | ¥100,000 | 無制限表示 | 50 | 20,000 | 10,240MB | 可 | 可 | 可 | 10 | 50 |

補足:
- Pro の Bot 無制限は表示上の扱いで、内部上限は 50
- 許可オリジン数はプラン上 `null` でも、内部CAPは 200

### 10.4 実際に制御している上限
- Bot作成数
- 月間メッセージ数
- ストレージ使用量
- Hosted URL 利用可否と件数
- API利用可否
- APIキー発行数

### 10.5 契約状態
運用上の主要状態:
- `trialing`
- `active`
- `past_due`
- `unpaid`
- `canceled`
- `paused`
- `incomplete`

`trialing`, `active`, `past_due` は継続利用側。  
`unpaid`, `canceled`, `paused`, `incomplete` は制限停止側として扱います。

---

## 11. Console 機能
### 11.1 契約者コンソール
主な画面:
- Overview
- Billing
- Bots
- Sources
- API Keys
- Audit
- Settings
- Members
- Operations

主な操作:
- Bot作成
- Hosted / Widget 設定
- URL追加
- ファイル追加
- 手動インデックス
- Widgetトークン再発行
- APIキー発行/失効
- メンバー招待
- Bot単位アクセス制御
- プラン変更

### 11.2 Platform Admin
主な機能:
- テナント一覧
- テナント作成
- 契約オーバーライド設定
- Platform監査ログ閲覧
- インデックスジョブ監視
- プラン上限編集
- 契約者コンソールへの代理閲覧

---

## 12. 招待・チーム利用
### 12.1 メンバー招待
- `tenant_member_invites`
- 招待URLまたはトークンで参加
- 招待メールは Resend で送信
- 再送信制限あり

### 12.2 アカウント種別
サインアップトリガーは `account_type` を考慮します。

- `owner`
  - テナントを自動作成
  - `profiles.default_tenant_id` を設定
  - `editor` membership を付与
- `member`
  - テナントは自動作成しない
  - 招待参加を前提に `profiles` のみ作成

### 12.3 Bot単位アクセス制御
- 社内向けBotに対して、特定メンバーだけアクセスをブロック可能
- `bot_hosted_access_blocks` を使用

---

## 13. 監査・通知・運用
### 13.1 監査ログ
- `audit_logs`
- Bot、Source、APIキー、Widget、メンバー、契約関連の操作を記録

### 13.2 通知
- `tenant_notifications`
- 上限接近や上限超過を通知

### 13.3 強制停止
- `tenants.force_stopped`
- `bots.force_stopped`
- 運営判断で個別停止可能

### 13.4 運用ジョブ
`schema-02.sql` では以下も含みます。
- 監査ログ保持期間の自動削除
- レートリミットテーブル清掃
- 認証ロックアウト清掃

---

## 14. レート制限・安全対策
### 14.1 チャット
- 公開/Widget アクセスに IP ベースの制限
- DB-backed rate limit を利用

### 14.2 認証保護
- `rate_limit_buckets`
- `auth_lockouts`
- 連続失敗時のロックアウト

### 14.3 問い合わせフォーム
- honeypot
- 送信開始からの経過時間チェック
- Origin / Referer チェック
- 入力検証
- レート制限

### 14.4 データ分離
- Supabase RLS
- `tenant_id` / `bot_id` による境界管理

---

## 15. 主要API
### 15.1 外部/公開系
- `POST /api/v1/chat`
  - Botへの質問送信
- `GET /api/widget/config`
  - Widget設定取得
- `POST /api/contact`
  - 問い合わせ送信

### 15.2 Hosted系
- `POST /api/hosted/chat`
- `POST /api/hosted/rooms`
- `POST /api/hosted/messages`

### 15.3 内部系
- `POST /api/internal/indexing/run`
- `POST /api/internal/billing/enforce`

### 15.4 Stripe系
- `POST /api/stripe/webhook`
- `POST /api/stripe/checkout`
- `POST /api/stripe/portal`
- `POST /api/stripe/subscription/cancel`
- `POST /api/stripe/subscription/resume`

---

## 16. データモデル概要
### 16.1 契約・権限
- `profiles`
- `tenants`
- `tenant_memberships`
- `platform_admin_users`

### 16.2 課金
- `plans`
- `billing_customers`
- `subscriptions`
- `billing_events`
- `tenant_contract_overrides`

### 16.3 Bot / ナレッジ
- `bots`
- `bot_public_tokens`
- `sources`
- `indexing_jobs`
- `source_pages`

### 16.4 チャット / 使用量
- `chat_logs`
- `usage_daily`
- `hosted_chat_rooms`
- `hosted_chat_messages`

### 16.5 招待 / 制御 / 運用
- `tenant_api_keys`
- `tenant_notifications`
- `audit_logs`
- `tenant_member_invites`
- `bot_hosted_access_blocks`
- `rate_limit_buckets`
- `auth_lockouts`

### 16.6 予約的・未活用寄りの構造
- `response_cache`
  - テーブルはあるが、現行コードでは中核機能としては未使用

---

## 17. 旧仕様書からの主な変更点
以下は旧文書から見て重要な更新点です。

1. 提供形態は Hosted / Widget / API の3本柱で整理されている
2. 権限は `editor` / `reader` + Platform Admin の構成になっている
3. RAG 基盤は独自 chunk / pgvector 前提ではなく OpenAI File Search 中心
4. URL 取り込みは sitemap 由来の複数ページ処理に対応している
5. Stripe と手動オーバーライドの二重管理が実装されている
6. Bot単位アクセス制御、メンバー招待、代理閲覧が実装されている
7. Widget の属性名は `data-widget-token` が正しい
8. Platform Admin コンソールが実装済み
9. `schema-02.sql` が現行のDB状態を表す

---

## 18. 現時点で未実装または限定的な項目
- LINE 連携
- 外部Web検索による最新情報回答
- SSO / SAML
- 高度な権限分離
- 独自セマンティックキャッシュ本実装
- Headless ブラウザを前提にした動的サイト取得
- エンタープライズ向け監査・法務要件の拡張

---

## 19. 今後の更新方針
この文書は、以下の変更が入るたびに更新対象とします。

- `schema-02.sql` のテーブル/カラム変更
- プラン上限やStripe運用の変更
- Hosted / Widget / API の認証仕様変更
- RAG実装方式の変更
- Platform Admin の運用フロー変更

必要に応じて、詳細手順は以下へ分離します。
- 導入/環境構築: `docs/supabase-setup.md`
- 課金/運用: `docs/stripe-setup.md`, `docs/運用マニュアル.md`
- Widget利用手順: `app/help/widget/page.tsx` 相当のヘルプ内容
