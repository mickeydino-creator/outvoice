// Shared Resend helper used by every edge function that sends email
// (send-email, public-quote, send-invoice-reminders). Keeps the Resend
// request shape and error handling in one place.

export interface ResendAttachment {
  filename: string
  content: string // base64, no data: prefix
}

export interface SendResendEmailParams {
  to: string
  subject: string
  html: string
  attachments?: ResendAttachment[]
}

export interface SendResendEmailResult {
  ok: boolean
  status: number
  id?: string
  error?: string
}

export async function sendResendEmail(
  apiKey: string,
  fromEmail: string,
  { to, subject, html, attachments }: SendResendEmailParams
): Promise<SendResendEmailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    return { ok: false, status: response.status, error: data.message ?? "Failed to send email" }
  }

  return { ok: true, status: response.status, id: data.id }
}
