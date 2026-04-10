import Link from "next/link"
import { ArrowLeft, BookOpen, ExternalLink, Info, AlertTriangle, CreditCard, CheckCircle2 } from "lucide-react"

import { PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { TableOfContents } from "./toc"

export const metadata = buildMarketingMetadata({
  title: "プラン・料金ガイド",
  description:
    "knoticの無料プランの制限とデータ保持ポリシー、有料プラン（Lite/Standard/Pro）の比較、Billing画面の見方、プラン変更・解約方法を解説します。",
  path: "/help/plans",
  keywords: ["knotic プラン", "料金", "無料プラン", "データ削除", "解約方法", "Billing"],
})

const PLAN_TABLE = [
  {
    name: "無料",
    price: "¥0",
    bots: "1体",
    messages: "50回/月",
    storage: "50 MB",
    hosted: "×",
    api: "×",
    note: "プレビュー・動作確認用",
    highlight: false,
  },
  {
    name: "Starter",
    price: "¥4,900/月",
    bots: "1体",
    messages: "300回/月",
    storage: "75 MB",
    hosted: "×",
    api: "×",
    note: "サイト設置・小規模運用",
    highlight: false,
  },
  {
    name: "Lite",
    price: "¥9,800/月",
    bots: "1体",
    messages: "1,000回/月",
    storage: "100 MB",
    hosted: "×",
    api: "×",
    note: "利用増加・本格 Widget 運用",
    highlight: false,
  },
  {
    name: "Standard",
    price: "¥24,800/月",
    bots: "2体",
    messages: "5,000回/月",
    storage: "1,024 MB",
    hosted: "◎",
    api: "◎",
    note: "公開導線と API 連携",
    highlight: true,
  },
  {
    name: "Pro",
    price: "¥100,000/月",
    bots: "最大50体",
    messages: "20,000回/月",
    storage: "10,240 MB",
    hosted: "◎",
    api: "◎",
    note: "複数部門への本格展開",
    highlight: false,
  },
]

export default function PlansDocsPage() {
  return (
    <PageFrame
      eyebrow="Help Center"
      title="プラン・料金ガイド"
      description="無料プランの制限・データ保持ポリシー、有料プランの違い、Billing画面の操作方法を解説します。"
    >
      <div className="mb-6">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="size-4" />
          ヘルプセンターに戻る
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">

        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
            <TableOfContents />
          </div>
        </aside>

        <main className="min-w-0">

          {/* 無料プランでできること */}
          <section id="free-tier" className="mb-10 scroll-mt-28">
            <SectionHeading number={1} title="無料プランでできること" />
            <p className="mb-4 text-sm text-muted-foreground">
              knotic はアカウント作成直後から無料で利用を開始できます。プレビュー機能で AIチャットの動作を確認するまでは費用がかかりません。
            </p>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Bot 作成", value: "1体まで", ok: true },
                { label: "ナレッジ登録", value: "URL / ファイル", ok: true },
                { label: "プレビューチャット", value: "コンソール内で確認可", ok: true },
                { label: "月間メッセージ", value: "50回まで", ok: true },
                { label: "ストレージ", value: "50 MB まで", ok: true },
                { label: "Widget 公開", value: "不可（契約が必要）", ok: false },
                { label: "Hosted URL 公開", value: "不可", ok: false },
                { label: "API 利用", value: "不可", ok: false },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${item.ok ? "border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-950/20" : "border-slate-200/60 bg-slate-50/60 dark:border-white/10 dark:bg-slate-800/30"}`}>
                  <span className="font-medium">{item.label}</span>
                  <span className={`text-xs ${item.ok ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <NoteBox text="Widget を外部サイトに公開するには、いずれかの有料プランへの契約が必要です。プレビューはコンソール内でのみ動作確認できます。" />
          </section>

          {/* データ保持ポリシー */}
          <section id="data-retention" className="mb-10 scroll-mt-28 rounded-xl border border-amber-200/60 bg-amber-50/60 p-5 dark:border-amber-500/30 dark:bg-amber-950/20">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">データ保持ポリシー（無料プランのみ）</h2>
            </div>
            <p className="mb-4 text-sm text-amber-800/90 dark:text-amber-300">
              無料プランでは、長期間操作がないテナントのBotデータを自動削除します。有料プランに契約している場合はこのポリシーは適用されません。
            </p>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 rounded-lg border border-amber-300/50 bg-white/70 px-4 py-3 dark:border-amber-500/30 dark:bg-slate-900/40">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">7</span>
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">最終操作から7日経過</p>
                  <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400">コンソールのBot管理画面に削除予告の警告バナーが表示されます</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-rose-300/50 bg-white/70 px-4 py-3 dark:border-rose-500/30 dark:bg-slate-900/40">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">14</span>
                <div>
                  <p className="text-sm font-medium text-rose-900 dark:text-rose-200">最終操作から14日経過</p>
                  <p className="mt-0.5 text-xs text-rose-700/80 dark:text-rose-400">Bot・ナレッジ・ストレージデータをすべて自動削除します（復元不可）</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-amber-300/50 bg-amber-100/60 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-900/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>「操作」の定義：</strong>Bot作成、ソース追加・更新、設定変更など、コンソールでの変更を伴う操作が対象です。ログイン・閲覧のみでは操作とみなされません。
              </p>
            </div>
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
              いずれかの有料プランに契約すると、即時に削除対象から除外されます。データを長期保持したい場合はプランへの加入をご検討ください。
            </p>
          </section>

          {/* プラン比較 */}
          <section id="plan-comparison" className="mb-10 scroll-mt-28">
            <SectionHeading number={2} title="プラン比較" />
            <p className="mb-4 text-sm text-muted-foreground">
              各プランの機能・上限の比較です。プランは <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; Billing</code> からいつでも変更できます。
            </p>
            <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
              <table className="w-full min-w-[540px] text-xs">
                <thead>
                  <tr className="border-b border-black/10 bg-slate-50 dark:border-white/10 dark:bg-slate-900/60">
                    <th className="px-3 py-2.5 text-left font-semibold">プラン</th>
                    <th className="px-3 py-2.5 text-left font-semibold">月額</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Bot数</th>
                    <th className="px-3 py-2.5 text-left font-semibold">メッセージ</th>
                    <th className="px-3 py-2.5 text-left font-semibold">容量</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Hosted</th>
                    <th className="px-3 py-2.5 text-center font-semibold">API</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {PLAN_TABLE.map((plan) => (
                    <tr key={plan.name} className={plan.highlight ? "bg-cyan-50/60 dark:bg-cyan-950/20" : "bg-white dark:bg-slate-900/40"}>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold">{plan.name}</span>
                        {plan.highlight && <span className="ml-1.5 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">人気</span>}
                        <br />
                        <span className="text-[11px] text-muted-foreground">{plan.note}</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{plan.price}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{plan.bots}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{plan.messages}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{plan.storage}</td>
                      <td className="px-3 py-2.5 text-center">{plan.hosted === "◎" ? <span className="text-emerald-600">◎</span> : <span className="text-slate-300 dark:text-slate-600">×</span>}</td>
                      <td className="px-3 py-2.5 text-center">{plan.api === "◎" ? <span className="text-emerald-600">◎</span> : <span className="text-slate-300 dark:text-slate-600">×</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              月間メッセージ数は毎月1日にリセットされます。上限に達した場合はチャットが一時停止され、翌月から再開します。詳細は <Link href="/pricing" className="text-cyan-700 underline underline-offset-2 dark:text-cyan-400">料金ページ</Link> をご確認ください。
            </p>
          </section>

          {/* Billing画面の見方 */}
          <section id="billing-screen" className="mb-10 scroll-mt-28">
            <SectionHeading number={3} title="Billing 画面の見方" />
            <p className="mb-4 text-sm text-muted-foreground">
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; Billing</code> からプランの契約状況・請求情報を確認できます。Editor 権限が必要です。
            </p>
            <div className="grid gap-3">
              {[
                {
                  label: "契約情報",
                  desc: "現在のプラン名・月額・契約ステータス（有効 / トライアル中 / 支払い遅延 など）・次回更新日を確認できます",
                },
                {
                  label: "利用状況",
                  desc: "現在のBot数・ストレージ使用量・アクティブAPIキー数が表示されます。上限に近づくと強調表示されます",
                },
                {
                  label: "プラン選択",
                  desc: "利用可能なプラン（Lite / Standard / Pro）が一覧表示されます。現在のプランはハイライト表示されます",
                },
                {
                  label: "支払い方法",
                  desc: "登録済みのカード情報（ブランド・下4桁・有効期限）が表示されます。変更は「Customer Portal」ボタンから行います",
                },
                {
                  label: "請求履歴",
                  desc: "過去の請求書が最新8件分表示されます。各請求書のステータス・金額・期間を確認できます",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-black/10 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-slate-800/40">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* プラン変更 */}
          <section id="plan-change" className="mb-10 scroll-mt-28">
            <SectionHeading number={4} title="プラン変更の方法" />
            <p className="mb-4 text-sm text-muted-foreground">
              プラン変更は <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; Billing</code> のプラン選択セクションから行います。Editor 権限が必要です。
            </p>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/60 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">アップグレード（上位プランへ）</p>
                <ul className="mt-2 space-y-1 text-xs text-emerald-700 dark:text-emerald-400">
                  <li>• 即時反映（差額は日割りで追加請求）</li>
                  <li>• 上位機能（Hosted URL / API など）が即時使用可能になります</li>
                  <li>• 既存の Bot データはそのまま引き継がれます</li>
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">ダウングレード（下位プランへ）</p>
                <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                  <li>• 次回更新日から反映（即時変更なし）</li>
                  <li>• 新プランの上限を超えている場合は事前に削減が必要</li>
                  <li>• 変更予約後は追加のプラン変更はできません</li>
                </ul>
              </div>
            </div>

            <Steps items={[
              <><code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; Billing</code> を開く</>,
              <>プラン選択セクションで変更先のプランを確認し「このプランに変更」ボタンをクリック</>,
              <>変更内容（Bot数・ストレージ・機能の増減）を確認して「確定」</>,
              <>アップグレードの場合：即時反映。ダウングレードの場合：次回更新日までは現在のプランで継続</>,
            ]} />
          </section>

          {/* 解約 */}
          <section id="cancel" className="mb-10 scroll-mt-28">
            <SectionHeading number={5} title="解約方法" />
            <p className="mb-4 text-sm text-muted-foreground">
              解約は <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; Billing</code> の契約情報セクションから行います。「解約を予約」ボタンが表示されていれば操作できます。
            </p>
            <Steps items={[
              <><code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; Billing</code> を開く</>,
              <>契約情報セクションの「<strong>解約を予約</strong>」ボタンをクリック</>,
              <>確認ダイアログで「予約する」を選択</>,
              <>現在の請求期間の終了日まではサービスを継続利用できます</>,
              <>解約後は無料プランに移行し、データ保持ポリシーが適用されます</>,
            ]} />
            <div className="mt-3 rounded-lg border border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-800/40">
              <p className="text-xs text-muted-foreground">
                <strong>解約を取り消したい場合：</strong>請求期間終了前であれば、同じ画面の「<strong>自動更新を再開</strong>」ボタンから解約予約をキャンセルできます。
              </p>
            </div>
          </section>

          {/* お支払い */}
          <section id="payment" className="mb-10 scroll-mt-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold">お支払いについて</h2>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {[
                ["決済方法", "クレジットカード（Stripe 経由）"],
                ["請求サイクル", "月次（契約開始日から1ヶ月ごと）"],
                ["支払い方法の変更", "Billing 画面 →「Customer Portal を開く」から変更"],
                ["領収書・請求書", "Billing 画面の請求履歴から各請求書を確認できます"],
                ["支払い失敗時", "Billing 画面上部に警告が表示されます。Customer Portal から支払い方法を更新してください"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span className="shrink-0 font-medium text-foreground">{label}：</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              請求・支払いに関するご不明点はコンソールのサポートフォームよりお問い合わせください。
            </p>
          </section>

          {/* フッター */}
          <div className="mt-12 flex flex-col gap-3 rounded-xl border border-black/10 bg-white/80 px-5 py-4 dark:border-white/10 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-4 shrink-0" />
              <span>プラン・契約に関する詳細はコンソールから確認できます。</span>
            </div>
            <Link
              href="/console/billing"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Billing を開く
              <ExternalLink className="size-3" />
            </Link>
          </div>

        </main>
      </div>
    </PageFrame>
  )
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
        {number}
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  )
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mb-4 space-y-2 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function NoteBox({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-800/40">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
