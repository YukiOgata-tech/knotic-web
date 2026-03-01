export type PricingPlan = {
  code: "lite" | "standard" | "pro"
  name: string
  priceLabel: string
  monthlyPriceJpy: number
  tagline: string
  target: string
  botLimitLabel: string
  monthlyMessagesLabel: string
  storageLabel: string
  channels: {
    widget: boolean
    hostedPage: boolean
    api: boolean
  }
  modelSelection: boolean
  apiRpm: string
  maxApiKeys: string
  maxHostedPages: string
  origins: string
}

export type PricingComparisonRow = {
  label: string
  values: {
    lite: string
    standard: string
    pro: string
  }
}

export const pricingPlans: PricingPlan[] = [
  {
    code: "lite",
    name: "Lite",
    priceLabel: "¥10,000 / 月",
    monthlyPriceJpy: 10000,
    tagline: "まずは1用途を素早く立ち上げる",
    target: "問い合わせ対応やマニュアル案内を小さく始めるチーム向け",
    botLimitLabel: "1体",
    monthlyMessagesLabel: "1,000 / 月",
    storageLabel: "100MB",
    channels: { widget: true, hostedPage: false, api: false },
    modelSelection: false,
    apiRpm: "30",
    maxApiKeys: "0",
    maxHostedPages: "0",
    origins: "無制限（内部制御あり）",
  },
  {
    code: "standard",
    name: "Standard",
    priceLabel: "¥24,800 / 月",
    monthlyPriceJpy: 24800,
    tagline: "公開導線と運用を安定化する",
    target: "埋め込みと共有URL公開を本格運用したいチーム向け",
    botLimitLabel: "2体",
    monthlyMessagesLabel: "5,000 / 月",
    storageLabel: "1,024MB",
    channels: { widget: true, hostedPage: true, api: true },
    modelSelection: true,
    apiRpm: "120",
    maxApiKeys: "2",
    maxHostedPages: "2",
    origins: "無制限（内部制御あり）",
  },
  {
    code: "pro",
    name: "Pro",
    priceLabel: "¥100,000 / 月",
    monthlyPriceJpy: 100000,
    tagline: "複数用途・複数部門へ展開する",
    target: "社内教育や規約監査支援まで拡張したい組織向け",
    botLimitLabel: "無制限表示（内部上限50）",
    monthlyMessagesLabel: "20,000 / 月",
    storageLabel: "10,240MB",
    channels: { widget: true, hostedPage: true, api: true },
    modelSelection: true,
    apiRpm: "300",
    maxApiKeys: "10",
    maxHostedPages: "50",
    origins: "無制限（内部制御あり）",
  },
]

export const pricingComparisonRows: PricingComparisonRow[] = [
  {
    label: "月額",
    values: {
      lite: "¥10,000",
      standard: "¥24,800",
      pro: "¥100,000",
    },
  },
  {
    label: "Bot上限",
    values: {
      lite: "1",
      standard: "2",
      pro: "無制限表示（内部50）",
    },
  },
  {
    label: "月間メッセージ上限",
    values: {
      lite: "1,000",
      standard: "5,000",
      pro: "20,000",
    },
  },
  {
    label: "データ量上限",
    values: {
      lite: "100MB",
      standard: "1,024MB",
      pro: "10,240MB",
    },
  },
  {
    label: "Widget埋め込み",
    values: {
      lite: "可",
      standard: "可",
      pro: "可",
    },
  },
  {
    label: "Hosted Page公開",
    values: {
      lite: "不可",
      standard: "可",
      pro: "可",
    },
  },
  {
    label: "API利用",
    values: {
      lite: "不可",
      standard: "可",
      pro: "可",
    },
  },
  {
    label: "モデル選択",
    values: {
      lite: "不可",
      standard: "可",
      pro: "可",
    },
  },
  {
    label: "APIキー上限",
    values: {
      lite: "0",
      standard: "2",
      pro: "10",
    },
  },
  {
    label: "Hostedページ上限",
    values: {
      lite: "0",
      standard: "2",
      pro: "50",
    },
  },
  {
    label: "API RPM上限",
    values: {
      lite: "30",
      standard: "120",
      pro: "300",
    },
  },
]
