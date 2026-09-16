import type { BusinessProfile, Client, Invoice, Quote } from "../types"
import { renderInvoiceTemplate, renderQuoteTemplate } from "./documentTemplates"
import { htmlToPdfOutputs } from "./pdf"
import { uploadDocumentPdf } from "./documentPdfStorage"
import { buildDocumentEmail } from "./emailLayout"
import { sendEmail } from "./email"
import { formatCurrency, formatDate, invoiceTotal } from "./calc"

// Generates the invoice/quote as a PDF (using the customizable HTML template
// from Settings -> Document Templates), emails it as an attachment, and also
// uploads it to Storage so the email can include a direct "Download PDF" link.

export async function sendInvoiceByEmail(
  invoice: Invoice,
  client: Client,
  business: BusinessProfile,
  templateHtml: string,
  userId: string
) {
  const renderedHtml = renderInvoiceTemplate(templateHtml, invoice, client, business)
  const { base64, blob } = await htmlToPdfOutputs(renderedHtml)
  const downloadUrl = await uploadDocumentPdf(userId, "invoice", invoice.id, blob)
  const viewUrl = `${window.location.origin}/invoices/${invoice.id}`

  const body = buildDocumentEmail({
    kind: "invoice",
    businessName: business.name,
    businessLogoDataUrl: business.logoDataUrl,
    clientName: client.name,
    number: invoice.number,
    total: formatCurrency(invoiceTotal(invoice), business.currency),
    dueDate: formatDate(invoice.dueDate),
    viewUrl,
    downloadUrl: downloadUrl ?? undefined,
  })

  const subject = `Invoice #${invoice.number} from ${business.name}`
  await sendEmail(client.email, subject, body, [
    { filename: `Invoice-${invoice.number}.pdf`, content: base64 },
  ])
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
  const viewUrl = `${window.location.origin}/quotes/${quote.id}`

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
