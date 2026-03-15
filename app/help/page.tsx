import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpenText, Clock3, LifeBuoy, Search } from "lucide-react"

import { helpDocCategories, type HelpDocArticle, type HelpDocCategory } from "@/content/help-docs"
import { CTASection, PageFrame } from "@/components/marketing/page-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildMarketingMetadata } from "@/lib/seo/metadata"
import { FaqCsvExampleModal } from "@/app/help/_components/faq-csv-example-modal"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type HelpDocCategoryView = HelpDocCategory & {
  articles: HelpDocArticle[]
}

export const metadata: Metadata = buildMarketingMetadata({
  title: "利用者ドキュメント",
  description:
    "knoticの導入から公開、運用、トラブル対応までをまとめた利用者向けヘルプセンターです。URL/ファイル登録、Widget埋め込み、API利用の手順を確認できます。",
  path: "/help",
  keywords: ["knotic ドキュメント", "ヘルプセンター", "利用ガイド", "Widget埋め込み", "API利用手順"],
})

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

function articleMatchesQuery(article: HelpDocArticle, query: string) {
  if (!query) return true
  const targetText = [
    article.title,
    article.summary,
    article.tags.join(" "),
    article.sections.map((section) => section.heading).join(" "),
    article.sections.map((section) => section.body).join(" "),
    article.sections.flatMap((section) => section.bullets ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase()

  return targetText.includes(query)
}

function filterCategories(query: string): HelpDocCategoryView[] {
  if (!query) return helpDocCategories

  return helpDocCategories
    .map((category) => ({
      ...category,
      articles: category.articles.filter((article) => articleMatchesQuery(article, query)),
    }))
    .filter((category) => category.articles.length > 0)
}

function articleAnchor(categoryId: string, articleId: string) {
  return `${categoryId}-${articleId}`
}

export default async function HelpPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const rawQuery = firstParam(params.q)?.trim() ?? ""
  const query = rawQuery.toLowerCase()
  const categories = filterCategories(query)
  const articleCount = categories.reduce((sum, category) => sum + category.articles.length, 0)
  const noResults = rawQuery.length > 0 && articleCount === 0

  return (
    <PageFrame
      eyebrow="Help Center"
      title="利用者ドキュメント"
      description="導入準備から公開運用まで、実務ですぐ使える手順をまとめています。まずは検索またはカテゴリから必要なガイドを選んでください。"
    >
      <section className="-mx-4 rounded-none border-0 bg-transparent px-4 py-3 sm:mx-0 sm:rounded-3xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-6 dark:sm:border-white/10 dark:sm:bg-slate-900/75">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <form action="/help" method="get" className="space-y-3">
            <label htmlFor="help-search" className="inline-flex items-center gap-2 text-sm font-medium">
              <Search className="size-4 text-cyan-700 dark:text-cyan-300" />
              ドキュメントを検索
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="help-search"
                name="q"
                defaultValue={rawQuery}
                placeholder="例: Widget 埋め込み / APIキー / インデックス失敗"
              />
              <div className="flex gap-2">
                <Button type="submit" className="rounded-full">
                  検索
                </Button>
                {rawQuery ? (
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/help">クリア</Link>
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              タイトル・要約・タグ・本文を対象に検索します。
            </p>
          </form>
          <div className="rounded-none border-0 bg-zinc-950 px-4 py-3 text-white sm:rounded-2xl sm:border sm:border-black/15 dark:sm:border-white/10">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-300">Docs</p>
            <p className="mt-1 text-3xl font-semibold">{articleCount}</p>
            <p className="text-xs text-zinc-300">表示中の記事数</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              data-no-route-loader="true"
              className="rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-cyan-500/60 hover:text-cyan-800 dark:border-white/15 dark:bg-slate-950 dark:text-zinc-200 dark:hover:border-cyan-300/60 dark:hover:text-cyan-200"
            >
              {category.title}
            </a>
          ))}
        </div>
      </section>

      <section className="-mx-4 mt-5 grid min-w-0 gap-4 px-4 sm:mx-0 sm:mt-6 sm:gap-5 sm:px-0 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 overflow-hidden rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-4 dark:sm:border-white/10 dark:sm:bg-slate-900/70 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            目次
          </p>
          <div className="mt-3 space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="space-y-1.5">
                <a
                  href={`#${category.id}`}
                  data-no-route-loader="true"
                  className="block wrap-break-word text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {category.title}
                </a>
                <div className="space-y-1 pl-1">
                  {category.articles.map((article) => (
                    <a
                      key={article.id}
                      href={`#${articleAnchor(category.id, article.id)}`}
                      data-no-route-loader="true"
                      className="block wrap-break-word text-xs text-zinc-600 hover:underline dark:text-zinc-300"
                    >
                      {article.title}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4 sm:space-y-5 lg:max-w-4xl">
          {noResults ? (
            <section className="rounded-none border-0 bg-transparent px-0 py-1 sm:rounded-3xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-6 dark:sm:border-white/10 dark:sm:bg-slate-900/75">
              <p className="text-lg font-semibold">検索結果が見つかりませんでした</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                キーワードを短くするか、別の言い回しで再検索してください。
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/help">全てのドキュメントを見る</Link>
                </Button>
              </div>
            </section>
          ) : (
            categories.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className="min-w-0 overflow-hidden rounded-none border-0 bg-transparent p-0 sm:rounded-3xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-6 dark:sm:border-white/10 dark:sm:bg-slate-900/75"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="wrap-break-word text-xl font-semibold tracking-tight sm:text-2xl">{category.title}</h2>
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                    {category.articles.length} 記事
                  </Badge>
                </div>
                <p className="mt-2 wrap-break-word text-[13px] text-zinc-600 dark:text-zinc-300 sm:text-sm">
                  {category.description}
                </p>

                <div className="mt-4 space-y-4">
                  {category.articles.map((article) => (
                    <article
                      key={article.id}
                      id={articleAnchor(category.id, article.id)}
                      className="min-w-0 overflow-hidden rounded-none border-0 bg-transparent p-0 pb-4 sm:rounded-2xl sm:border sm:border-black/15 sm:bg-white/95 sm:p-4 dark:sm:border-white/10 dark:sm:bg-slate-950/80"
                    >
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="wrap-break-word text-base font-semibold tracking-tight sm:text-lg">
                              {article.title}
                            </h3>
                            {article.id === "faq-spreadsheet-guide" && <FaqCsvExampleModal />}
                          </div>
                          <p className="mt-1 wrap-break-word text-[13px] text-zinc-600 dark:text-zinc-300 sm:text-sm">
                            {article.summary}
                          </p>
                        </div>
                        <div className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-black/15 px-2.5 py-1 text-[11px] text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                          <Clock3 className="size-3.5" />
                          約{article.readMinutes}分
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {article.sections.map((section) => (
                          <section
                            key={section.heading}
                            className="min-w-0 overflow-hidden rounded-none border-0 bg-transparent px-0 py-2 dark:bg-transparent sm:rounded-xl sm:border sm:border-black/10 sm:bg-zinc-50 sm:p-3 dark:sm:border-white/10 dark:sm:bg-slate-900/70"
                          >
                            <h4 className="wrap-break-word text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {section.heading}
                            </h4>
                            <p className="mt-1 wrap-break-word text-[13px] leading-6 text-zinc-600 dark:text-zinc-300 sm:text-sm">
                              {section.body}
                            </p>
                            {section.bullets?.length ? (
                              <ul className="mt-2 min-w-0 space-y-1.5 text-zinc-700 dark:text-zinc-200">
                                {section.bullets.map((bullet) => (
                                  <li key={bullet} className="flex min-w-0 items-start gap-2">
                                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-600 dark:bg-cyan-300" />
                                    <span className="min-w-0 break-words text-[13px] leading-6 [overflow-wrap:anywhere] sm:text-sm">
                                      {bullet}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </section>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="max-w-full break-all rounded-full text-[11px]">
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          更新日: {article.updatedAt}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>

      <section className="-mx-4 mt-5 grid gap-3 px-4 sm:mx-0 sm:mt-6 sm:gap-4 sm:px-0 sm:grid-cols-2">
        <div className="rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-5 dark:sm:border-white/10 dark:sm:bg-slate-900/70">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
            <BookOpenText className="size-4" />
            関連ページ
          </p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/help/widget" className="inline-flex items-center gap-2 hover:underline">
              Widget 埋め込みガイド（コード例）
              <ArrowRight className="size-3.5" />
            </Link>
            <Link href="/faq" className="inline-flex items-center gap-2 hover:underline">
              FAQを見る
              <ArrowRight className="size-3.5" />
            </Link>
            <Link href="/security" className="inline-flex items-center gap-2 hover:underline">
              セキュリティ情報
              <ArrowRight className="size-3.5" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 hover:underline">
              料金と上限
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-black/20 sm:bg-white/90 sm:p-5 dark:sm:border-white/10 dark:sm:bg-slate-900/70">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
            <LifeBuoy className="size-4" />
            サポート
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            仕様確認や導入相談が必要な場合は、お問い合わせからご連絡ください。再現手順と対象Bot情報があると対応が早くなります。
          </p>
          <div className="mt-4">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/contact">問い合わせる</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-8">
        <CTASection />
      </div>
    </PageFrame>
  )
}
