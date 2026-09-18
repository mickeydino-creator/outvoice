// Shared visual "chrome" for every transactional email sent from an edge
// function (quote approval notifications, automated reminders) — mirrors
// src/lib/emailTemplate.ts so client-side and server-side emails look like
// one consistent product. Kept dependency-free (plain string templating) so
// it can be deployed either via the CLI or pasted directly into the
// Supabase dashboard's function editor.
export interface EmailButton {
  label: string
  url: string
}

export interface EmailInfoRow {
  label: string
  value: string
  emphasis?: boolean
}

export interface EmailShellParams {
  businessName: string
  businessLogoDataUrl?: string
  eyebrow: string
  heading: string
  bodyHtml: string
  infoRows?: EmailInfoRow[]
  primaryButton?: EmailButton
  secondaryButton?: EmailButton
}

export function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function infoRowsHtml(rows: EmailInfoRow[]) {
  return `<table role="presentation" width="100%" style="border-collapse:collapse;">
    ${rows
      .map(
        (row) => `<tr>
          <td style="padding:5px 0;font-size:13px;color:${row.emphasis ? "#0F172A" : "#64748B"};font-weight:${row.emphasis ? "700" : "400"};">${escapeHtml(row.label)}</td>
          <td style="padding:5px 0;font-size:13px;text-align:right;color:${row.emphasis ? "#0F172A" : "#334155"};font-weight:${row.emphasis ? "700" : "400"};">${escapeHtml(row.value)}</td>
        </tr>`
      )
      .join("")}
  </table>`
}

function buttonHtml(button: EmailButton, primary: boolean) {
  const style = primary
    ? "background:#2563EB;color:#FFFFFF;border:1px solid #2563EB;"
    : "background:#FFFFFF;color:#2563EB;border:1px solid #E2E8F0;"
  return `<a href="${button.url}" style="display:inline-block;${style}text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:12px;">${escapeHtml(button.label)}</a>`
}

export function renderEmailShell({
  businessName,
  businessLogoDataUrl,
  eyebrow,
  heading,
  bodyHtml,
  infoRows,
  primaryButton,
  secondaryButton,
}: EmailShellParams) {
  const safeBusiness = escapeHtml(businessName || "Your business")
  const logo = businessLogoDataUrl
    ? `<img src="${businessLogoDataUrl}" width="36" height="36" alt="" style="border-radius:10px;object-fit:cover;display:block;" />`
    : `<div style="width:36px;height:36px;border-radius:10px;background:#2563EB;color:#ffffff;font-weight:700;font-family:Arial,sans-serif;font-size:15px;line-height:36px;text-align:center;">${safeBusiness.charAt(0).toUpperCase() || "?"}</div>`

  const buttonsHtml =
    primaryButton || secondaryButton
      ? `<div style="margin-top:26px;">
          ${primaryButton ? buttonHtml(primaryButton, true) : ""}
          ${secondaryButton ? `<span style="display:inline-block;width:10px;"></span>${buttonHtml(secondaryButton, false)}` : ""}
        </div>`
      : ""

  return `<div style="background:#F1F5F9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;">
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="padding:22px 28px;border-bottom:1px solid #EEF2F7;">
                <table role="presentation" style="border-collapse:collapse;"><tr>
                  <td width="36">${logo}</td>
                  <td style="padding-left:10px;font-size:14px;font-weight:700;color:#0F172A;">${safeBusiness}</td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#2563EB;">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0F172A;font-weight:800;">${escapeHtml(heading)}</h1>
                <div style="font-size:15px;line-height:1.7;color:#334155;">${bodyHtml}</div>
                ${
                  infoRows && infoRows.length > 0
                    ? `<div style="margin-top:20px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;padding:16px 18px;">${infoRowsHtml(infoRows)}</div>`
                    : ""
                }
                ${buttonsHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 8px 0;text-align:center;font-size:12px;color:#94A3B8;">Sent by ${safeBusiness}</td>
      </tr>
    </table>
  </div>`
}
