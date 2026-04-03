import { getAppUrl } from "@/lib/env"

type MemberInviteMailInput = {
  toEmail: string
  inviteUrl: string
  token: string
  tenantName: string
  invitedByEmail: string
  expiresAt: string // ISO string
}

export async function sendMemberInviteEmail(input: MemberInviteMailInput) {
  const apiKey = getRequiredEnv("RESEND_API_KEY")
  const from = getRequiredEnv("RESEND_FROM_EMAIL")

  const baseUrl = getAppUrl().replace(/\/$/, "")
  const logoUrl = `${baseUrl}/images/knotic-title-whitetext.png`

  const safeEmail = escapeHtml(input.toEmail)
  const safeTenant = escapeHtml(input.tenantName)
  const safeInviter = escapeHtml(input.invitedByEmail)
  const safeUrl = escapeHtml(input.inviteUrl)
  const safeToken = escapeHtml(input.token)
  const expiryDate = new Date(input.expiresAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const subject = `【knotic】${safeTenant} からチームへの招待`

  const html = `
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .outer { padding: 14px 8px !important; }
        .shell { border-radius: 12px !important; }
        .hero { padding: 20px 16px !important; }
        .section { padding: 16px !important; }
        .btn { font-size: 15px !important; padding: 14px 24px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f3f6fb;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="outer" style="background:#f3f6fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="shell" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

            <tr>
              <td class="hero" style="padding:28px 32px;background:linear-gradient(120deg,#0f172a 0%,#1e293b 65%,#334155 100%);">
                <img src="${logoUrl}" alt="knotic" width="180" style="display:block;max-width:180px;width:100%;height:auto;margin:0 0 14px;" />
                <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.4;font-weight:700;">${safeTenant} へのチーム招待</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">${safeInviter} さんからの招待です</p>
              </td>
            </tr>

            <tr>
              <td class="section" style="padding:28px 32px 8px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#334155;">
                  ${safeEmail} 宛に knotic チームへの招待が届いています。<br />
                  下のボタンから招待を承諾してチームに参加できます。
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-radius:9999px;background:#0891b2;">
                      <a href="${safeUrl}" class="btn" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:9999px;background:#0891b2;">
                        招待を承諾する
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="section" style="padding:20px 32px;">
                <div style="border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;padding:14px 16px;">
                  <p style="margin:0 0 6px;font-size:12px;color:#64748b;font-weight:600;">招待リンク（ボタンが機能しない場合）</p>
                  <p style="margin:0;font-size:11px;color:#0891b2;word-break:break-all;">${safeUrl}</p>
                </div>
              </td>
            </tr>

            <tr>
              <td class="section" style="padding:0 32px 16px;">
                <details style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                  <summary style="cursor:pointer;padding:12px 16px;background:#f8fafc;font-size:13px;color:#0891b2;font-weight:600;list-style:none;user-select:none;-webkit-user-select:none;">
                    🔑 トークンを表示（LINEなどで直接共有する場合）
                  </summary>
                  <div style="padding:12px 16px;background:#ffffff;">
                    <p style="margin:0 0 8px;font-size:12px;color:#64748b;">コンソール画面の「招待リンクで参加」欄にこのトークンを貼り付けると参加できます。</p>
                    <div style="background:#f1f5f9;border-radius:6px;padding:10px 12px;border:1px solid #e2e8f0;">
                      <code style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#0f172a;word-break:break-all;display:block;">${safeToken}</code>
                    </div>
                    <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">テキストを長押し・選択してコピーしてください</p>
                  </div>
                </details>
              </td>
            </tr>

            <tr>
              <td class="section" style="padding:0 32px 28px;">
                <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
                  <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">⏰ この招待の有効期限は <strong style="color:#64748b;">${expiryDate}</strong> です</p>
                  <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">📧 このメールに心当たりがない場合は、そのまま無視してください</p>
                  <p style="margin:0;font-size:12px;color:#94a3b8;">🔒 招待を承諾するには、<strong style="color:#64748b;">${safeEmail}</strong> でログインが必要です</p>
                </div>
              </td>
            </tr>

          </table>
          <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;">© knotic — このメールは自動送信されています</p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `

  const text = [
    `${input.tenantName} へのチーム招待`,
    `${input.invitedByEmail} さんからの招待です`,
    "",
    `${input.toEmail} 宛に knotic チームへの招待が届いています。`,
    "以下のURLから招待を承諾してチームに参加できます。",
    "",
    input.inviteUrl,
    "",
    `有効期限: ${expiryDate}`,
    `このメールに心当たりがない場合は無視してください。`,
  ].join("\n")

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.toEmail],
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const payload = await res.text().catch(() => "")
    throw new Error(`Resend send failed: ${res.status} ${payload}`)
  }
}

type ContactMailInput = {
  fromName: string
  fromEmail: string
  company?: string
  message: string
  ip: string
  userAgent: string
  pageUrl?: string
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export async function sendContactMail(input: ContactMailInput) {
  const apiKey = getRequiredEnv("RESEND_API_KEY")
  const from = getRequiredEnv("RESEND_FROM_EMAIL")
  const to = getRequiredEnv("RESEND_CONTACT_TO_EMAIL")

  const subject = `【knotic問い合わせ】${input.fromName}${input.company ? ` / ${input.company}` : ""}`
  const baseUrl = getAppUrl().replace(/\/$/, "")
  const logoUrl = `${baseUrl}/images/knotic-title-whitetext.png`

  const safeName = escapeHtml(input.fromName)
  const safeEmail = escapeHtml(input.fromEmail)
  const safeCompany = escapeHtml(input.company || "-")
  const safeMessage = escapeHtml(input.message)
  const safeIp = escapeHtml(input.ip)
  const safeUa = escapeHtml(input.userAgent)
  const safePageUrl = escapeHtml(input.pageUrl || "-")

  const html = `
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .outer { padding: 14px 8px !important; }
        .shell { border-radius: 12px !important; }
        .hero { padding: 16px 16px !important; }
        .section { padding: 16px !important; }
        .message-wrap { padding: 12px !important; }
        .title { font-size: 18px !important; line-height: 1.45 !important; }
        .meta { font-size: 11px !important; line-height: 1.5 !important; }
        .logo { max-width: 180px !important; margin-bottom: 10px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f3f6fb;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Kaku Gothic ProN','Yu Gothic',Meiryo,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="outer" style="background:#f3f6fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="shell" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td class="hero" style="padding:24px 28px;background:linear-gradient(120deg,#0f172a 0%,#1e293b 65%,#334155 100%);">
                <p style="margin:0 0 6px;color:#93c5fd;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Knotic Contact</p>
                <img src="${logoUrl}" alt="knotic" width="220" class="logo" style="display:block;max-width:220px;width:100%;height:auto;margin:0 0 12px;" />
                <h1 class="title" style="margin:0;color:#ffffff;font-size:22px;line-height:1.4;font-weight:700;">新しいお問い合わせを受信しました</h1>
              </td>
            </tr>

            <tr>
              <td class="section" style="padding:24px 28px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:0 0 10px;font-size:13px;color:#475569;">お名前</td>
                    <td style="padding:0 0 10px;font-size:14px;color:#0f172a;font-weight:600;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 10px;font-size:13px;color:#475569;">メールアドレス</td>
                    <td style="padding:0 0 10px;font-size:14px;color:#0f172a;"><a href="mailto:${safeEmail}" style="color:#0f766e;text-decoration:none;">${safeEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 10px;font-size:13px;color:#475569;">会社名</td>
                    <td style="padding:0 0 10px;font-size:14px;color:#0f172a;">${safeCompany}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="section" style="padding:0 28px 20px;">
                <div class="message-wrap" style="border:1px solid #dbe3ee;border-radius:12px;background:#f8fafc;padding:16px;">
                  <p style="margin:0 0 10px;font-size:13px;color:#475569;font-weight:600;">お問い合わせ内容</p>
                  <div style="white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.75;color:#0f172a;">${safeMessage}</div>
                </div>
              </td>
            </tr>

            <tr>
              <td class="section" style="padding:0 28px 24px;">
                <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
                  <p class="meta" style="margin:0 0 6px;font-size:12px;color:#64748b;">送信元IP: ${safeIp}</p>
                  <p class="meta" style="margin:0 0 6px;font-size:12px;color:#64748b;word-break:break-all;">User-Agent: ${safeUa}</p>
                  <p class="meta" style="margin:0;font-size:12px;color:#64748b;word-break:break-all;">ページURL: ${safePageUrl}</p>
                </div>
              </td>
            </tr>
          </table>

          <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;">This email was sent from knotic contact form.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `

  const text = [
    "knotic お問い合わせ",
    `お名前: ${input.fromName}`,
    `メール: ${input.fromEmail}`,
    `会社名: ${input.company || "-"}`,
    "",
    input.message,
    "",
    `送信元IP: ${input.ip}`,
    `User-Agent: ${input.userAgent}`,
    `ページ: ${input.pageUrl || "-"}`,
  ].join("\n")

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.fromEmail,
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const payload = await res.text().catch(() => "")
    throw new Error(`Resend send failed: ${res.status} ${payload}`)
  }
}
