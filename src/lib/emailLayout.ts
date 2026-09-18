import { renderEmailShell, escapeHtml } from "./emailTemplate"

// Builds the email sent when an invoice/quote is shared with a client: a
// short message plus a Client/Total/Due-date summary and a "View" button
// linking to the document's page (no PDF is attached — the client always
// sees the current, up-to-date document there, and can download a PDF from
// that page themselves).
interface EmailPreviewParams {
  kind: "invoice" | "quote"
  businessName: string
  businessLogoDataUrl?: string
  clientName: string
  number: string
  total: string
  dueDate: string
  viewUrl: string
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
}: EmailPreviewParams) {
  const label = kind === "invoice" ? "Invoice" : "Quote"
  const dueLabel = kind === "invoice" ? "Due date" : "Valid until"
  const safeClient = escapeHtml(clientName || "there")

  return renderEmailShell({
    businessName,
    businessLogoDataUrl,
    eyebrow: label,
    heading: `${label} #${number}`,
    bodyHtml: `<p style="margin:0;">Hi ${safeClient}, ${businessName || "your service provider"} sent you a new ${label.toLowerCase()}. You can review it any time using the link below.</p>`,
    infoRows: [
      { label: "Client", value: clientName },
      { label: dueLabel, value: dueDate },
      { label: "Total", value: total, emphasis: true },
    ],
    primaryButton: { label: `View ${label.toLowerCase()}`, url: viewUrl },
  })
}
