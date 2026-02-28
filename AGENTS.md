# Repository Guidelines

## プロジェクト構成とモジュール配置
- `app/`: Next.js App Router のページ・レイアウト・API ルート（`app/api/*`）。
- `components/`: 再利用コンポーネント群（`ui/`, `auth/`, `layout/`, `marketing/`, `contact/`）。
- `lib/`: 共通ロジック（Supabase クライアント、課金、インデックス、LLM、メール連携）。
- `content/`: マーケティング/法務系の静的コンテンツ。
- `public/`: 画像などの静的アセットと `public/widget.js`。
- `supabase/`: `schema.sql` と段階的なパッチ SQL。
- `docs/`: 運用・仕様ドキュメント。

## ビルド・テスト・開発コマンド
- `npm install`: 依存関係をインストール。
- `npm run dev`: ローカル開発サーバーを起動（`http://localhost:3000`）。
- `npm run build`: 本番ビルドを作成（リリース前の確認に使用）。
- `npm run start`: ビルド済みアプリをローカル起動。
- `npm run lint`: ESLint（Next.js + TypeScript 設定）を実行。

## コーディング規約と命名
- 言語は TypeScript（`.ts` / `.tsx`）を使用し、2 スペースインデントを基本とします。
- 画面・機能コンポーネントは `PascalCase`、`components/ui` は既存の小文字命名に合わせます。
- ルートファイル名は App Router 規約（`page.tsx`, `layout.tsx`, `route.ts`）に従ってください。
- `lib/` には責務を絞った小さなモジュールを配置し、named export を優先します。
- スタイルは Tailwind CSS v4、ユーティリティ統合は `lib/utils.ts` を使用します。

## テスト方針
- 現状 `test` スクリプトは未定義です（`package.json` 準拠）。
- 最低限の確認として `npm run lint` と、変更箇所の手動検証を実施してください。
- API 変更時は対象エンドポイント（例: `POST /api/v1/chat`, `POST /api/contact`）を実データに近い入力で確認します。
- テストを追加する場合は `*.test.ts` / `*.test.tsx` を採用し、実行コマンドを `package.json` と本ファイルに追記してください。

## コミットとプルリクエスト
- 履歴はまだ統一されていないため、今後は命令形で明確なコミットメッセージを推奨します。
- 形式例: `<scope>: <変更内容>`（例: `console: add billing retry action`）。
- 可能な限り、スキーマ変更・API 変更・UI 変更はコミットを分離してください。
- PR には目的、影響範囲、環境変数/DB 変更、確認手順、UI 変更時のスクリーンショットを含めてください。
- 関連 Issue/Docs をリンクし、新規 env 変数や Supabase パッチは明示してください。

## セキュリティと設定の注意
- 実運用シークレットはコミット禁止。必須キーは `.env.example` を契約として管理します。
- `SUPABASE_SECRET_KEY`、`OPENAI_API_KEY`、Stripe 鍵、内部 runner 用 secret はサーバー側限定で扱ってください。
- テナント/サブドメイン関連を変更する場合は `proxy.ts` と認証系ルートを必ず再確認してください。
