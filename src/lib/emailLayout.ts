// Builds the clean, professional email body sent alongside a PDF invoice/quote
// attachment: a short greeting plus a lightweight visual preview card and a
// "View Invoice"/"View Quote" button. The full document is never inlined here
// — it only ever travels as the attached PDF.
interface EmailPreviewParams {
  kind: "invoice" | "quote"
  businessName: string
  businessLogoDataUrl?: string
  clientName: string
  number: string
  total: string
  dueDate: string
  viewUrl: string
  downloadUrl?: string
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function buildDocumentEmail({
  kind,
  businessName,
  businessLogoDataUrl,
  clientName,
  number,
  total,
  dueDate,
  viewUrl,
  downloadUrl,
}: EmailPreviewParams) {
  const label = kind === "invoice" ? "Invoice" : "Quote"
  const dueLabel = kind === "invoice" ? "Due date" : "Valid until"
  const safeBusiness = escapeHtml(businessName || "Your business")
  const safeClient = escapeHtml(clientName || "there")
  const safeNumber = escapeHtml(number)

  const logoHtml = businessLogoDataUrl
    ? `<img src="${businessLogoDataUrl}" alt="${safeBusiness}" width="40" height="40" style="border-radius:10px;object-fit:cover;display:block;" />`
    : `<div style="width:40px;height:40px;border-radius:10px;background:#2563EB;color:#ffffff;font-weight:700;font-family:Arial,sans-serif;font-size:16px;line-height:40px;text-align:center;">${safeBusiness.charAt(0).toUpperCase() || "?"}</div>`

  return `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0F172A;">
    <p style="font-size:15px;line-height:1.6;">Hi ${safeClient},</p>
    <p style="font-size:15px;line-height:1.6;">
      Please find your ${label.toLowerCase()} attached as a PDF.
    </p>
    <p style="font-size:15px;line-height:1.6;margin-bottom:24px;">
      ${label}: #${safeNumber}<br/>
      Total: ${escapeHtml(total)}<br/>
      ${dueLabel}: ${escapeHtml(dueDate)}
    </p>

    <table role="presentation" width="100%" style="border:1px solid #E2E8F0;border-radius:16px;background:#FFFFFF;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%">
            <tr>
              <td width="40">${logoHtml}</td>
              <td style="padding-left:12px;">
                <div style="font-size:13px;color:#64748B;">${label}</div>
                <div style="font-size:16px;font-weight:700;">#${safeNumber}</div>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" style="margin-top:16px;border-top:1px solid #E2E8F0;padding-top:16px;">
            <tr>
              <td style="font-size:13px;color:#64748B;padding:4px 0;">Client</td>
              <td style="font-size:13px;text-align:right;padding:4px 0;">${safeClient}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#64748B;padding:4px 0;">Total</td>
              <td style="font-size:13px;font-weight:700;text-align:right;padding:4px 0;">${escapeHtml(total)}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#64748B;padding:4px 0;">${dueLabel}</td>
              <td style="font-size:13px;text-align:right;padding:4px 0;">${escapeHtml(dueDate)}</td>
            </tr>
          </table>
          <table role="presentation" width="100%" style="margin-top:20px;">
            <tr>
              <td align="center">
                <a href="${viewUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;">View ${label}</a>
                ${
                  downloadUrl
                    ? `<a href="${downloadUrl}" style="display:inline-block;margin-left:8px;background:#FFFFFF;color:#2563EB;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;border:1px solid #E2E8F0;">Download PDF</a>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size:14px;color:#64748B;margin-top:24px;">Thank you,<br/>${safeBusiness}</p>
  </div>`
}
