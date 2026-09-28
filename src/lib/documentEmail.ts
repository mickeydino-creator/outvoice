import type { BusinessProfile, Client, Invoice, Quote } from "../types"
import { buildDocumentEmail } from "./emailLayout"
import { renderEmailShell, escapeHtml } from "./emailTemplate"
import { sendEmail } from "./email"
import { formatCurrency, formatDate, invoiceTotal } from "./calc"

// Invoices and quotes are sent as a link to their public page (no login
// required) rather than a PDF attachment — lighter to send, and the client
// always sees the document's current state (e.g. once an invoice is marked
// paid, or a quote is accepted). The public page itself offers a "Download
// PDF" button rendered from the same customizable template.
export async function sendInvoiceByEmail(invoice: Invoice, client: Client, business: BusinessProfile) {
  const viewUrl = `${window.location.origin}/i/${invoice.id}`

  const body = buildDocumentEmail({
    kind: "invoice",
    businessName: business.name,
    clientName: client.name,
    number: invoice.number,
    total: formatCurrency(invoiceTotal(invoice), business.currency),
    dueDate: formatDate(invoice.dueDate),
    viewUrl,
  })

  const subject = `חשבונית ${invoice.number} מ-${business.name}`
  await sendEmail(client.email, subject, body)
}

export async function sendQuoteByEmail(quote: Quote, client: Client, business: BusinessProfile) {
  // Public link (no login required) so the client can actually open it and
  // approve/reject — not the freelancer-only /quotes/:id route.
  const viewUrl = `${window.location.origin}/q/${quote.id}`

  const body = buildDocumentEmail({
    kind: "quote",
    businessName: business.name,
    clientName: client.name,
    number: quote.number,
    total: formatCurrency(invoiceTotal(quote), business.currency),
    dueDate: formatDate(quote.expiryDate),
    viewUrl,
  })

  const subject = `הצעת מחיר ${quote.number} מ-${business.name}`
  await sendEmail(client.email, subject, body)
}

// Manual, on-demand reminder — the freelancer clicking "Remind client" on an
// unpaid invoice, as opposed to the automated cadence in
// send-invoice-reminders.
export async function sendInvoiceReminder(invoice: Invoice, client: Client, business: BusinessProfile) {
  const viewUrl = `${window.location.origin}/i/${invoice.id}`
  const safeClient = client.name ? ` ${escapeHtml(client.name)}` : ""
  const total = formatCurrency(invoiceTotal(invoice), business.currency)
  const dueDate = formatDate(invoice.dueDate)

  const body = renderEmailShell({
    businessName: business.name,
    eyebrow: "תזכורת תשלום",
    heading: `חשבונית ${invoice.number}`,
    bodyHtml: `<p style="margin:0;">שלום${safeClient},</p><p style="margin:8px 0 0;">זוהי תזכורת ידידותית לכך שהחשבונית עדיין לא שולמה.</p>`,
    infoRows: [
      { label: "תאריך לתשלום", value: dueDate },
      { label: "סה״כ", value: total, emphasis: true },
    ],
    primaryButton: { label: "לצפייה בחשבונית", url: viewUrl },
  })

  const subject = `תזכורת: חשבונית ${invoice.number} מ-${business.name}`
  await sendEmail(client.email, subject, body)
}
