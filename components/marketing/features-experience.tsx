"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Bot,
  Code2,
  Eye,
  FileText,
  Globe,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Palette,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const steps = [
  {
    num: "01",
    title: "情報を登録する",
    description:
      "WebサイトのURLを貼るだけで最大50ページを自動収集。PDFは1ファイル最大20MBまでアップロード可能。複数ソースをまとめて登録できます。",
    icon: FileText,
    numColor: "text-cyan-600/70 dark:text-cyan-400/60",
    iconBg: "bg-cyan-50 dark:bg-cyan-900/40",
    iconColor: "text-cyan-700 dark:text-cyan-300",
  },
  {
    num: "02",
    title: "AIが自動で準備する",
    description:
      "テキストを抽出・整理し、質問に素早く答えられる形式に自動変換。AIモデルの専門知識や複雑な設定は一切不要です。",
    icon: Layers,
    numColor: "text-violet-600/70 dark:text-violet-400/60",
    iconBg: "bg-violet-50 dark:bg-violet-900/40",
    iconColor: "text-violet-700 dark:text-violet-300",
  },
  {
    num: "03",
    title: "根拠付きで回答する",
    description:
      "ユーザーの質問に対してナレッジから関連情報を検索し回答。回答の元となったページやファイルを出典として提示できます。",
    icon: MessageSquare,
    numColor: "text-emerald-600/70 dark:text-emerald-400/60",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/40",
    iconColor: "text-emerald-700 dark:text-emerald-300",
  },
  {
    num: "04",
    title: "公開して改善する",
    description:
      "Widget・専用URL・APIで公開後も、ソースを更新すればBotの内容に即反映。公開設定や権限はいつでも変更できます。",
    icon: Zap,
    numColor: "text-amber-600/70 dark:text-amber-400/60",
    iconBg: "bg-amber-50 dark:bg-amber-900/40",
    iconColor: "text-amber-700 dark:text-amber-300",
  },
]

const publishMethods = [
  {
    icon: Code2,
    title: "Widget埋め込み",
    plan: "全プラン",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    description:
      "scriptタグを1行既存サイトに貼るだけで、チャットボタンが追加されます。表示方法はオーバーレイ・外部ページへのリダイレクト・両方から選択でき、設置位置（右下/右上）も変更可能です。",
    details: [
      "許可ドメインを指定してトークンの悪用を防止",
      "ブランドカラーに合わせた配色カスタマイズ",
      "既存サイトの改修なし、コピペだけで完了",
    ],
  },
  {
    icon: Globe,
    title: "Hosted Page（専用URL）",
    plan: "Standard以上",
    badgeClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200",
    iconClass: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    description:
      "knoticが提供する独立したチャット画面を専用URLで公開・共有できます。サイトへの埋め込みが難しい場合や、手軽に社外・社内に展開したいときに便利です。",
    details: [
      "社内限定モード（ログイン必須）も選択可",
      "24時間ブラウザ内で会話履歴を保持",
      "Standardは最大2ページ、Proは最大50ページ",
    ],
  },
  {
    icon: Key,
    title: "REST API",
    plan: "Standard以上",
    badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
    iconClass: "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    description:
      "自社のアプリやシステムからBotを直接呼び出せるREST APIを提供。既存サービスへの組み込みやカスタムUIの構築など、開発者向けの高度な連携が可能です。",
    details: [
      "APIキー認証（平文は発行時1回のみ表示）",
      "Standardで最大2キー / Proで最大10キー",
      "Standardは120 RPM / Proは300 RPM",
    ],
  },
]

const customizations = [
  {
    icon: Bot,
    title: "チャット目的の設定",
    description:
      "お問い合わせ対応・リード獲得・社内ナレッジ・導入ガイド・カスタムから目的を選択。AIの回答スタイルが目的に合わせて最適化されます。",
  },
  {
    icon: Sparkles,
    title: "AIモデルの選択",
    description:
      "Standard・Proプランでは複数のモデル（gpt-4o-mini, gpt-4o ほか）から選択可能。速度重視・品質重視など用途に合わせて使い分けられます。",
  },
  {
    icon: Search,
    title: "出典（引用元）の表示",
    description:
      "回答の根拠となったページURLやPDFファイル名をユーザーに提示するかを切り替えられます。情報の信頼性を高めたい用途に有効です。",
  },
  {
    icon: MessageSquare,
    title: "会話の記憶ターン数",
    description:
      "過去の会話を何ターン分考慮して回答するかを設定。Liteは最大20ターン、Standard・Proは最大30ターンまで対応できます。",
  },
  {
    icon: Palette,
    title: "カラーカスタマイズ",
    description:
      "チャット画面のヘッダー・フッターの背景色とテキスト色を変更可能。自社ブランドのカラーに合わせた見た目に整えられます。",
  },
  {
    icon: Eye,
    title: "保存前テストチャット",
    description:
      "設定を保存する前に実際の会話をシミュレーションできるプレビュー機能。本番公開前に回答品質を確認してから公開できます。",
  },
]

const securityItems = [
  {
    icon: Lock,
    title: "アクセスモード制御",
    description:
      "公開モード（誰でも利用可）と社内限定モード（ログイン必須）をBotごとに切り替え可能。Hosted PageではさらにBot単位で認証を必須にする設定も選べます。",
  },
  {
    icon: Shield,
    title: "Widget オリジン制限",
    description:
      "Widgetが動作を許可するドメインを指定。登録外のサイトからのWidget起動をブロックし、発行したトークンの悪用を防ぎます。",
  },
  {
    icon: Settings2,
    title: "全操作の監査ログ",
    description:
      "Bot設定の変更・ソース追加・メンバー招待など、すべての操作が操作者・内容・日時とともに自動記録。運用証跡としていつでも確認できます。",
  },
  {
    icon: Users,
    title: "メンバー招待と権限管理",
    description:
      "メールアドレスでメンバーを招待し、Editor（設定変更可）またはReader（閲覧のみ）の権限を付与。チームで安全に運用できます。",
  },
]

function FeaturesExperience() {
  return (
    <div className="grid gap-6 sm:gap-8">
      {/* ① ビジョンと主要スペック */}
      <section className="relative overflow-hidden rounded-3xl border border-black/20 bg-white/90 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/75">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/15" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-400/10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            What is knotic
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            URLを貼るか、PDFをアップロードするだけ。
            <br />
            <span className="bg-gradient-to-r from-cyan-700 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-300 dark:to-emerald-300">
              AIチャットボットが自動で完成します。
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8 dark:text-zinc-300">
            専門的な知識や複雑な設定は不要です。登録した情報をAIが自動的にインデックス化し、自社サイトへの埋め込みや専用URLでの公開をすぐに始められます。
          </p>
        </motion.div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { num: "50", unit: "ページ", label: "URL登録時の自動収集上限" },
            { num: "20", unit: "MB", label: "PDFファイル1つあたりの上限" },
            { num: "24", unit: "時間", label: "Hosted Pageの会話履歴保持" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.3, delay: 0.06 * i }}
              className="rounded-2xl border border-black/20 bg-white/80 p-3 text-center sm:p-4 dark:border-white/10 dark:bg-slate-950/40"
            >
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                {stat.num}
                <span className="ml-0.5 text-base font-medium text-zinc-500 dark:text-zinc-400">{stat.unit}</span>
              </p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500 sm:text-xs dark:text-zinc-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ② 4ステップフロー */}
      <section className="rounded-3xl border border-black/20 bg-white/85 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          Workflow
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">導入から公開までの4ステップ</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          すべての操作が管理コンソールから完結します。エンジニアなしでも運用できます。
        </p>

        <div className="mt-5 grid gap-3 sm:gap-4 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: 0.07 * i }}
              className="relative rounded-2xl border border-black/20 bg-white/85 p-4 sm:p-5 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`font-mono text-2xl font-bold leading-none ${step.numColor}`}>{step.num}</span>
                <div className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${step.iconBg}`}>
                  <step.icon className={`size-4 ${step.iconColor}`} />
                </div>
              </div>
              <p className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ③ 3つの公開方法 */}
      <section className="rounded-3xl border border-black/20 bg-white/85 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
          Publishing
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">3通りの公開・連携方法</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          用途やシステム環境に合わせて公開方法を選べます。同一Botで複数の公開方法を組み合わせることも可能です。
        </p>

        <div className="mt-5 grid gap-3 sm:gap-4 lg:grid-cols-3">
          {publishMethods.map((method, i) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.32, delay: 0.07 * i }}
              className="flex flex-col rounded-2xl border border-black/20 bg-white/85 p-4 sm:p-5 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${method.iconClass}`}
                >
                  <method.icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{method.title}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${method.badgeClass}`}>
                    {method.plan}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{method.description}</p>
              <ul className="mt-3 grid gap-1.5">
                {method.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <ArrowRight className="mt-0.5 size-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ④ Botカスタマイズ */}
      <section className="rounded-3xl border border-black/20 bg-white/85 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          Customization
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Botの設定と調整</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          目的・トーン・ビジュアルをコンソールから設定。公開後もいつでも変更できます。
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {customizations.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="flex gap-3 rounded-2xl border border-black/20 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <item.icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ⑤ セキュリティと管理 */}
      <section className="-mx-4 border-y border-black/20 bg-white/85 px-4 py-6 sm:mx-0 sm:rounded-3xl sm:border sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Security & Management
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">セキュリティとチーム管理</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          アクセス制御・操作ログ・メンバー権限を標準装備。安心して組織で運用できます。
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {securityItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.3, delay: 0.06 * i }}
              className="flex gap-3 rounded-2xl border border-black/20 bg-white/80 p-4 sm:p-5 dark:border-white/10 dark:bg-slate-950/45"
            >
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ⑥ 次のページへの導線 */}
      <section className="rounded-2xl border border-black/20 bg-white/80 p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/70">
        <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">次に確認するページ</h3>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          料金・活用例・セキュリティの詳細も合わせてご確認ください。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/pricing">料金を見る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/use-cases">活用例を見る</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/security">セキュリティを見る</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export { FeaturesExperience }
