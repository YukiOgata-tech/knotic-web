# Lite / Standard マネタイズ試算（実装準拠）

更新日: 2026-03-17  
対象: `Lite` / `Standard`（`Pro` は対象外）

## 1. 目的

現行実装に基づき、Lite と Standard の月間上限利用時における概算原価（LLM API + File Search）と粗利を試算する。

## 2. 実装ベース前提（このリポジトリ）

- 料金・上限（`supabase/schema.sql`）
  - Lite: `10,000円/月`、`1,000 messages/月`、`100MB`
  - Standard: `24,800円/月`、`5,000 messages/月`、`1,024MB`
- メッセージ課金管理
  - 1リクエストごとに `messages: 1` を加算
  - 月間上限到達時は `402` で応答停止
  - 集計はテナント単位合算（Bot横断）
- 利用モデル（現行許可）
  - `gpt-5-mini`
  - `gpt-5-nano`
  - `gpt-4o-mini`
- 応答経路
  - `Responses API` + `file_search` ツール利用
  - `max_output_tokens` は Bot 設定値（既定 900〜1200、制約 200〜4000）
- 会話履歴上限（API側）
  - Lite: 20 turns
  - Standard: 30 turns

## 3. 単価前提（外部）

## 3.1 為替
- `1 USD = 150 JPY`（固定仮定）

## 3.2 OpenAI単価（試算で使用）
- `gpt-5-mini`: input `$0.25 / 1M tok`, output `$2.00 / 1M tok`
- `gpt-5-nano`: input `$0.05 / 1M tok`, output `$0.40 / 1M tok`
- `gpt-4o-mini`: input `$0.15 / 1M tok`, output `$0.60 / 1M tok`
- File Search:
  - calls: `$2.50 / 1,000 calls`
  - storage: `$0.10 / GB / day`

注記: 単価は将来変更される可能性があるため、見積り時点で再確認すること。

## 4. 計算式

1メッセージ原価（USD）:

```text
C_msg = (input_tokens/1,000,000) * P_in
      + (output_tokens/1,000,000) * P_out
      + C_fs_call
```

月間原価（USD）:

```text
C_month = C_msg * monthly_messages + C_fs_storage
```

円換算:

```text
C_jpy = C_month * 150
粗利 = 月額料金 - C_jpy
```

## 5. 試算A（実務寄りシナリオ）

前提:
- 1メッセージあたり `入力3,000 tok / 出力500 tok`
- File Search呼び出し率 `100%`
- ストレージは上限相当を月間保持（Lite 0.1GB / Standard 1.024GB）

## 5.1 モデル別結果

| Plan | モデル | 月間原価(円) | 粗利(円) | 粗利率 |
|---|---|---:|---:|---:|
| Lite | gpt-5-mini | 682.5 | 9,317.5 | 93.2% |
| Lite | gpt-5-nano | 472.5 | 9,527.5 | 95.3% |
| Lite | gpt-4o-mini | 532.5 | 9,467.5 | 94.7% |
| Standard | gpt-5-mini | 3,648.3 | 21,151.7 | 85.3% |
| Standard | gpt-5-nano | 2,598.3 | 22,201.7 | 89.5% |
| Standard | gpt-4o-mini | 2,898.3 | 21,901.7 | 88.3% |

## 6. 試算B（重負荷・保守的シナリオ）

前提:
- `ai_max_output_tokens = 4,000` 前提
- 履歴トークン増加を大きめに見込む
  - Lite: `入力21,000 tok / 出力4,000 tok`
  - Standard: `入力31,000 tok / 出力4,000 tok`
- モデルはコスト高側として `gpt-5-mini`
- File Search呼び出し率 `100%`

| Plan | 月間原価(円) | 粗利(円) | 粗利率 |
|---|---:|---:|---:|
| Lite | 2,407.5 | 7,592.5 | 75.9% |
| Standard | 14,148.3 | 10,651.7 | 42.9% |

## 7. 感度（どこで収益性が変わるか）

- 出力トークン増加の影響が大きい
  - 特に `gpt-5-mini` は output単価が高いため、長文回答運用で原価が急増しやすい。
- 会話履歴ターン数の増加
  - 履歴を多く送るほど input tokens が増加。
- File Search呼び出し率
  - 100%想定を50%に下げると、calls原価はほぼ半減。
- モデル選択の運用
  - 高精度用途だけ `gpt-5-mini`、通常は `gpt-5-nano` / `gpt-4o-mini` を使うと粗利が改善。
- 為替
  - 円安方向でAPI原価が増加。
- ストレージ無料枠の扱い
  - OpenAI側無料枠（例: 最初の1GB）を考慮するかで Standard の原価がわずかに変動。

## 8. この試算の考慮事項（詳細）

- 実装と企画の差異確認が必要
  - 仕様文書上は Lite を固定モデル運用としている箇所がある一方、実装上はモデル許可セットが共通化されている経路があるため、最終的な運用制約はUI/権限制御を含めて別途確定が必要。
- 原価対象の範囲
  - 本書の原価は `LLM推論 + File Search` のみ。
  - 未含有: Stripe手数料、CDN/Hosting、Supabase DB/Storage、監視、サポート工数、人件費、障害対応コスト。
- メッセージ上限に対する「収益の上限」
  - 現行は上限到達で応答停止のため、上限超過による変動課金の上振れリスクは低い。
  - ただし、上限設計が低すぎると解約率や満足度低下の商業リスクがある。
- フォールバックモデルの影響
  - フォールバックが高単価モデルに寄る設定だと、障害時や失敗時に原価が想定より上振れする。
- 文章品質要件とコストのトレードオフ
  - 引用・丁寧回答を強めるほど出力トークンが増加しやすく、単価影響が大きい。

## 9. 運用提案（粗利安定化）

- Botごとに `max_output_tokens` を業務用途別に最適化（FAQ短答は低め）
- 履歴ターン数を必要最小限に制御
- 回答テンプレートを短文化して output tokens を抑制
- モデル切り替えルールを明文化（通常: Nano/Mini、重要質問のみ Standard）
- 月次で `chat_logs` の実トークン統計を見て、机上見積りを実績補正する

## 10. 参照

- `supabase/schema.sql`
- `lib/billing/limits.ts`
- `app/api/v1/chat/route.ts`
- `app/api/hosted/chat/route.ts`
- `lib/filesearch/openai.ts`
- OpenAI Pricing: https://openai.com/api/pricing/
- Assistants / File Search FAQ: https://help.openai.com/en/articles/8550641-assistants-api-v2-faq

