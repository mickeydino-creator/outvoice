import type { BusinessProfile, Client, Invoice, Quote } from "../types"
import { renderQuoteTemplate } from "./documentTemplates"
import { htmlToPdfOutputs } from "./pdf"
import { uploadDocumentPdf } from "./documentPdfStorage"
import { buildDocumentEmail } from "./emailLayout"
import { sendEmail } from "./email"
import { formatCurrency, formatDate, invoiceTotal } from "./calc"

// Invoices are sent as a link to the public invoice page (no login required)
// rather than a PDF attachment — lighter to send, and always reflects the
// invoice's current state (e.g. once it's marked paid).
export async function sendInvoiceByEmail(invoice: Invoice, client: Client, business: BusinessProfile) {
  const viewUrl = `${window.location.origin}/i/${invoice.id}`

  const body = buildDocumentEmail({
    kind: "invoice",
    businessName: business.name,
    businessLogoDataUrl: business.logoDataUrl,
    clientName: client.name,
    number: invoice.number,
    total: formatCurrency(invoiceTotal(invoice), business.currency),
    dueDate: formatDate(invoice.dueDate),
    viewUrl,
    attached: false,
  })

  const subject = `Invoice #${invoice.number} from ${business.name}`
  await sendEmail(client.email, subject, body)
}

// Manual, on-demand reminder — the freelancer clicking "Remind client" on an
// unpaid invoice, as opposed to the automated cadence in
// send-invoice-reminders. Reuses the same public link and email layout.
export async function sendInvoiceReminder(invoice: Invoice, client: Client, business: BusinessProfile) {
  const viewUrl = `${window.location.origin}/i/${invoice.id}`
  const safeBusiness = business.name || "Your service provider"
  const safeClient = client.name || "there"
  const total = formatCurrency(invoiceTotal(invoice), business.currency)
  const dueDate = formatDate(invoice.dueDate)

  const body = `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0F172A;">
    <p style="font-size:15px;line-height:1.6;">Hi ${safeClient},</p>
    <p style="font-size:15px;line-height:1.6;">
      This is a friendly reminder that invoice #${invoice.number} for ${total}, due ${dueDate}, is still outstanding.
    </p>
    <p style="margin-top:20px;">
      <a href="${viewUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;">View invoice</a>
    </p>
    <p style="font-size:14px;color:#64748B;margin-top:24px;">Thank you,<br/>${safeBusiness}</p>
  </div>`

  const subject = `Reminder: Invoice #${invoice.number} from ${business.name}`
  await sendEmail(client.email, subject, body)
}

export async function sendQuoteByEmail(
  quote: Quote,
  client: Client,
  business: BusinessProfile,
  templateHtml: string,
  userId: string
) {
  const renderedHtml = renderQuoteTemplate(templateHtml, quote, client, business)
  const { base64, blob } = await htmlToPdfOutputs(renderedHtml)
  const downloadUrl = await uploadDocumentPdf(userId, "quote", quote.id, blob)
  // Public link (no login required) so the client can actually open it and
  // approve/reject — not the freelancer-only /quotes/:id route.
  const viewUrl = `${window.location.origin}/q/${quote.id}`

  const body = buildDocumentEmail({
    kind: "quote",
    businessName: business.name,
    businessLogoDataUrl: business.logoDataUrl,
    clientName: client.name,
    number: quote.number,
    total: formatCurrency(invoiceTotal(quote), business.currency),
    dueDate: formatDate(quote.expiryDate),
    viewUrl,
    downloadUrl: downloadUrl ?? undefined,
  })

  const subject = `Quote #${quote.number} from ${business.name}`
  await sendEmail(client.email, subject, body, [
    { filename: `Quote-${quote.number}.pdf`, content: base64 },
  ])
}
