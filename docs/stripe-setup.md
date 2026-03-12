# Stripe Setup Guide

このリポジトリでは、以下をStripe連携の対象にしています。

- Checkout: `POST /api/stripe/checkout`
- Customer Portal: `POST /api/stripe/portal`
- Webhook: `POST /api/stripe/webhook`
- Console UI: `/console/billing`

## 1. .env.local を設定

`.env.example` を参考に、以下を設定します。

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_LITE_MONTHLY`
- `STRIPE_PRICE_STANDARD_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `NEXT_PUBLIC_APP_URL`

## 2. StripeダッシュボードでPriceを作成

3プラン分の「月額 recurring price」を作成し、price IDをenvへ設定します。

- Lite -> `STRIPE_PRICE_LITE_MONTHLY`
- Standard -> `STRIPE_PRICE_STANDARD_MONTHLY`
- Pro -> `STRIPE_PRICE_PRO_MONTHLY`

## 3. Webhook endpointを作成

Endpoint URL:

- ローカル開発: `http://localhost:3000/api/stripe/webhook`
- 本番: `https://<your-domain>/api/stripe/webhook`

購読推奨イベント:

- `checkout.session.completed`
- `customer.created`
- `customer.updated`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Signing secret (`whsec_...`) を `STRIPE_WEBHOOK_SECRET` に設定します。

## 4. ローカル開発でWebhook中継（任意）

Stripe CLI を使う場合:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

表示された `whsec_...` を `.env.local` に反映します。

## 5. 動作確認フロー

1. `/console/billing` にログインして遷移
2. プランを選択してCheckoutへ遷移
3. 決済完了後に `/console/billing` へ戻る
4. Webhook受信で `subscriptions` / `billing_customers` / `billing_events` が更新される
5. 「Customer Portalを開く」でポータル遷移できることを確認

## 注意点

- Webhookが未設定だと、決済後にDBの契約状態同期が遅延/不整合になります。
- `tenant_memberships.role = editor` のユーザーのみCheckout/Portal操作可能です。
- `plans.code` は `lite / standard / pro` 前提でPriceとマッピングされます。
## 6. ローカル(test)と本番(live)の使い分け

現在の運用（ローカル=test / Vercel=live）は正しいです。

- ローカル `.env.local`: `sk_test_*` + `price_test_*`
- 本番（Vercel Environment Variables）: `sk_live_*` + `price_live_*`

重要:

- `STRIPE_SECRET_KEY` と `STRIPE_PRICE_*` のモードは必ず一致させる
- `STRIPE_WEBHOOK_SECRET` も受信先ごとに異なるため、ローカルと本番で別値を使う

## 7. ローカルでのテスト実行手順（推奨）

1. ローカルenvをtest値に設定

- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_PRICE_LITE_MONTHLY=price_...`（test側）
- `STRIPE_PRICE_STANDARD_MONTHLY=price_...`（test側）
- `STRIPE_PRICE_PRO_MONTHLY=price_...`（test側）

2. 開発サーバー起動

```bash
npm run dev
```

3. Stripe CLIでWebhook中継を開始

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. CLI表示の `whsec_...` をローカルenvへ設定

- `.env.local` の `STRIPE_WEBHOOK_SECRET` を更新
- サーバー再起動（env再読込のため）

5. `/console/billing` からCheckout実行

- テストカードで決済完了
- `/console/billing` に戻る

6. 同期確認

- `billing_events` にWebhookイベントが記録される
- `subscriptions` が更新される
- `billing_customers` が作成/更新される

### テストカード（Stripe test mode）

- 成功: `4242 4242 4242 4242`
- 失敗（カード拒否）: `4000 0000 0000 0002`
- 失敗（残高不足）: `4000 0000 0000 9995`

補足:
- 有効期限は未来日（例: `12/34`）
- CVCは任意3桁（例: `123`）
- 郵便番号は任意（例: `12345`）

## 8. 本番デプロイ前チェック

- Vercelの環境変数は live値のみ
- Stripe DashboardのWebhook endpointは本番URLのみ
- 本番用 `STRIPE_WEBHOOK_SECRET` がVercelに設定済み
- Price IDが `plans.code` と一致している（lite / standard / pro）


## 9. Webhook再試行運用（推奨）

1. SQLを適用
- `supabase/patch-20260226-billing-events-retry.sql`

2. 実行シークレットを設定
- `BILLING_RUNNER_SECRET`

3. 定期実行（Cron）
- `POST /api/internal/billing/retry`
- Header: `Authorization: Bearer <BILLING_RUNNER_SECRET>`

4. 手動再同期
- `/console/billing` の「Webhook再同期を実行」ボタン（Editorのみ）

---

## 10. 今後の拡張開発項目

### 10-1. 料金変更の運用フロー

Stripe の Price は作成後に金額を変更できない（イミュータブル）。変更時は必ず新しい Price を作成する。

#### 恒久的な値上げ（例: Standard ¥24,800 → ¥29,800）

1. Stripe Dashboard で同一 Product に新 Price を作成
2. 環境変数 `STRIPE_PRICE_STANDARD_MONTHLY` を新 price_id に更新
3. 再デプロイ
4. **既存契約者は旧価格のまま自動継続**（Stripe 仕様。意図的に移行しない限り変わらない）
5. 既存契約者を新価格へ移行する場合は Stripe API で subscription の price を差し替える

#### キャンペーン・期間限定割引（例: 期間限定スタンダード ¥20,000）

Stripe の **Coupon + Promotion Code** を使うのが推奨。コード変更・再デプロイ不要でStripe Dashboard のみで完結する。

1. Stripe Dashboard → Coupons → 「新規作成」
   - 割引額: ¥4,800 off（または任意の割合）
   - Duration: once / repeating（N ヶ月） / forever から選択
   - `redeem_by`: キャンペーン終了日時を設定（自動終了）
   - `max_redemptions`: 使用上限件数（任意）
2. Promotion Code を発行（例: `OPEN2026`）してユーザーに告知
3. チェックアウト画面でコードを入力 → 割引が適用される

現在のコードは `allow_promotion_codes: true`（`app/api/stripe/checkout/route.ts`）が設定済みのため、追加実装不要。

### 10-2. 現在の設計の制約と将来の改善案

現在、price_id → plan_code のマッピングは環境変数でハードコードされている。

```ts
// lib/stripe.ts
STRIPE_PRICE_LITE_MONTHLY     → "lite"
STRIPE_PRICE_STANDARD_MONTHLY → "standard"
STRIPE_PRICE_PRO_MONTHLY      → "pro"
```

このため、プランを追加・変更するたびに `lib/stripe.ts` のコード修正 + 環境変数更新 + 再デプロイが必要になる。

**改善案: `plans` テーブルに `stripe_price_id` カラムを追加**

```sql
-- patch-YYYYMMDD-plans-stripe-price-id.sql
ALTER TABLE public.plans ADD COLUMN stripe_price_id text;
```

```ts
// resolvePlanCodeFromPriceId をDB参照に変更
const { data } = await admin
  .from("plans")
  .select("code")
  .eq("stripe_price_id", priceId)
  .maybeSingle()
```

この変更を適用すれば、新 Price を作成してDBに登録するだけで運用でき、コード変更・再デプロイが不要になる。プランの追加・変更頻度が高くなった段階で対応する。

### 10-3. プラン管理UIの実装

現在、`plans` テーブルの変更は SQL を直接実行する必要がある。将来的に `/sub-domain`（プラットフォーム管理コンソール）にプラン管理画面を追加し、以下の操作をUIから行えるようにする。

- プランの上限数値変更（ボット数・メッセージ数・ストレージ等）
- `stripe_price_id` の設定（10-2 の改善案実施後）
- プランの有効/無効切り替え（`is_active` フラグ）
- 新プランの追加

なお、Stripe 上での Product/Price の作成自体は引き続き Stripe Dashboard で行う必要がある。
