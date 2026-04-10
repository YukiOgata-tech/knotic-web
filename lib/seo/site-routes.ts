export type PublicRoute = {
  path: string
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly"
  priority: number
}

export const PUBLIC_MARKETING_ROUTES: PublicRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/help", changeFrequency: "weekly", priority: 0.8 },
  { path: "/help/account", changeFrequency: "monthly", priority: 0.7 },
  { path: "/help/plans", changeFrequency: "monthly", priority: 0.7 },
  { path: "/help/widget-guide", changeFrequency: "monthly", priority: 0.7 },
  { path: "/help/widget", changeFrequency: "monthly", priority: 0.7 },
  { path: "/help/billing-plan-change", changeFrequency: "monthly", priority: 0.6 },
  { path: "/features", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/integrations", changeFrequency: "monthly", priority: 0.8 },
  { path: "/use-cases", changeFrequency: "monthly", priority: 0.8 },
  { path: "/demo", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.8 },
  { path: "/security", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  {
    path: "/specified-commercial-transactions",
    changeFrequency: "yearly",
    priority: 0.3,
  },
]
