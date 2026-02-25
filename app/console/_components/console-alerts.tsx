type Props = {
  notice?: string
  error?: string
  issuedApiKey?: string
  widgetToken?: string
}

export function ConsoleAlerts({ notice, error, issuedApiKey, widgetToken }: Props) {
  if (!notice && !error && !issuedApiKey && !widgetToken) return null

  return (
    <div className="space-y-3 text-sm">
      {notice && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-100 px-3 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {issuedApiKey && (
        <p className="rounded-md bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          発行済みAPIキー（この1回のみ表示）: <code>{issuedApiKey}</code>
        </p>
      )}
      {widgetToken && (
        <p className="rounded-md bg-cyan-100 px-3 py-2 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
          発行済みWidgetトークン（この1回のみ表示）: <code>{widgetToken}</code>
        </p>
      )}
    </div>
  )
}
