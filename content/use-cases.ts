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
    companyLabel: "導入事例A（BtoB 企業・社名非公開）",
    industry: "契約者 / カスタマーサポート",
    employeeScale: "従業員 20名規模",
    primaryGoal: "問い合わせ一次対応の自動化",
    before:
      "ヘルプや運用書類や記事は存在していたものの、問い合わせ窓口への同内容質問が多く、サポート初動に時間がかかっていました。",
    rollout: [
      "公開ヘルプURLとマニュアルを登録し、WebサイトへWidgetを埋め込み",
      "よくある契約・請求・初期設定の質問を優先領域として運用開始",
      "回答ログを見ながらFAQ記事を追加し、1か月ごとにチャットAIを最新情報に更新",
    ],
    results: [
      "同一カテゴリの一次問い合わせ件数が約3割減少(＊問い合わせ件数)",
      "オペレーター初回返信までの平均時間が約41%短縮",
      "自己解決率（チャット内完結）が導入初月19% → 3か月後32%へ改善",
    ],
  },
  {
    id: "manufacturing-manual",
    companyLabel: "導入事例B（建築業・社名非公開）",
    industry: "建築業 / 技術サポート",
    employeeScale: "従業員 10名規模",
    primaryGoal: "電話でのお問い合わせ数の削減(サイト内完結)",
    before:
      "サイト自体に情報量が少ないLPとしてのみ公開していたため、詳しい内容についての明記がなく、電話やメールでお問合せがほぼ必須だった。",
    rollout: [
      "会社詳細情報などをファイルにして、Botごとに整理して登録",
      "現場向けポータルに埋め込み、夜間シフトでも自己参照可能に",
      "既存のWEBサイトの修正なしで、情報量を増やしたい",
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
    employeeScale: "5拠点・従業員 70名規模",
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
