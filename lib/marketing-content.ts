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
    price: "¥10,000 / 月",
    note: "問い合わせ対応を小さく始める",
    points: ["Bot: 1体", "月間メッセージ: 1,000", "データ量: 100MB", "公開方法: Widget中心"],
  },
  {
    name: "Standard",
    price: "¥24,800 / 月",
    note: "公開導線と運用を安定化",
    points: ["Bot: 2体", "月間メッセージ: 5,000", "データ量: 1,024MB", "公開方法: Widget/Hosted/API"],
  },
  {
    name: "Pro",
    price: "¥100,000 / 月",
    note: "複数部門へ本格展開",
    points: ["Bot: 無制限表示（内部50）", "月間メッセージ: 20,000", "データ量: 10,240MB", "公開方法: Widget/Hosted/API"],
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
