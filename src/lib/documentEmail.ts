import type { BusinessProfile, Client, Invoice, Quote } from "../types"
import { renderInvoiceTemplate, renderQuoteTemplate } from "./documentTemplates"
import { htmlToPdfBase64 } from "./pdf"
import { buildDocumentEmail } from "./emailLayout"
import { sendEmail } from "./email"
import { formatCurrency, formatDate, invoiceTotal } from "./calc"

// Generates the invoice/quote as a PDF (using the customizable HTML template
// from Settings -> Document Templates) and emails it as an attachment, with a
// clean, short email body plus a lightweight visual preview card.

export async function sendInvoiceByEmail(
  invoice: Invoice,
  client: Client,
  business: BusinessProfile,
  templateHtml: string
) {
  const renderedHtml = renderInvoiceTemplate(templateHtml, invoice, client, business)
  const pdfBase64 = await htmlToPdfBase64(renderedHtml)
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
  })

  const subject = `Invoice #${invoice.number} from ${business.name}`
  await sendEmail(client.email, subject, body, [
    { filename: `Invoice-${invoice.number}.pdf`, content: pdfBase64 },
  ])
}

export async function sendQuoteByEmail(
  quote: Quote,
  client: Client,
  business: BusinessProfile,
  templateHtml: string
) {
  const renderedHtml = renderQuoteTemplate(templateHtml, quote, client, business)
  const pdfBase64 = await htmlToPdfBase64(renderedHtml)
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
  })

  const subject = `Quote #${quote.number} from ${business.name}`
  await sendEmail(client.email, subject, body, [
    { filename: `Quote-${quote.number}.pdf`, content: pdfBase64 },
  ])
}
