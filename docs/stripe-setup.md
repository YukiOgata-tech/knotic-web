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
