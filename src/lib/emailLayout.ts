import { renderEmailShell, escapeHtml } from "./emailTemplate"

// Builds the email sent when an invoice/quote is shared with a client: a
// short message plus a Client/Total/Due-date summary and a "View" button
// linking to the document's page (no PDF is attached: the client always
// sees the current, up-to-date document there, and can download a PDF from
// that page themselves).
interface EmailPreviewParams {
  kind: "invoice" | "quote"
  businessName: string
  clientName: string
  number: string
  total: string
  dueDate: string
  viewUrl: string
}

export function buildDocumentEmail({
  kind,
  businessName,
  clientName,
  number,
  total,
  dueDate,
  viewUrl,
}: EmailPreviewParams) {
  const label = kind === "invoice" ? "חשבונית" : "הצעת מחיר"
  const dueLabel = kind === "invoice" ? "תאריך לתשלום" : "בתוקף עד"
  const safeClient = clientName ? ` ${escapeHtml(clientName)}` : ""
  const safeBusiness = escapeHtml(businessName || "נותן השירות שלך")
  const intro =
    kind === "invoice"
      ? `קיבלת חשבונית חדשה מ-${safeBusiness}. אפשר לצפות בחשבונית ולהוריד אותה בקישור הבא.`
      : `קיבלת הצעת מחיר חדשה מ-${safeBusiness}. אפשר לצפות בהצעה ולהשיב עליה בקישור הבא.`

  return renderEmailShell({
    businessName,
    eyebrow: label,
    heading: `${label} ${number}`,
    bodyHtml: `<p style="margin:0;">שלום${safeClient},</p><p style="margin:8px 0 0;">${intro}</p>`,
    infoRows: [
      { label: "לקוח", value: clientName },
      { label: dueLabel, value: dueDate },
      { label: "סה״כ", value: total, emphasis: true },
    ],
    primaryButton: { label: kind === "invoice" ? "לצפייה בחשבונית" : "לצפייה בהצעת המחיר", url: viewUrl },
  })
}
