import Link from "next/link"
import { ArrowLeft, BookOpen, ExternalLink, Info, AlertTriangle } from "lucide-react"

import { PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { TableOfContents } from "./toc"

export const metadata = buildMarketingMetadata({
  title: "アカウント・データ管理ガイド",
  description:
    "knoticのログイン方法、パスワードリセット、メールアドレス変更、Botの削除、テナントからの脱退・削除手順を解説します。",
  path: "/help/account",
  keywords: ["ログイン", "パスワードリセット", "メール変更", "Bot削除", "退会", "テナント削除"],
})

export default function AccountDocsPage() {
  return (
    <PageFrame
      eyebrow="Help Center"
      title="アカウント・データ管理ガイド"
      description="ログイン・パスワード管理から、Botの削除・テナント脱退まで、アカウントに関する操作手順をまとめています。"
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

          {/* ログイン */}
          <section id="login" className="mb-10 scroll-mt-28">
            <SectionHeading number={1} title="ログイン方法" />
            <p className="mb-4 text-sm text-muted-foreground">
              knotic はメールアドレスとパスワードでログインします。
            </p>
            <Steps items={[
              <><Link href="/login" className="text-cyan-700 underline underline-offset-2 dark:text-cyan-400">/login</Link> ページを開く</>,
              <>登録済みのメールアドレスとパスワードを入力して「ログイン」</>,
              <>ログイン後、自動的に <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">/console/overview</code> へ遷移します</>,
            ]} />
            <NoteBox text="初回ログイン後はテナント（組織）を作成するか、招待リンクから既存テナントに参加する必要があります。" />
          </section>

          {/* パスワードリセット */}
          <section id="password-reset" className="mb-10 scroll-mt-28">
            <SectionHeading number={2} title="パスワードを忘れた場合" />
            <p className="mb-4 text-sm text-muted-foreground">
              ログインページからパスワードリセットメールを送信できます。
            </p>
            <Steps items={[
              <><Link href="/forgot-password" className="text-cyan-700 underline underline-offset-2 dark:text-cyan-400">/forgot-password</Link> ページを開く（ログインページの「パスワードを忘れた方」リンクからもアクセスできます）</>,
              <>登録済みのメールアドレスを入力して「リセットメールを送信」</>,
              <>届いたメール内のリンクをクリック（有効期限あり）</>,
              <>新しいパスワードを入力して「パスワードを変更」</>,
              <>変更完了後、新しいパスワードでログインできます</>,
            ]} />
            <NoteBox text="リセットメールが届かない場合は迷惑メールフォルダをご確認ください。リンクの有効期限が切れた場合は再度リセット操作を行ってください。" />
          </section>

          {/* メールアドレス変更 */}
          <section id="email-change" className="mb-10 scroll-mt-28">
            <SectionHeading number={3} title="ログインメールアドレスの変更" />
            <p className="mb-4 text-sm text-muted-foreground">
              ログイン用のメールアドレスはコンソールの設定画面から変更できます。変更後は確認メールが届き、メール内のリンクを承認することで新しいアドレスが有効になります。
            </p>
            <Steps items={[
              <><code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; 設定</code> を開く</>,
              <>「<strong>アカウント</strong>」タブを選択</>,
              <>「<strong>ログインメールアドレス</strong>」セクションの「新しいメールアドレス」欄に変更先を入力</>,
              <>「<strong>メールアドレスを変更</strong>」ボタンをクリックし、確認ダイアログで「変更する」</>,
              <>変更先のメールアドレスに確認メールが届くのでリンクをクリック</>,
              <>承認完了後、新しいアドレスでログインできます</>,
            ]} />
            <NoteBox text="承認前は現在のメールアドレスで引き続きログインできます。確認メールのリンクをクリックするまで変更は確定しません。" />
          </section>

          {/* パスワード変更 */}
          <section id="password-change" className="mb-10 scroll-mt-28">
            <SectionHeading number={4} title="パスワードの変更" />
            <p className="mb-4 text-sm text-muted-foreground">
              ログイン中のパスワードはコンソールの設定画面から変更できます。8文字以上で設定してください。
            </p>
            <Steps items={[
              <><code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; 設定</code> を開く</>,
              <>「<strong>アカウント</strong>」タブを選択</>,
              <>「<strong>パスワード変更</strong>」セクションで新しいパスワードと確認用パスワードを入力（8文字以上）</>,
              <>「<strong>パスワードを変更</strong>」ボタンをクリックし、確認ダイアログで「変更する」</>,
              <>変更後は新しいパスワードでログインします</>,
            ]} />
            <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                パスワード変更後、他のデバイスでのセッションが無効になる場合があります。チームメンバーと共有端末を使用している場合はご注意ください。
              </p>
            </div>
          </section>

          {/* Bot削除 */}
          <section id="bot-delete" className="mb-10 scroll-mt-28">
            <SectionHeading number={5} title="Bot を削除する" />
            <p className="mb-4 text-sm text-muted-foreground">
              不要になった Bot は Bot 設定画面から削除（アーカイブ）できます。Editor 権限が必要です。削除後の Bot は復元できません。
            </p>
            <Steps items={[
              <><code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">Console &gt; Bot管理</code> で対象 Bot の「<strong>Bot設定を開く</strong>」をクリック</>,
              <>Bot 設定画面の最下部「<strong>危険な操作</strong>」セクションを開く</>,
              <>「<strong>Botを削除する</strong>」ボタンをクリック</>,
              <>Bot名を入力して削除を確認</>,
              <>削除後、Bot・ナレッジデータ・Widgetトークンはすべて無効になります</>,
            ]} />
            <div className="mt-3 rounded-lg border border-rose-200/60 bg-rose-50/80 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-950/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  <strong>注意：</strong>Bot を削除すると、そのBotに紐づくソースデータ・OpenAI Vector Store・Widgetトークンがすべて削除されます。外部サイトへの Widget 設置コードも無効になります。削除前に必要なデータを手元に保存してください。
                </p>
              </div>
            </div>
          </section>

          {/* テナント脱退 */}
          <section id="leave-tenant" className="mb-10 scroll-mt-28">
            <SectionHeading number={6} title="テナントから脱退する" />
            <p className="mb-4 text-sm text-muted-foreground">
              現在参加しているテナント（組織）から脱退したい場合は、サポートへお問い合わせください。
            </p>
            <div className="rounded-xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/60">
              <p className="text-sm font-medium">現在の仕様</p>
              <p className="mt-1 text-sm text-muted-foreground">
                コンソール画面からのセルフ脱退機能は現在提供していません。脱退をご希望の場合はコンソールのサポートフォームよりご連絡ください。
              </p>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                <p>お問い合わせ時にお知らせください：</p>
                <ul className="space-y-1 pl-3">
                  <li>• ログインメールアドレス</li>
                  <li>• 脱退希望のテナント名（または テナントID）</li>
                </ul>
              </div>
            </div>
            <NoteBox text="テナントの唯一の Editor が脱退する場合、テナントの管理者が不在になります。先に他のメンバーを Editor に昇格させてからご連絡ください。" />
          </section>

          {/* テナント削除 */}
          <section id="tenant-delete" className="mb-10 scroll-mt-28 rounded-xl border border-rose-200/60 bg-rose-50/60 p-5 dark:border-rose-500/30 dark:bg-rose-950/20">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">テナント（組織）の削除について</h2>
            </div>
            <p className="mb-3 text-sm text-rose-800/90 dark:text-rose-300">
              テナント自体の削除（全Botデータ・メンバー情報・契約の完全消去）はコンソール画面からは行えません。サポートへのお問い合わせが必要です。
            </p>
            <div className="grid gap-2 text-xs text-rose-800/90 dark:text-rose-300">
              <p className="font-medium">削除前に確認してください：</p>
              <ul className="space-y-1.5 pl-3">
                <li>• 有料プランに契約中の場合は先に解約してください（<code className="font-mono">Console &gt; Billing &gt; 解約を予約</code>）</li>
                <li>• 外部サイトに設置した Widget コードはすべて無効になります</li>
                <li>• 削除後のデータ復元はできません</li>
                <li>• すべてのメンバーのアクセスが停止されます</li>
              </ul>
            </div>
            <p className="mt-3 text-xs text-rose-700 dark:text-rose-400">
              削除をご希望の場合は、コンソールのサポートフォームよりテナント名・ログインメールアドレスをご連絡ください。
            </p>
          </section>

          {/* フッター */}
          <div className="mt-12 flex flex-col gap-3 rounded-xl border border-black/10 bg-white/80 px-5 py-4 dark:border-white/10 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-4 shrink-0" />
              <span>不明な点はコンソールからお問い合わせください。</span>
            </div>
            <Link
              href="/console/settings"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              設定画面へ
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
