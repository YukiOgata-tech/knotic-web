# File Search移行案（OpenAI / Gemini）

## 目的
- RAG品質と運用安定性を上げるため、`URL直接参照`ではなく、`事前クロール -> 正規化ファイル生成 -> File Search storage投入`に移行する。
- LLMベンダーは OpenAI または Gemini（未確定）。

## 実装方針（共通）
1. URL収集
- サイトマップ対応、canonical URL正規化、重複排除、robots.txt順守。

2. 本文抽出と品質確保
- ナビ/広告/フッターを除去し、本文中心のテキストを生成。
- `title`, `source_url`, `fetched_at`, `content_hash` をメタデータとして保持。

3. File Search投入
- 抽出テキストをファイル化して File Search の storage に登録。
- 差分更新（`content_hash`比較）で再投入を最小化。

4. 応答時ルーティング
- 通常質問はツールなし回答。
- ナレッジ参照が必要な質問のみ File Search を呼ぶ（auto + ルーター併用）。

## 実装方針（このリポジトリ）
- 現在は File Search 経路を標準運用とし、Legacy Vector経路は新規運用しない。
- Bot設定のRAG方式は OpenAI File Search 固定表示。

## 既存環境向けSQL（カラム追加）
```sql
alter table public.bots
  add column if not exists file_search_provider text,
  add column if not exists file_search_vector_store_id text;

alter table public.sources
  add column if not exists file_search_provider text,
  add column if not exists file_search_file_id text,
  add column if not exists file_search_last_synced_at timestamptz,
  add column if not exists file_search_error text;
```

## 運用上の注意
- 追加直後に自動反映される設計へ移行する場合、同時実行制御と再試行キューが必要。
- 旧版ファイルの整理ポリシー（保存期間・世代数）を明確化する。
- 引用URLを必ず返却し、監査可能性を維持する。

## 粗利試算（先行試算の再掲） *概算です。
前提:
- 為替: 1USD=150JPY
- 1メッセージ: 入力3000 / 出力500 tokens
- File Search呼び出し率: 50%
- 上限利用: Lite 1,000msg/100MB, Standard 5,000msg/1,024MB, Pro 20,000msg/10,240MB

### OpenAI（GPT-5 mini + File Search）
- Lite: 原価 約495円 / 粗利 約9,505円
- Standard: 原価 約2,700円 / 粗利 約22,100円
- Pro: 原価 約13,500円 / 粗利 約86,500円

### Gemini（Gemini 2.5 Flash-Lite + File Search）
- Lite: 原価 約75円 / 粗利 約9,925円
- Standard: 原価 約375円 / 粗利 約24,425円
- Pro: 原価 約1,500円 / 粗利 約98,500円

補足:
- GeminiはFile Search呼び出し自体の固定課金が小さく、主にトークン課金の影響を受ける。
- Embedding再投入量（差分更新率）で実コストは変動する。
