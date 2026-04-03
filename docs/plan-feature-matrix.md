# プラン機能仕様（確定版 v0.1）

最終更新: 2026-02-24

## 1. 事業方針（確定）
- 主な提供形態は以下3つ
1. API公開（契約者が独自実装）
2. サービス配下のHosted Page公開（`/chat-by-knotic/{bot_public_id}`）
3. scriptタグによるWidget埋め込み

- LINE連携は「顧客がAPIを使って実装」前提  
- 開発者側の実装相談・サポートは `make-it-tech.com` で提供  
- ドキュメントは全プラン配布

## 2. プラン仕様（現在の実装反映）
`supabase/schema-02.sql` の `public.plans` / `public.plan_entitlements` に反映済み。

| Plan | 月額(円) | Bot上限(表示) | Bot内部上限 | 月間メッセージ | データ量上限(MB) | Widget | Hosted Page | API | モデル選択 |
|---|---:|---:|---:|---:|---:|---|---|---|---|
| Lite | 10,000 | 1 | 50 | 1,000 | 100 | 可 | 不可 | 不可 | 不可 |
| Standard | 24,800 | 2 | 50 | 5,000 | 1,024 | 可 | 可 | 可 | 可 |
| Pro | 100,000 | 無制限表示 | 50 | 20,000 | 10,240 | 可 | 可 | 可 | 可 |

補足:
- Proの「無制限」は顧客向け表示上の扱い。システム保護のため内部上限50を保持。
- 埋め込みドメイン数はプラン上無制限だが、内部CAP（200）で保護する。

## 3. 追加制御（`plan_entitlements`）
現時点で以下を保持:
- `max_api_keys`
- `max_hosted_pages`
- `max_allowed_origins`（null=プラン上無制限）
- `internal_max_allowed_origins_cap`
- `api_rpm_limit`
- `overage_notify_threshold_percent`
- `spam_protection_profile`
- `support_level`

初期値（現状）:
- Lite: APIキー0 / Hostedページ0 / API RPM 30
- Standard: APIキー2 / Hostedページ5 / API RPM 120
- Pro: APIキー10 / Hostedページ50 / API RPM 300

## 4. 運用仕様（確定）
1. 上限超過前通知を行う（閾値は `overage_notify_threshold_percent`）
2. 支払い期限切れ・未払い時はボット応答を停止
3. 管理画面にはアクセス可能（再設定・支払い導線）
4. データは保持（削除しない）
5. 月払い先行。年払いは次フェーズ
6. 無料トライアルは当面なし

## 5. セキュリティ/スパム対策方針
公開チャネル（Widget/Hosted/API）は以下を標準化:
1. レート制限（token/ip/key）
2. origin検証（Widget）
3. CAPTCHA/Turnstile等の自動防御
4. 異常検知時の一時ブロック
5. 応答トークン上限の強制

## 6. 開発者試験アカウント設計（推奨）
開発段階では「顧客アカウント」と「運営/検証アカウント」を明確に分離する。

### 6.1 役割
1. 顧客アカウント（通常ユーザー）: 実際の契約テナント挙動確認
2. 検証アカウント（開発者）: テスト専用テナントで機能確認

### 6.2 運用ルール
1. 本番顧客テナントを開発者検証に使わない
2. 検証テナントは `dev-` / `stg-` 命名で分離
3. APIキーは検証用を別発行し、期限付きで運用
4. Bot/Source投入データはダミーを原則にする

### 6.3 将来拡張
- 運営向け内部画面（`/internal`）を作る場合は、顧客向け権限テーブルと分離して実装する

## 7. 次に確定すべき項目（残タスク）
1. Standard/Pro の月間メッセージ上限最終値
2. データ量上限の算定ルール（raw/PDF抽出後/chunk基準）
3. 支払い期限切れ時の猶予日数（0日 or 数日）
4. 年払い開始時の割引率
