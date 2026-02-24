import { FileText, Globe, Handshake, ShieldCheck, Sparkles } from "lucide-react"

export const headerLinks = [
  { href: "/features", label: "機能" },
  { href: "/pricing", label: "料金" },
  { href: "/use-cases", label: "活用例" },
  { href: "/faq", label: "FAQ" },
]

export const features = [
  {
    icon: Globe,
    title: "URLを投入するだけ",
    description:
      "公開ページや社内ページを登録するだけで、質問に答えられる知識ベースを自動生成します。",
  },
  {
    icon: FileText,
    title: "PDFをそのまま活用",
    description:
      "マニュアル、規程、提案資料をアップロードして、チャットの回答根拠として利用できます。",
  },
  {
    icon: Sparkles,
    title: "出典つきで回答",
    description:
      "回答だけでなく参照元を表示。ビジネス利用で必要な信頼性を最初から確保します。",
  },
  {
    icon: ShieldCheck,
    title: "テナント分離を前提",
    description:
      "tenant_id / bot_id 境界を前提に設計し、企業向け運用で必要な分離性を担保します。",
  },
  {
    icon: Handshake,
    title: "運用しやすい管理画面",
    description:
      "URL/PDFの追加、再インデックス、利用量確認までを一画面で管理できる構成を目指します。",
  },
]

export const plans = [
  {
    name: "Lite",
    price: "¥5,000 / 月",
    note: "小さく始める",
    points: ["Bot: 1体", "月間メッセージ: 制限あり", "データ量: 小規模", "API/LINE連携: なし"],
  },
  {
    name: "Standard",
    price: "¥24,800 / 月",
    note: "運用を安定化",
    points: ["Bot: 1体", "月間メッセージ: 拡張", "データ量: 中規模", "API連携: 検討中"],
  },
  {
    name: "Pro",
    price: "¥100,000 / 月",
    note: "複数Botで本格運用",
    points: ["Bot: 複数", "月間メッセージ: 大容量", "データ量: 大規模", "API/LINE連携: 対応予定"],
  },
]

export const faqs = [
  {
    q: "外部Web検索は行いますか？",
    a: "現時点では、投入されたURL/PDFを中心に回答する設計です。",
  },
  {
    q: "公開ページと埋め込みの両方に対応しますか？",
    a: "対応予定です。共有URLとWidgetの2つで導入しやすくします。",
  },
  {
    q: "料金詳細はいつ確定しますか？",
    a: "まずは3プラン構成で先行公開し、利用状況に合わせて詳細を確定します。",
  },
  {
    q: "Bot作成後すぐに使えますか？",
    a: "URL/PDF投入後にインデックス処理が完了すれば、すぐ公開・利用できます。",
  },
  {
    q: "社内向け用途でも使えますか？",
    a: "利用可能です。社内規程・マニュアル照会などの用途を想定しています。",
  },
]

export const useCases = [
  {
    title: "WebサイトFAQの自動化",
    description:
      "既存の公開ページを投入し、問い合わせ前の自己解決率を上げる導線を構築します。",
  },
  {
    title: "製品マニュアルの照会",
    description:
      "PDFマニュアルを投入し、サポートチームやユーザーが必要情報をすぐ引ける状態にします。",
  },
  {
    title: "社内ナレッジ検索",
    description:
      "規程、申請手順、運用ドキュメントを横断して質問できる社内ボットとして運用します。",
  },
]
