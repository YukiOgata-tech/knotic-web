import { AlertTriangle, BookOpen, Bot, ChevronRight, CreditCard, Eye, FileSearch, LayoutDashboard, ScrollText, Settings2, ShieldAlert, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Section({ id, icon: Icon, title, children }: {
  id: string
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-4 border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 shrink-0 text-amber-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {children}
      </CardContent>
    </Card>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl border border-amber-300/50 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Danger({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl border border-red-300/50 bg-red-50/60 px-3 py-2.5 text-xs text-red-800 dark:border-red-700/40 dark:bg-red-950/20 dark:text-red-300">
      <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 px-3 py-2.5 text-xs text-blue-800 dark:border-blue-700/30 dark:bg-blue-950/20 dark:text-blue-300">
      {children}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-bold text-amber-600 dark:text-amber-400">
        {n}
      </span>
      <span className="text-sm leading-relaxed">{children}</span>
    </div>
  )
}

function Dl({ items }: { items: { term: string; desc: string }[] }) {
  return (
    <div className="grid gap-1.5">
      {items.map((item) => (
        <div key={item.term} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          <Badge variant="outline" className="h-fit whitespace-nowrap font-mono text-[11px]">
            {item.term}
          </Badge>
          <span className="text-sm text-muted-foreground">{item.desc}</span>
        </div>
      ))}
    </div>
  )
}

const TOC = [
  { id: "overview",     label: "このコンソールについて",       icon: BookOpen },
  { id: "tenants",      label: "テナント管理",                 icon: LayoutDashboard },
  { id: "billing",      label: "契約・請求管理（Override）",   icon: CreditCard },
  { id: "impersonation",label: "代理閲覧",                    icon: Eye },
  { id: "force-stop",   label: "緊急停止操作",                 icon: ShieldAlert },
  { id: "members",      label: "メンバー招待・権限管理",        icon: Users },
  { id: "plans",        label: "プランリミット変更",            icon: Settings2 },
  { id: "bots",         label: "Bot管理",                     icon: Bot },
  { id: "audit-logs",   label: "監査ログ",                    icon: ScrollText },
  { id: "indexing",     label: "インデックスジョブ",            icon: FileSearch },
]

export default function DocsPage() {
  return (
    <div className="grid gap-4">
      {/* ヘッダー */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-amber-500" />
            運用者ドキュメント
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Knotic プラットフォーム管理コンソールの操作ガイドです。テナント管理・契約管理・緊急停止など、各機能の使い方と注意事項をまとめています。
          </p>
          {/* 目次 */}
          <div className="grid gap-1 sm:grid-cols-2">
            {TOC.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                >
                  <Icon className="size-3.5 shrink-0 text-amber-500" />
                  {item.label}
                  <ChevronRight className="ml-auto size-3.5 opacity-40" />
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 1. このコンソールについて */}
      <Section id="overview" icon={BookOpen} title="このコンソールについて">
        <p className="text-muted-foreground">
          このコンソールは <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">operations.knotic.*</code> サブドメイン専用の管理画面です。
          通常の契約者コンソール（<code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">/console</code>）とは独立したログインが必要です。
        </p>
        <Dl items={[
          { term: "owner", desc: "全操作が可能。プランリミット変更・Override無効化など破壊的操作を含む。" },
          { term: "staff", desc: "参照・テナント管理・Override設定は可能。プランリミット変更は不可。" },
        ]} />
        <Info>
          セッションはブラウザごとに独立しています。通常のKnoticアカウントでログインしていても、このコンソールは別途ログインが必要です。
        </Info>
      </Section>

      {/* 2. テナント管理 */}
      <Section id="tenants" icon={LayoutDashboard} title="テナント管理">
        <p className="text-muted-foreground">
          ダッシュボードでは全テナントを一覧表示します。1ページ30件・作成日降順。slug または表示名で検索できます。
        </p>
        <div className="grid gap-2">
          <p className="font-medium">テナント詳細ページのタブ構成</p>
          <Dl items={[
            { term: "概要",     desc: "テナントの有効化状態・強制停止の制御。日常的な状態確認はここ。" },
            { term: "契約・請求", desc: "Stripe契約の確認・手動Overrideの設定・Stripe決済URL発行。" },
            { term: "メンバー",  desc: "メンバー一覧・招待メール送信・既存アカウントへの権限付与。" },
            { term: "Bot管理",  desc: "テナント配下のBot一覧・個別Bot強制停止。" },
          ]} />
        </div>
        <div className="grid gap-2">
          <p className="font-medium">テナント新規作成</p>
          <div className="grid gap-1.5">
            <Step n={1}>サイドバーの「テナント作成」から必要情報を入力。</Step>
            <Step n={2}>オーナーのメールアドレスは <strong>Supabaseに登録済みのアカウント</strong> である必要があります。未登録の場合はまず「メンバー」タブから招待メールを送ってください。</Step>
            <Step n={3}>「請求形態を設定する」をONにするとOverrideも同時に作成されます（銀行振込・請求書払い向け）。</Step>
          </div>
        </div>
        <Warn>テナント削除機能はありません。無効化（active = false）で解約済み扱いにしてください。</Warn>
      </Section>

      {/* 3. 契約・請求管理 */}
      <Section id="billing" icon={CreditCard} title="契約・請求管理（Override）">
        <p className="text-muted-foreground">
          Knoticの契約管理は <strong>Stripe</strong> と <strong>手動Override</strong> の2系統があります。Overrideが有効な場合はStripeを完全に無視してプラン制限を適用します。
        </p>
        <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
          <p className="mb-2 text-xs font-medium text-muted-foreground">プラン判定の優先順位</p>
          <div className="flex items-center gap-1.5 text-sm">
            <Badge variant="default" className="bg-amber-500">Override（is_active=true）</Badge>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <Badge variant="outline">Stripe subscription</Badge>
          </div>
        </div>
        <div className="grid gap-2">
          <p className="font-medium">Override の使いどころ</p>
          <Dl items={[
            { term: "bank_transfer", desc: "銀行振込払いの顧客。請求書発行後に手動でOverrideを有効化する。" },
            { term: "invoice",       desc: "請求書払い（インボイス対応）の顧客。" },
            { term: "manual",        desc: "社内利用・無料提供など個別対応が必要なケース。" },
          ]} />
        </div>
        <div className="grid gap-1.5">
          <p className="font-medium">is_active トグルの意味</p>
          <Dl items={[
            { term: "ON（有効）",  desc: "このOverrideを即時適用。Stripeの契約状態は無視される。" },
            { term: "OFF（無効）", desc: "設定はDBに残るが適用されない。Stripeに基づく判定に戻る。" },
          ]} />
        </div>
        <div className="grid gap-1.5">
          <p className="font-medium">Stripe 決済URLの発行</p>
          <Step n={1}>「契約・請求」タブ → 「Stripe 決済URL発行」セクション。</Step>
          <Step n={2}>発行されたURLを顧客に共有すると、顧客自身がStripe Checkoutで決済できます。</Step>
          <Step n={3}>有効期限は発行から約24時間。期限切れの場合は再発行してください。</Step>
        </div>
        <Warn>Override有効中にStripe側でサブスクリプションを変更しても、Override期間中はプラン制限に反映されません。</Warn>
      </Section>

      {/* 4. 代理閲覧 */}
      <Section id="impersonation" icon={Eye} title="代理閲覧（インポーソネーション）">
        <p className="text-muted-foreground">
          管理者が特定テナントの契約者コンソールを閲覧できる機能です。顧客サポートや障害調査に使用します。
        </p>
        <div className="grid gap-1.5">
          <Step n={1}>テナント詳細ページ（どのタブからでも可）または一覧ページの「代理閲覧」ボタンをクリック。</Step>
          <Step n={2}>確認ダイアログで「開始する」を押すと <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">/console/overview</code> へ遷移。</Step>
          <Step n={3}>コンソール上部に「代理閲覧中」バナーが表示されます。終了するにはバナーの「終了」ボタンをクリック。</Step>
        </div>
        <Danger>
          代理閲覧中はデータの書き込み操作（Bot作成・設定変更など）がすべてブロックされます（読み取り専用）。セッションは1時間で自動終了します。
        </Danger>
        <Info>代理閲覧の開始・終了は監査ログに記録されます（<code className="text-xs">platform.impersonation.start / stop</code>）。</Info>
      </Section>

      {/* 5. 緊急停止 */}
      <Section id="force-stop" icon={ShieldAlert} title="緊急停止操作">
        <p className="text-muted-foreground">
          不正利用・システム障害・支払い問題などの緊急時にテナントまたは個別Botの応答を即座にブロックできます。
        </p>
        <div className="grid gap-3">
          <div>
            <p className="mb-1.5 font-medium">テナント強制停止（全Bot一括）</p>
            <div className="grid gap-1.5">
              <Step n={1}>テナント詳細 → 「概要」タブ → 「テナント強制停止」カード。</Step>
              <Step n={2}>停止理由を入力（任意）→「tenantを強制停止する」にチェック → 確認して更新。</Step>
              <Step n={3}>そのテナントの全Botへのチャットリクエストが即座に <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">503</code> を返すようになります。</Step>
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-medium">個別Bot停止</p>
            <div className="grid gap-1.5">
              <Step n={1}>テナント詳細 → 「Bot管理」タブ → 対象Botの「強制停止する」にチェック。</Step>
              <Step n={2}>他のBotには影響しません。</Step>
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-medium">解除手順</p>
            <Step n={1}>同じ画面でチェックを外して更新するだけです。即時反映されます。</Step>
          </div>
        </div>
        <Danger>
          force_stop はチャットAPIへのアクセスをブロックするだけで、データは削除されません。テナント有効化状態（active）とは別の概念です。混同しないよう注意してください。
        </Danger>
        <Dl items={[
          { term: "force_stop = true",  desc: "チャット応答をブロック。インデックスジョブも停止。データは保持。" },
          { term: "active = false",     desc: "解約済み扱い。コンソールログインは可能だが契約判定が無効扱いになる。" },
        ]} />
      </Section>

      {/* 6. メンバー招待 */}
      <Section id="members" icon={Users} title="メンバー招待・権限管理">
        <p className="text-muted-foreground">
          テナントへのメンバー追加は「招待メール送信」と「既存アカウントへの権限付与」の2通りがあります。
        </p>
        <div className="grid gap-3">
          <div>
            <p className="mb-1.5 font-medium">招待メール送信（未登録ユーザー向け）</p>
            <div className="grid gap-1.5">
              <Step n={1}>テナント詳細 → 「メンバー」タブ → 「招待メール送信」フォームにメールアドレスを入力。</Step>
              <Step n={2}>Supabaseが招待メールを自動送信。受信者がリンクをクリックしてパスワードを設定するとアカウント作成完了。</Step>
              <Step n={3}>メンバーシップは招待時点で事前登録されるため、受け入れ後すぐにコンソールへアクセスできます。</Step>
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-medium">既存アカウントへの権限付与</p>
            <Step n={1}>メールアドレスを入力してroleを選択するだけ。すでにアカウントがある場合はメール送信なしで即時反映されます。</Step>
          </div>
        </div>
        <Dl items={[
          { term: "editor", desc: "Bot作成・設定変更・ソース追加など全操作が可能。" },
          { term: "reader", desc: "コンソールの閲覧のみ。データの変更・Bot操作は不可。" },
        ]} />
        <Warn>同一メールアドレスへの重複招待は「既存アカウントにメンバーシップを付与」として処理されます（エラーにはなりません）。</Warn>
      </Section>

      {/* 7. プランリミット変更 */}
      <Section id="plans" icon={Settings2} title="プランリミット変更">
        <p className="text-muted-foreground">
          各プランのBot数上限・月間メッセージ数などの制限値を変更できます。変更は即時反映され、全テナントのリミット判定に影響します。
        </p>
        <div className="grid gap-1.5">
          <Step n={1}>サイドバーの「プラン管理」ページを開く。</Step>
          <Step n={2}>変更したいプランのカードで数値を編集。</Step>
          <Step n={3}>「保存する」→「本当に更新する」の2段階確認で保存。</Step>
        </div>
        <Dl items={[
          { term: "max_bots",               desc: "作成できるBotの上限数。" },
          { term: "max_monthly_messages",   desc: "月間チャットメッセージの上限数。超過すると応答が停止する。" },
          { term: "max_storage_mb",         desc: "ソースファイルのストレージ上限（MB）。" },
          { term: "max_hosted_pages",       desc: "Hosted URLとして公開できるBotの上限数。" },
          { term: "internal_max_bots_cap",  desc: "max_botsに対する追加の上限キャップ（0=無効）。個別調整に使用。" },
          { term: "has_api",                desc: "APIキーによるチャットAPI利用の可否。" },
          { term: "has_hosted_page",        desc: "Hosted URL公開機能の利用可否。" },
        ]} />
        <Danger>
          プランリミットの変更は<strong>そのプランを契約している全テナントに即時反映</strong>されます。既存テナントへの影響を必ず事前に確認してください。個別テナントだけ制限を変えたい場合は「手動Override」を使用してください。
        </Danger>
      </Section>

      {/* 8. Bot管理 */}
      <Section id="bots" icon={Bot} title="Bot管理">
        <p className="text-muted-foreground">
          テナント詳細の「Bot管理」タブで、そのテナント配下の全Botを確認・制御できます。
        </p>
        <Dl items={[
          { term: "status: active",   desc: "通常稼働中。チャットリクエストを受け付ける。" },
          { term: "status: archived", desc: "アーカイブ済み。テナント側で非表示にした状態。APIは応答しない。" },
          { term: "force_stopped",    desc: "強制停止中。管理者側で応答をブロックしている状態。" },
          { term: "is_public",        desc: "Hosted URLページへの公開設定。" },
          { term: "access_mode",      desc: "internal = ログイン必須、それ以外は公開アクセス可。" },
        ]} />
        <Info>Botの詳細設定（プロンプト・ソース・Widget設定など）は代理閲覧経由で契約者コンソールから確認してください。管理コンソールからの直接編集はできません。</Info>
      </Section>

      {/* 9. 監査ログ */}
      <Section id="audit-logs" icon={ScrollText} title="監査ログ">
        <p className="text-muted-foreground">
          コンソール上の全ミューテーション操作が記録されます。不審な操作の調査や変更履歴の確認に使用します。
        </p>
        <Dl items={[
          { term: "platform.*",  desc: "管理コンソールでの操作（テナント管理・Override設定・代理閲覧など）。" },
          { term: "console.*",   desc: "テナントの契約者コンソールでの操作（Bot作成・設定変更など）。" },
          { term: "bot.*",       desc: "Botに関する操作。" },
          { term: "source.*",    desc: "ソース（URL/PDF）の追加・削除。" },
          { term: "billing.*",   desc: "請求・プラン関連の操作。" },
        ]} />
        <div className="grid gap-1.5">
          <p className="font-medium">フィルタ機能</p>
          <Step n={1}>tenant_id（UUID）を入力すると特定テナントの操作のみに絞り込めます。</Step>
          <Step n={2}>アクション種別（platform.* など）でカテゴリ絞り込みが可能です。</Step>
        </div>
        <Info>1ページ50件表示。表示件数が多い場合はtenant_idやアクション種別でフィルタして検索してください。</Info>
      </Section>

      {/* 10. インデックスジョブ */}
      <Section id="indexing" icon={FileSearch} title="インデックスジョブ">
        <p className="text-muted-foreground">
          テナントがURLやPDFを登録するとインデックスジョブがキューに積まれます。ジョブの状態監視と障害調査に使用します。
        </p>
        <Dl items={[
          { term: "queued",    desc: "実行待ち。通常は数秒〜数十秒でrunningになる。" },
          { term: "running",   desc: "現在処理中。" },
          { term: "completed", desc: "正常完了。" },
          { term: "failed",    desc: "エラーで失敗。error_message列に詳細が記録されている。" },
        ]} />
        <div className="grid gap-1.5">
          <p className="font-medium">異常の判断基準</p>
          <Dl items={[
            { term: "failed > 0",    desc: "エラーが発生している。error_messageを確認してOpenAI/Supabase側の障害を疑う。" },
            { term: "queued > 10",   desc: "ジョブが滞留している可能性。インデクサーワーカーが停止していないか確認。" },
            { term: "running が長時間", desc: "タイムアウトや無限ループの可能性。テナントのソース設定を確認。" },
          ]} />
        </div>
        <Info>一覧は直近100件・集計は過去7日間です。古い履歴はSupabase Dashboardのindexing_jobsテーブルを直接参照してください。</Info>
      </Section>
    </div>
  )
}
