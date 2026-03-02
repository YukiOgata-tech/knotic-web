# AI Bot Service 別レポジトリ実行指示書（v1.0）

作成日: 2026-02-23  
対象: 別レポジトリで「マーケティングサイト構築〜サービス提供開始」まで進める開発チーム

---

## 0. 事前条件（今回の前提）

- 本サービスは **make-it-tech.com 配下のサブドメイン** で公開する  
  例: `https://knotic.make-it-tech.com`
- 実装は **別レポジトリ** で管理する（本リポジトリと分離）
- 認証・DB・Storage は **Supabaseを新規分離運用** する
- 管理者アカウントは既存サービスと分離（兼用しない）
- 仕様の一次ソースは以下2ファイルを利用する
  - `docs/AI-bot-service/AI-bot-service.md`
  - `docs/AI-bot-service/feedback_spec-v0.1_20260223.md`
  - 以上２つのファイルは初期構想段階でのものなので、情報が古い場合があります。

---

## 1. 目的とゴール

1. マーケティングサイト（LP/料金/FAQ/問い合わせ）を公開
2. ユーザー登録〜Bot作成〜URL/PDF投入〜チャット応答のMVPを提供
3. 利用制限（プラン上限）と運用管理（最低限ログ）を実装

---

## 2. リポジトリ初期構成（推奨）

- `apps/web`: マーケティングサイト + 管理画面 + 公開Botページ
- `apps/api`（または `app/api`）: ingest/chat/billing/webhook
- `packages/ui`: 共通UI
- `packages/core`: ドメインロジック（tenant/bot/source/chunk）
- `infra`: DB migration / Supabase SQL / IaC
- `docs`: 要件、運用手順、審査メモ

---

## 3. 環境・アカウント分離

- Supabase Project:
  - `knotic-dev`
  - `knotic-stg`
  - `knotic-prd`
- Auth:
  - 管理者ロール（owner/member）を独立
  - 2FA必須推奨
- Secrets:
  - `.env` を環境別に分離
  - APIキーはSecret Manager管理

---

## 4. 開発フェーズ（実装順）

## Phase 1: マーケティングサイト
- ページ: Home / Features / Pricing / FAQ / Contact / Privacy / Terms
- CTA: `無料で試す` をサインアップへ統一
- 計測: GA4 + Search Console + サーバーログ
- SEO: canonical, sitemap, robots, OGP

## Phase 2: 認証とテナント基盤
- Supabase Auth（メール認証）
- `tenants`, `users`, `memberships` の最小モデル実装
- 新規登録時にテナント自動作成

## Phase 3: Bot作成とナレッジ投入
- Bot CRUD
- Source登録（URL/PDF）
- 非同期ジョブで抽出・チャンク化・Embedding保存
- ステータス表示（queued/running/ready/failed）

## Phase 4: チャット提供（RAG）
- `POST /chat` で質問受付
- top-k検索 + LLM応答
- 出典表示（少なくともURL/ファイル名）
- Bot公開ページ（`/chat-by-knotic/{bot_public_id}`）

## Phase 5: 利用制限と運用
- 日次使用量集計（messages/tokens）
- プラン上限チェック
- キャッシュ（完全一致→セマンティック順）

---

## 5. 仕様参照ルール（重要）

- 要件定義は `AI-bot-service.md` を正とする
- 懸念点/改善優先は `feedback_spec-v0.1_20260223.md` を正とする
- 実装時に仕様差分が出る場合は `docs/adr/` に記録（ADR運用）

---

## 6. 必須セキュリティ要件

- 全テーブルで `tenant_id` 境界を強制
- 公開トークンはチャット用途のみに限定
- 管理APIはセッション認証必須
- 入力データのサイズ制限・MIME検証
- ログに機密情報を残さない（PIIマスク）

---

## 7. デプロイ方針

- ホスティング: Vercel（Web）+ Supabase（DB/Auth/Storage）
- 公開先: `knotic.make-it-tech.com`
- DNS/SSL:
  - `CNAME knotic -> hosting endpoint`
  - `CNAME api.knotic -> api hosting endpoint`
  - `CNAME console.knotic -> console hosting endpoint`
  - 証明書自動更新を有効化
- リリース:
  - `dev -> stg -> prd`
  - mainマージ前に lint/build/test 必須

---

## 8. 受け入れ基準（MVP）

- サインアップ後にテナント作成される
- URL/PDFを投入し、Botが `ready` になる
- 参照元付き回答が返る
- 公開ページでチャット利用できる
- プラン上限超過時に明確なエラーが出る
- プライバシーポリシーと利用規約が公開済み

---

## 9. 直近タスク（最初の2週間）

1. 別レポジトリ作成、CI/CD、環境変数テンプレ作成
2. Supabaseプロジェクト3環境作成
3. マーケサイトの骨組み + 認証導線
4. テナント/Bot最小DBと管理画面CRUD
5. URL1件投入とチャット応答まで通す

---

## 10. 補足（今回の意思決定）

- 将来の事業分離を見据え、コード/認証/運用を本体サイトから分離する
- ただし立ち上げ速度を優先し、公開はサブドメインで開始する
- 独立ドメイン化はKPI達成後に再評価する
