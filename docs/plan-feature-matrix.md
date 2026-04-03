# プラン機能仕様

最終更新: 2026-04-04

## 1. 前提
この文書は、**現行実装** と `supabase/schema-02.sql` を基準にしたプラン仕様です。  
旧資料にあった `plan_entitlements` 独立テーブル前提ではなく、現在は **`public.plans` に上限・機能フラグを集約** しています。

提供形態:
1. Hosted Chat 公開
2. Widget 埋め込み
3. Chat API

補足:
- LINE 連携は現時点では未実装
- 外部Web検索は行わず、登録済みナレッジに基づいて回答
- Platform Admin から契約オーバーライドで Stripe と独立した制御が可能

## 2. 現行プラン値
| Plan | 月額(円) | Bot上限(表示) | Bot内部上限 | 月間メッセージ | データ量上限(MB) | Widget | Hosted | API | モデル選択 |
|---|---:|---:|---:|---:|---:|---|---|---|---|
| Lite | 10,000 | 1 | 50 | 1,000 | 100 | 可 | 不可 | 不可 | 不可 |
| Standard | 24,800 | 2 | 50 | 5,000 | 1,024 | 可 | 可 | 可 | 可 |
| Pro | 100,000 | 無制限表示 | 50 | 20,000 | 10,240 | 可 | 可 | 可 | 可 |

補足:
- Pro の「無制限」は顧客向け表示。内部上限は `50`
- Hosted は `has_hosted_page` と `max_hosted_pages` の両方で制御
- API は `has_api` で制御

## 3. `public.plans` で管理している主な項目
機能・制限の基準値は `supabase/schema-02.sql` の `public.plans` に集約されています。

主な列:
- `max_bots`
- `max_monthly_messages`
- `max_storage_mb`
- `has_api`
- `has_hosted_page`
- `has_widget`
- `allow_model_selection`
- `is_bot_limit_display_unlimited`
- `internal_max_bots_cap`
- `max_api_keys`
- `max_hosted_pages`
- `max_allowed_origins`
- `internal_max_allowed_origins_cap`
- `api_rpm_limit`
- `overage_notify_threshold_percent`
- `spam_protection_profile`
- `support_level`

## 4. 追加制御値
現行の初期値:

| Plan | APIキー上限 | Hosted上限 | 許可オリジン | API RPM |
|---|---:|---:|---|---:|
| Lite | 0 | 0 | null | 30 |
| Standard | 2 | 2 | null | 120 |
| Pro | 10 | 50 | null | 300 |

補足:
- `max_allowed_origins = null` はプラン上の固定上限なし
- ただし内部保護として `internal_max_allowed_origins_cap = 200`
- Widget 側は `allowed_origins` を実際に検証

## 5. 実装上の判定ルール
### 5.1 契約状態
継続利用扱い:
- `trialing`
- `active`
- `past_due`

停止扱い:
- `unpaid`
- `canceled`
- `paused`
- `incomplete`

### 5.2 Bot 作成
- `max_bots` と `internal_max_bots_cap` を合わせて判定
- Pro は表示上「無制限」でも、内部では 50 を超えない

### 5.3 Hosted URL
- `has_hosted_page = false` の場合は利用不可
- `max_hosted_pages` を超える Bot は Hosted 利用対象外
- 対象判定は公開Bot / internal Bot / `require_auth_for_hosted = true` の Bot を含む

### 5.4 API
- `has_api = false` の場合、APIキー認証リクエストは拒否
- 契約変更で API 不可になった場合は、enforcement 側で有効APIキーを停止

### 5.5 ストレージ
- `max_storage_mb` を超える追加投入・再インデックスは停止
- 既存データは削除しない

### 5.6 月間メッセージ
- `usage_daily` を集計して判定
- `overage_notify_threshold_percent` を超えると通知を発行
- 上限到達で回答停止

## 6. モデル選択
現行コードで選択可能なモデル:
- `gpt-5-mini`
- `gpt-5-nano`
- `gpt-4o-mini`

運用方針:
- Lite はモデル選択不可
- Standard / Pro はコンソールから選択可能
- Botごとに fallback model と max output tokens を設定可能

## 7. 契約管理の実態
契約状態は次の2経路で決まります。

1. Stripe サブスクリプション
2. Platform Admin の `tenant_contract_overrides`

優先順位:
`tenant_contract_overrides (is_active = true)` > Stripe subscription

つまり、Override が有効な間は Stripe 側の状態より Override が優先されます。

## 8. 運用前提
現行運用の基本方針:
1. 上限超過前通知を行う
2. 未払い・停止状態ではボット応答を止める
3. 管理画面アクセスは原則維持し、復旧導線を残す
4. 既存データは削除しない
5. Webhook と日次 enforcement の両方で再整合する

## 9. セキュリティ/スパム対策
公開チャネル共通の前提:
1. レート制限
2. Widget の origin 検証
3. 応答トークン上限
4. テナント/Bot の force stop
5. RLS による契約者データ分離

現時点で未実装または今後強化予定:
- CAPTCHA / Turnstile の本導入
- 異常検知時の自動ブロック高度化
- より細かいチャネル別レート制限

## 10. テスト・検証用アカウント運用
推奨ルール:
1. 顧客テナントと検証テナントを分離する
2. 検証用テナントは `dev-` / `stg-` 系命名で運用する
3. APIキーは期限付きで発行する
4. Source データはダミーまたは検証専用データを使う

## 11. 関連資料
- `docs/AI-bot-service.md`
- `docs/運用マニュアル.md`
- `docs/stripe-setup.md`
- `supabase/schema-02.sql`
