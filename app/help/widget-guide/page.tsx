import Link from "next/link"
import { ArrowLeft, BookOpen, CheckCircle2, ExternalLink, Info, AlertTriangle, Settings2 } from "lucide-react"

import { PageFrame } from "@/components/marketing/page-frame"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { TableOfContents } from "./toc"

export const metadata = buildMarketingMetadata({
  title: "サービス別 Widget 設置ガイド",
  description:
    "WordPress・Wix・STUDIO・Squarespace・Webflow・Jimdo・Shopify・BASEなど、各サービスへのknoticチャットウィジェット設置手順を詳しく解説します。",
  path: "/help/widget-guide",
  keywords: [
    "Widget 設置",
    "WordPress チャットウィジェット",
    "Wix 埋め込み",
    "STUDIO カスタムコード",
    "Squarespace スクリプト",
    "Webflow カスタムコード",
    "Shopify ウィジェット",
    "BASE HTMLタグ",
    "ノーコード チャットボット",
  ],
})

export default function WidgetGuideDocsPage() {
  return (
    <PageFrame
      eyebrow="Help Center"
      title="サービス別 Widget 設置ガイド"
      description="WordPress・Wix・STUDIO など、よく使われる Web サービスへの Widget 設置手順をサービスごとに解説します。"
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

      {/* 2カラムレイアウト（PC: 目次 + コンテンツ） */}
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">

        {/* 目次（PCのみ sticky） */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
            <TableOfContents />
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="min-w-0">

          {/* 始める前に */}
          <section id="prerequisites" className="mb-10 scroll-mt-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center gap-2">
              <Info className="size-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold">始める前に：Widgetコードの取得</h2>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              各サービスへの設置前に、まず knotic コンソールから Widget の script タグを取得してください。
            </p>
            <ol className="space-y-2 text-sm">
              {[
                <>Console の <strong>Bot管理</strong> を開き、設置したいBotの「Bot設定を開く」をクリック</>,
                <><strong>Widget タブ</strong>を開き「Widgetを有効にする」をオンにして設定を保存</>,
                <><strong>Widgetトークン管理</strong>セクションで「トークン再発行」を実行（初回のみ）</>,
                <>発行された script タグ（<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">{"<script src=\"...\" data-bot-id=\"bot_xxxx\" data-widget-token=\"wt_xxxx\"></script>"}</code>）をコピー。ボタン位置や表示モードは<strong>コンソールの設定から変更できるため、scriptタグには不要</strong>です</>,
                <>トークンは発行時の1回のみ表示されます。必ず安全な場所に控えてください</>,
                <><strong>許可オリジン</strong>に設置先サイトのURL（例: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">https://example.com</code>）を登録してから保存</>,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                    {i + 1}
                  </span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              位置・モードなどの詳細設定はコンソールのWidget設定から変更できます。scriptタグへの上書きオプションは{" "}
              <a href="#section-script-options" className="text-cyan-700 underline underline-offset-2 dark:text-cyan-400">
                こちら
              </a>
              {" "}を参照してください。
            </p>
          </section>

          {/* 1. WordPress WPCode */}
          <section id="section-wordpress-wpcode" className="mb-10 scroll-mt-28">
            <SectionHeading number={1} title="WordPress（WPCode プラグイン使用・推奨）" />
            <p className="mb-4 text-sm text-muted-foreground">
              サイト全体への設置には「WPCode」プラグインを使う方法が最もシンプルで確実です。テーマファイルの直接編集より安全で、テーマ更新の影響を受けません。
            </p>
            <PlanNote text="WordPress.com での利用は Business プラン以上が必要（無料・Personal プランはカスタムコード非対応）" />
            <Steps items={[
              <>【プラグインのインストール】WordPress 管理画面左メニュー「プラグイン」→「新規プラグインを追加」→「WPCode」で検索 → 「今すぐインストール」→「有効化」</>,
              <>【コードの設置】左メニューに追加された「<strong>Code Snippets</strong>」→「<strong>Header &amp; Footer</strong>」を開く</>,
              <>「<strong>Footer</strong>」欄（ページ下部・<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">&lt;/body&gt;</code> 直前に挿入）に script タグを貼り付けて「<strong>Save Changes</strong>」</>,
              <>全ページに自動適用されます。特定ページのみに設置したい場合は「Code Snippets」→「Add Snippet」から新規スニペットを作成し、「<strong>Smart Conditional Logic</strong>」で対象ページを絞り込む</>,
              <>【確認】設置後、対象ページを開いてWidgetボタンが右下（または設定した位置）に表示されているか確認</>,
            ]} />
          </section>

          {/* 2. WordPress ブロックエディタ */}
          <section id="section-wordpress-block" className="mb-10 scroll-mt-28">
            <SectionHeading number={2} title="WordPress（ブロックエディタのカスタムHTMLブロック）" />
            <p className="mb-4 text-sm text-muted-foreground">
              特定のページや投稿だけに Widget を表示したい場合は、ブロックエディタのカスタムHTMLブロックを使う方法もあります。ページ本文内への挿入のみ対応です。
            </p>
            <Steps items={[
              <>対象ページまたは投稿の編集画面を開く</>,
              <>ブロック追加ボタン（<strong>＋</strong>）をクリック →「<strong>カスタムHTML</strong>」ブロックを検索して選択</>,
              <>表示されたテキストエリアに script タグを貼り付け</>,
              <>プレビューで表示を確認し、「公開」または「更新」を保存</>,
            ]} />
            <NoteBox text={<><code className="font-mono text-xs">&lt;head&gt;</code> セクションへの挿入はこの方法ではできません。サイト全体への設置はWPCodeプラグインを使用してください</>} />
          </section>

          {/* 3. Wix */}
          <section id="section-wix" className="mb-10 scroll-mt-28">
            <SectionHeading number={3} title="Wix（カスタムコード設定）" />
            <p className="mb-4 text-sm text-muted-foreground">
              Wix はサイトダッシュボードの「カスタムコード」から script タグを全ページまたは特定ページに設置できます。エディタからではなく、ダッシュボードの Settings 画面から操作します。
            </p>
            <Steps items={[
              <>Wix サイトダッシュボード（管理画面）にログイン（wix.com からサイトを選択）</>,
              <>左メニューの「<strong>Settings（設定）</strong>」→「<strong>Custom Code（カスタムコード）</strong>」を開く（「Development &amp; integrations」セクション内）</>,
              <>「<strong>+ Add Custom Code（カスタムコードを追加）</strong>」をクリック</>,
              <>script タグを貼り付け、わかりやすい名前（例: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">knotic-widget</code>）を入力</>,
              <>「<strong>Place Code in</strong>」を「<strong>Body – end（<code className="font-mono text-xs">&lt;/body&gt;</code> 直前）</strong>」に設定</>,
              <>「<strong>Add Code to Pages</strong>」で「All Pages（すべてのページ）」または特定ページを選択</>,
              <>「<strong>Apply（適用）</strong>」→ 画面上部の「<strong>Publish（公開）</strong>」をクリックして変更を反映</>,
            ]} />
            <NoteBox text="Google Analytics・Facebook ピクセルなどは専用の「Marketing Integrations（マーケティング統合）」機能から設定してください" />
          </section>

          {/* 4. STUDIO */}
          <section id="section-studio" className="mb-10 scroll-mt-28">
            <SectionHeading number={4} title="STUDIO（カスタムコード設定）" />
            <p className="mb-4 text-sm text-muted-foreground">
              STUDIO は有料プランでサイト全体または特定ページへのカスタムコード挿入に対応しています。デザインエディタのキャンバス外（余白部分）をクリックして設定パネルを開きます。
            </p>
            <PlanNote text="カスタムコード機能は有料プラン（STARTERプラン以上）のみ利用可能。無料プランは非対応" />
            <Steps items={[
              <>STUDIO デザインエディタを開き、キャンバスの外側のグレーの余白部分をクリック</>,
              <>右パネルに設定が表示されたら「<strong>Site（サイト）</strong>」タブを選択（全ページに適用する場合）</>,
              <>「<strong>Body終了タグの直前</strong>」のコード入力欄を展開し、script タグを貼り付け</>,
              <>特定ページのみに適用する場合は「<strong>Page（ページ）</strong>」タブを選択して同様の操作</>,
              <>エディタ右上の「<strong>公開</strong>」ボタンをクリックして変更を反映</>,
            ]} />
            <NoteBox text={<>エディタのプレビュー画面では Widget は動作しません。公開後の実際のサイト URL で動作確認してください。1フィールドあたり最大3,000文字。<code className="font-mono text-xs">&lt;script&gt;</code> / <code className="font-mono text-xs">&lt;link&gt;</code> / <code className="font-mono text-xs">&lt;meta&gt;</code> / <code className="font-mono text-xs">&lt;style&gt;</code> タグのみ対応</>} />
          </section>

          {/* 5. Squarespace */}
          <section id="section-squarespace" className="mb-10 scroll-mt-28">
            <SectionHeading number={5} title="Squarespace（コードの挿入）" />
            <p className="mb-4 text-sm text-muted-foreground">
              Squarespace はサイト設定の「コードの挿入（Code Injection）」からサイト全体に script タグを設置できます。
            </p>
            <PlanNote text="Personal プランはコードの挿入非対応。Core・Advanced・Business・Commerce 以上が必要" />
            <Steps items={[
              <>Squarespace 管理パネル左メニューの「<strong>設定（Settings）</strong>」→「<strong>詳細設定（Advanced）</strong>」→「<strong>コードの挿入（Code Injection）</strong>」を開く</>,
              <>「<strong>フッター（Footer）</strong>」欄に script タグを貼り付け（<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">&lt;/body&gt;</code> 直前に挿入され全ページに適用）</>,
              <>「<strong>保存（Save）</strong>」をクリック</>,
            ]} />
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>特定ページのみ設置したい場合：</strong>
              ページ編集画面の歯車アイコン（ページ設定）→「<strong>詳細設定（Advanced）</strong>」タブ → フッターコード欄に貼り付けて保存。
              またはページ編集中にブロック追加 →「<strong>コード（Code）</strong>」ブロックを挿入する方法もあります。
            </p>
          </section>

          {/* 6. Webflow */}
          <section id="section-webflow" className="mb-10 scroll-mt-28">
            <SectionHeading number={6} title="Webflow（Project Settings のカスタムコード）" />
            <p className="mb-4 text-sm text-muted-foreground">
              Webflow はデザイナー画面の「Project Settings（プロジェクト設定）」からサイト全体にコードを設置します。
            </p>
            <PlanNote text="カスタムコード機能はWebflowの有料サイトプラン（Basic以上）のみ対応" />
            <Steps items={[
              <>Webflow デザイナーを開き、画面上部左側の「<strong>Project Settings（プロジェクト設定）</strong>」アイコン（歯車）をクリック</>,
              <>「<strong>Custom Code（カスタムコード）</strong>」タブを開く</>,
              <>「<strong>Footer Code（フッターコード）</strong>」欄に script タグを貼り付けて「<strong>Save Changes（変更を保存）</strong>」</>,
              <>デザイナーに戻り、右上の「<strong>Publish（公開）</strong>」ボタンから公開して変更を反映</>,
            ]} />
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>特定ページのみ設置：</strong>
              左パネルの「<strong>Pages（ページ）</strong>」メニューで対象ページにカーソルを合わせ設定アイコン →「<strong>Custom Code</strong>」タブ →「<strong>Before &lt;/body&gt; tag</strong>」欄に貼り付け。
            </p>
            <NoteBox text={<><code className="font-mono text-xs">&lt;html&gt;</code> / <code className="font-mono text-xs">&lt;head&gt;</code> / <code className="font-mono text-xs">&lt;body&gt;</code> タグ自体は記述しないこと（レイアウト崩れの原因になります）</>} />
          </section>

          {/* 7. Jimdo */}
          <section id="section-jimdo" className="mb-10 scroll-mt-28">
            <SectionHeading number={7} title="Jimdo（Widget/HTML 要素）" />
            <p className="mb-4 text-sm text-muted-foreground">
              Jimdo の Creator バージョンでは「Widget/HTML」要素から script タグを設置できます。
            </p>
            <PlanNote text="対応しているのは旧バージョンの「Jimdo Creator」のみ。新しい「Jimdo Website Builder（Dolphin）」は任意のHTML/script設置に非対応" />
            <Steps items={[
              <>Jimdo Creator の編集モードで設置したいページを開き、「<strong>Edit（編集）</strong>」ボタンをクリック</>,
              <>挿入したいコンテンツエリアにカーソルを当てて「<strong>コンテンツを追加</strong>」→「<strong>その他の要素</strong>」→「<strong>Widget / HTML</strong>」を選択</>,
              <>表示されたコード入力欄に script タグを貼り付けて「<strong>保存</strong>」</>,
              <>サイト全体に表示する場合: Jimdo Creator 設定メニュー →「<strong>ヘッダーを編集（Edit Head）</strong>」にコードを追加するか、全ページ共通のヘッダー・フッターエリアにWidget/HTML要素を追加</>,
            ]} />
            <NoteBox text="Jimdo Creator は日本市場での新規提供を終了している場合があります。ご利用中のバージョンをご確認ください" />
          </section>

          {/* 8. Shopify */}
          <section id="section-shopify" className="mb-10 scroll-mt-28">
            <SectionHeading number={8} title="Shopify（テーマコード編集）" />
            <p className="mb-4 text-sm text-muted-foreground">
              Shopify はテーマファイル「theme.liquid」を直接編集して script タグを設置します。Shopify 管理画面の「オンラインストア」から操作します。
            </p>
            <Steps items={[
              <>Shopify 管理画面の左メニュー「<strong>オンラインストア（Online Store）</strong>」→「<strong>テーマ（Themes）</strong>」を開く</>,
              <>現在使用中のテーマの「<strong>・・・（その他）</strong>」→「<strong>コードを編集（Edit code）</strong>」をクリック</>,
              <>左パネルの「<strong>layout</strong>」フォルダ内の「<strong>theme.liquid</strong>」をクリックして開く</>,
              <>Ctrl+F（Mac は Command+F）で「<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">&lt;/body&gt;</code>」を検索して該当箇所を探す</>,
              <><code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">&lt;/body&gt;</code> タグの直前の行に script タグを貼り付けて「<strong>保存（Save）</strong>」</>,
              <>Shopify ストアのページを開いて Widget が表示されていることを確認</>,
            ]} />
            <NoteBox text={<>theme.liquid の直接編集はテーマ更新時にコードが上書きされるリスクがあります。更新前にバックアップを取ってください。チェックアウトページへの設置には Shopify Plus 契約が必要です</>} />
          </section>

          {/* 9. BASE */}
          <section id="section-base" className="mb-10 scroll-mt-28">
            <SectionHeading number={9} title="BASE（HTMLタグ管理App）" />
            <p className="mb-4 text-sm text-muted-foreground">
              BASE では HTMLタグ管理App をインストールすることで、サイト全体の <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">&lt;head&gt;</code> に script タグを追加できます。無料で利用できます。
            </p>
            <Steps items={[
              <>BASE 管理画面の「<strong>Apps（アプリ）</strong>」→ 検索欄で「<strong>HTMLタグ管理</strong>」を検索 → インストール</>,
              <>インストール後、「Apps」→「<strong>HTMLタグ管理</strong>」を開く</>,
              <>「タグの種類」は「<strong>カスタムタグ（その他）</strong>」を選択</>,
              <>コード入力欄に script タグを貼り付けて保存</>,
              <>設定したタグは全ページの <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">&lt;head&gt;</code> に自動挿入されます</>,
            ]} />
            <NoteBox text={<>HTMLタグ管理App は <code className="font-mono text-xs">&lt;head&gt;</code> 内への挿入のみ対応（<code className="font-mono text-xs">&lt;body&gt;</code> 末尾への挿入は不可）。ページを絞り込む機能はなく、全ページ一括適用のみです。カスタムタグが反映されない場合は、App 設定から一度削除して再登録してください</>} />
          </section>

          {/* 10. 非対応サービス */}
          <section id="section-unsupported" className="mb-10 scroll-mt-28 rounded-xl border border-rose-200/60 bg-rose-50/60 p-5 dark:border-rose-500/30 dark:bg-rose-950/20">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                10. 設置が難しい・非対応のサービス（STORES・Google Sites）
              </h2>
            </div>
            <p className="mb-3 text-sm text-rose-800/90 dark:text-rose-300">
              以下のサービスは任意の script タグを自由に埋め込む機能を持っていないため、knotic の Widget を設置することができません。
            </p>
            <ul className="space-y-2 text-sm text-rose-800/90 dark:text-rose-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-bold">•</span>
                <span>
                  <strong>STORES（stores.jp）</strong>：任意の外部 script タグを埋め込む機能がありません。広告タグ機能は Google 広告・Facebook Pixel のみ対応で、任意の Widget コードには非対応です
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-bold">•</span>
                <span>
                  <strong>Google サイト（Google Sites）</strong>：「埋め込み → コードの埋め込み」から HTML を挿入できますが、セキュリティ上の理由から script タグはサンドボックス化された iframe 内で無効化されます。外部ウィジェットは動作しません
                </span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-rose-800/90 dark:text-rose-300">
              これらのサービスをお使いで Widget を設置したい場合は、WordPress・Wix・STUDIO・Squarespace・Webflow などへの移行をご検討ください。または、knotic の「<strong>Hosted URL（公開チャットURL）</strong>」機能を使って独立したチャットページを公開し、そのリンクをサイトに設置する方法もあります（Standardプラン以上）。
            </p>
          </section>

          {/* スクリプトの上書きオプション */}
          <section id="section-script-options" className="mb-10 scroll-mt-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center gap-2">
              <Settings2 className="size-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold">scriptタグの上書きオプション（任意・通常は不要）</h2>
            </div>
            <div className="mb-4 rounded-lg border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-950/20">
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                <strong>ボタン位置・表示モードはコンソールから変更できます。</strong>
                {" "}scriptタグを修正・再設置する必要はなく、コンソール画面で保存するだけで即時反映されます。
              </p>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              scriptタグには以下の任意属性を追加することで、コンソール設定を上書きすることができます。
              複数サイトへの同一Botの設置でサイトごとに見た目を変えたい場合などに使用します。
            </p>
            <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">属性</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">値</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">説明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200">data-position</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">right-bottom</code>{" / "}
                      <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">right-top</code>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">ボタン表示位置の上書き</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200">data-mode</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">overlay</code>{" / "}
                      <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">redirect</code>{" / "}
                      <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">both</code>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">チャット起動モードの上書き</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-800/40">
              <p className="text-xs text-muted-foreground">
                これらの属性は省略が基本です。省略した場合はコンソールの設定値が自動的に読み込まれます。
                必要な場合のみ、通常の埋め込みscriptタグに追記してください。
              </p>
            </div>
          </section>

          {/* 設置後の確認 */}
          <section id="section-checklist" className="mb-10 scroll-mt-28 rounded-xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold">設置後の動作確認チェックリスト</h2>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              script タグを設置したら、以下の項目を順番に確認してください。
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "対象サイトをブラウザで開き、画面の右下（または設定した位置）にWidgetボタンが表示されているか",
                "Widgetボタンをクリックしてチャット画面が開くか",
                "実際に質問を入力して回答が返ってくるか",
                "回答内に引用リンクが表示されているか（引用表示をオンにしている場合）",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>表示されない場合：</strong>
                Console の Bot 管理 → Widgetトークン管理で、許可オリジンに設置先の URL（<code className="font-mono">https://</code> から始まるドメイン）が正しく登録されているか確認してください。それでも解決しない場合はブラウザの開発者ツール（F12）→「Console」タブでエラーを確認し、サポートへお問い合わせください。
              </p>
            </div>
          </section>

          {/* フッター */}
          <div className="mt-12 flex flex-col gap-3 rounded-xl border border-black/10 bg-white/80 px-5 py-4 dark:border-white/10 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-4 shrink-0" />
              <span>不明な点はコンソールからお問い合わせください。</span>
            </div>
            <Link
              href="/console/bots"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              コンソールへ
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

function NoteBox({ text }: { text: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200/60 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-800/40">
      <p className="text-xs text-muted-foreground">
        <strong>注意：</strong>{text}
      </p>
    </div>
  )
}

function PlanNote({ text }: { text: string }) {
  return (
    <div className="mb-4 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/20">
      <p className="text-xs text-amber-800 dark:text-amber-300">
        <strong>プラン制限：</strong>{text}
      </p>
    </div>
  )
}
