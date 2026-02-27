import { getAppUrl } from "@/lib/env"

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
