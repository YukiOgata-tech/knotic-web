export type UseCaseStory = {
  id: string
  companyLabel: string
  industry: string
  employeeScale: string
  primaryGoal: string
  before: string
  rollout: string[]
  results: string[]
}

export const anonymizedUseCaseStories: UseCaseStory[] = [
  {
    id: "saas-support",
    companyLabel: "導入事例A（BtoB SaaS企業・社名非公開）",
    industry: "SaaS / カスタマーサポート",
    employeeScale: "従業員 120名規模",
    primaryGoal: "問い合わせ一次対応の自動化",
    before:
      "ヘルプ記事や運用記事は存在していたものの、問い合わせ窓口への同内容質問が多く、サポート初動に時間がかかっていました。",
    rollout: [
      "公開ヘルプURLを登録し、WebサイトへWidgetを埋め込み",
      "よくある契約・請求・初期設定の質問を優先領域として運用開始",
      "回答ログを見ながらFAQ記事を追加し、2週間ごとに再インデックス",
    ],
    results: [
      "同一カテゴリの一次問い合わせ件数が約34%減少",
      "オペレーター初回返信までの平均時間が約41%短縮",
      "自己解決率（チャット内完結）が導入初月19% → 3か月後32%へ改善",
    ],
  },
  {
    id: "manufacturing-manual",
    companyLabel: "導入事例B（製造業・社名非公開）",
    industry: "製造業 / 技術サポート",
    employeeScale: "従業員 300名規模",
    primaryGoal: "マニュアル参照の効率化",
    before:
      "保守マニュアルがPDFで分散管理され、必要な記述を探すまでに時間がかかっていました。",
    rollout: [
      "機種別マニュアルPDFをBotごとに整理して登録",
      "現場向けポータルに埋め込み、夜間シフトでも自己参照可能に",
      "回答根拠の出典表示を標準ONにし、確認導線を統一",
    ],
    results: [
      "技術問い合わせの調査時間が平均27%短縮",
      "一次回答で解決できる比率が約22ポイント改善",
      "新人メンバーの立ち上がり期間が約2週間短縮",
    ],
  },
  {
    id: "compliance-training",
    companyLabel: "導入事例C（多拠点サービス業・社名非公開）",
    industry: "サービス業 / 管理部門",
    employeeScale: "全国10拠点・従業員 500名規模",
    primaryGoal: "社内教育と規程確認の標準化",
    before:
      "就業規則・運用規程の問い合わせが拠点ごとにばらつき、回答品質の差が課題でした。",
    rollout: [
      "社内規程PDFと運用ガイドURLを登録し、共有URLで配布",
      "教育担当向けに質問テンプレートを整備して初期運用",
      "規程更新時に再インデックス運用を月次で固定化",
    ],
    results: [
      "規程関連の社内問い合わせ件数が約29%減少",
      "教育担当者の回答作成工数が月あたり約18時間削減",
      "拠点間での回答表現のばらつきが大幅に縮小",
    ],
  },
]
