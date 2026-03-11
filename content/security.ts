export type SecurityMeta = {
  title: string
  description: string
  effectiveDate: string
  revisedAt: string
}

export type SecurityHighlight = {
  label: string
  value: string
  note: string
}

export type SecuritySection = {
  id: string
  title: string
  summary: string
  bullets: string[]
}

export type SecurityChecklistItem = {
  title: string
  detail: string
}

export const securityMeta: SecurityMeta = {
  title: "セキュリティ",
  description:
    "knoticで現在実装されているセキュリティ対策の公開ページです。アクセス制御、APIキー管理、監査ログ、入力検証、運用上の制御を確認できます。",
  effectiveDate: "2026-03-10",
  revisedAt: "2026-03-10",
}

export const securityHighlights: SecurityHighlight[] = [
  {
    label: "データ分離",
    value: "RLS + テナント境界",
    note: "テーブル単位のRLSとテナント会員情報でアクセス範囲を制御",
  },
  {
    label: "認証トークン",
    value: "SHA-256で保存",
    note: "APIキー・Widgetトークンは平文を保持せず、発行時のみ表示",
  },
  {
    label: "ファイル登録",
    value: "1ファイル20MBまで",
    note: "対応拡張子の許可リストで受付を制限",
  },
  {
    label: "監査証跡",
    value: "監査ログ記録",
    note: "主要な管理操作をtenant単位で記録",
  },
]

export const securitySections: SecuritySection[] = [
  {
    id: "access-control",
    title: "1. アクセス制御とテナント分離",
    summary:
      "契約者（tenant）単位でデータ境界を分離し、閲覧・編集権限をロールで管理します。",
    bullets: [
      "主要テーブルでRow Level Security（RLS）を有効化し、`app.can_read_tenant` / `app.can_write_tenant` を条件にアクセスを制御します。",
      "コンソールの編集系操作（Bot設定変更、ソース追加、課金変更など）は `editor` ロールのみ実行可能です。",
      "Hostedの社内限定モードではログイン必須で、`tenant_memberships.is_active = true` のメンバーのみアクセスできます。",
      "社内限定チャットのルーム/メッセージ取得は `owner_user_id` を条件にし、他ユーザーのルームを参照できないようにしています。",
    ],
  },
  {
    id: "token-management",
    title: "2. APIキーとWidgetトークン管理",
    summary:
      "外部公開で使う認証トークンは、漏えい時の影響を抑える前提で管理します。",
    bullets: [
      "APIキーは `knotic_api_` 形式で発行し、DBには `key_hash`（SHA-256）と先頭/末尾情報のみ保存します。",
      "APIキーは有効期限（`expires_at`）と失効状態（`is_active`, `revoked_at`）で管理し、失効済み・期限切れは拒否します。",
      "WidgetトークンもSHA-256でハッシュ化保存し、再発行時に旧トークンを失効させます。",
      "Widgetは許可オリジン（`allowed_origins`）を設定でき、未許可オリジンからのアクセスは拒否します。",
    ],
  },
  {
    id: "input-validation",
    title: "3. 入力検証とファイル取り扱い",
    summary:
      "ナレッジ登録時は入力フォーマットとファイル条件を検証し、不正入力や過大入力を抑制します。",
    bullets: [
      "URL登録APIは `http/https` のみ受け付け、形式不正のURLを拒否します。",
      "ファイルアップロードは拡張子の許可リスト（pdf/doc/docx/pptx/txt/md/html/json/csv/xlsx/xls など）に限定します。",
      "ファイルサイズは1ファイル20MB上限です。上限超過時は登録を拒否します。",
      "CSV/XLSX/XLSは構造化変換（Markdown化）して取り込み、空データのシートはエラーとして扱います。",
      "回答根拠として返すファイルリンクは署名付きURL（1時間）を使用します。",
    ],
  },
  {
    id: "audit-ops",
    title: "4. 監査ログと運用制御",
    summary:
      "管理操作の追跡性を確保し、緊急時にはサービス停止を即時適用できるようにしています。",
    bullets: [
      "主要操作は `audit_logs` に記録し、tenant、操作者、操作種別、変更前後データ、時刻を保持します。",
      "監査ログは `write_audit_log` RPCを優先し、失敗時は管理者クライアントでフォールバック挿入します。",
      "tenant単位・bot単位の強制停止フラグ（`force_stopped`）を持ち、API/Hosted画面で停止状態を判定します。",
      "招待リンクはトークンハッシュで保存し、有効期限（3日）と失効状態で管理します。",
    ],
  },
  {
    id: "abuse-control",
    title: "5. 悪用抑止とクォータ制御",
    summary:
      "不正利用や過負荷を抑えるため、契約状態・利用量・公開入力に対する制御を実装しています。",
    bullets: [
      "契約状態が `unpaid` / `canceled` / `paused` / `incomplete` の場合、Bot応答処理を停止します。",
      "月間メッセージ上限とストレージ上限を超えた場合、応答や追加インデックスを拒否します。",
      "お問い合わせAPIは同一オリジン検証、honeypot、送信速度チェック、簡易スパム判定を実行します。",
      "お問い合わせAPIはIP/メール単位でレート制限（1分2回・1時間5回）を適用します。",
    ],
  },
  {
    id: "billing",
    title: "6. 課金連携の保護",
    summary:
      "課金イベントは署名検証と重複排除を行い、管理操作には権限チェックを適用しています。",
    bullets: [
      "Stripe Webhookは `stripe-signature` とWebhook Secretで署名検証し、不正イベントを拒否します。",
      "同一イベントID（`provider_event_id`）は重複処理しないように制御します。",
      "Checkout/Portal/解約・再開などの課金操作APIは、ログイン済みかつ `editor` ロールに限定します。",
    ],
  },
  {
    id: "chat-data",
    title: "7. チャットデータの取り扱い",
    summary:
      "公開モードと社内限定モードで、履歴保持方法を分けて運用します。",
    bullets: [
      "公開HostedチャットはブラウザのlocalStorageに履歴を保持し、既定では24時間で期限切れになります。",
      "公開Hostedチャットには履歴削除ボタンを提供し、利用者が手動でローカル履歴を消去できます。",
      "社内限定Hostedチャット（認証モード）はローカル保存を無効化し、サーバー側ルームに保存します。",
      "チャットログには質問/回答本文とトークン使用量を記録し、tenant単位で管理します。",
    ],
  },
]

export const securityChecklist: SecurityChecklistItem[] = [
  {
    title: "APIキーに有効期限を設定する",
    detail: "期限なしキーの常用を避け、用途ごとに分割して運用してください。",
  },
  {
    title: "Widgetの許可オリジンを必ず設定する",
    detail: "本番ドメインのみを登録し、不要なオリジンは定期的に削除してください。",
  },
  {
    title: "社内用途のBotは社内限定モードを使う",
    detail: "`access_mode=internal` または `require_auth_for_hosted=true` を設定してください。",
  },
  {
    title: "監査ログを定期確認する",
    detail: "設定変更、キー発行・失効、招待操作の差分を継続監視してください。",
  },
  {
    title: "漏えい疑い時はトークン再発行と強制停止を実行する",
    detail: "Widget/APIキーの失効、必要時はtenant/botのforce stopで即時遮断できます。",
  },
]

export const securityNotes = [
  "本ページは、2026-03-10時点で本番コードに実装済みのアプリケーション制御を記載しています。",
  "インフラ認証（例: ISO/SOC）や個別契約上の保証項目は、本ページでは宣言していません。必要な場合はお問い合わせください。",
]
