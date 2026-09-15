import type { BusinessProfile, Client, LineItem } from "../types"
import { formatCurrency, formatDate, invoiceSubtotal, invoiceTax, invoiceTotal, lineTotal } from "./calc"

interface RenderableDocument {
  number: string
  issueDate: string
  dueDate: string
  items: LineItem[]
  discount: number
  notes: string
}

function itemsTableHtml(items: LineItem[], currency: string) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;">${escapeHtml(item.description || "—")}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;text-align:right;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;text-align:right;">${formatCurrency(item.unitPrice, currency)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;text-align:right;">${item.taxRate}%</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:600;">${formatCurrency(lineTotal(item), currency)}</td>
        </tr>`
    )
    .join("")

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;font-size:12px;text-transform:uppercase;color:#64748B;">
          <th style="padding-bottom:8px;border-bottom:1px solid #E2E8F0;">Description</th>
          <th style="padding-bottom:8px;border-bottom:1px solid #E2E8F0;text-align:right;">Qty</th>
          <th style="padding-bottom:8px;border-bottom:1px solid #E2E8F0;text-align:right;">Price</th>
          <th style="padding-bottom:8px;border-bottom:1px solid #E2E8F0;text-align:right;">Tax</th>
          <th style="padding-bottom:8px;border-bottom:1px solid #E2E8F0;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function applyVariables(html: string, vars: Record<string, string>) {
  return html.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const value = vars[key]
    return value !== undefined ? value : match
  })
}

export function renderInvoiceTemplate(
  html: string,
  invoice: RenderableDocument,
  client: Client | undefined,
  business: BusinessProfile
) {
  const subtotal = invoiceSubtotal(invoice.items)
  const tax = invoiceTax(invoice.items)
  const total = invoiceTotal(invoice)

  return applyVariables(html, {
    business_name: escapeHtml(business.name),
    business_logo: business.logoDataUrl
      ? `<img src="${business.logoDataUrl}" alt="${escapeHtml(business.name)}" style="height:48px;width:48px;object-fit:cover;border-radius:12px;" />`
      : "",
    business_email: escapeHtml(business.email),
    business_address: escapeHtml(business.address).replace(/\n/g, "<br/>"),
    client_name: escapeHtml(client?.name ?? ""),
    client_company: escapeHtml(client?.company ?? ""),
    client_email: escapeHtml(client?.email ?? ""),
    client_address: escapeHtml(client?.address ?? "").replace(/\n/g, "<br/>"),
    invoice_number: escapeHtml(invoice.number),
    issue_date: formatDate(invoice.issueDate),
    due_date: formatDate(invoice.dueDate),
    invoice_items: itemsTableHtml(invoice.items, business.currency),
    subtotal: formatCurrency(subtotal, business.currency),
    tax: formatCurrency(tax, business.currency),
    discount: formatCurrency(invoice.discount, business.currency),
    total: formatCurrency(total, business.currency),
    notes: escapeHtml(invoice.notes).replace(/\n/g, "<br/>"),
  })
}

export function renderQuoteTemplate(
  html: string,
  quote: { number: string; issueDate: string; expiryDate: string; items: LineItem[]; discount: number; notes: string },
  client: Client | undefined,
  business: BusinessProfile
) {
  const subtotal = invoiceSubtotal(quote.items)
  const tax = invoiceTax(quote.items)
  const total = invoiceTotal(quote)

  return applyVariables(html, {
    business_name: escapeHtml(business.name),
    business_logo: business.logoDataUrl
      ? `<img src="${business.logoDataUrl}" alt="${escapeHtml(business.name)}" style="height:48px;width:48px;object-fit:cover;border-radius:12px;" />`
      : "",
    business_email: escapeHtml(business.email),
    business_address: escapeHtml(business.address).replace(/\n/g, "<br/>"),
    client_name: escapeHtml(client?.name ?? ""),
    client_company: escapeHtml(client?.company ?? ""),
    client_email: escapeHtml(client?.email ?? ""),
    client_address: escapeHtml(client?.address ?? "").replace(/\n/g, "<br/>"),
    quote_number: escapeHtml(quote.number),
    issue_date: formatDate(quote.issueDate),
    expiry_date: formatDate(quote.expiryDate),
    quote_items: itemsTableHtml(quote.items, business.currency),
    subtotal: formatCurrency(subtotal, business.currency),
    tax: formatCurrency(tax, business.currency),
    discount: formatCurrency(quote.discount, business.currency),
    total: formatCurrency(total, business.currency),
    notes: escapeHtml(quote.notes).replace(/\n/g, "<br/>"),
  })
}

export const DEFAULT_INVOICE_TEMPLATE = `<div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px; color: #0F172A;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:1px solid #E2E8F0;">
    <div>
      {{business_logo}}
      <p style="font-weight:600;margin:8px 0 0;">{{business_name}}</p>
      <p style="color:#64748B;font-size:14px;margin:2px 0;">{{business_address}}</p>
      <p style="color:#64748B;font-size:14px;margin:2px 0;">{{business_email}}</p>
    </div>
    <div style="text-align:right;">
      <h1 style="font-size:24px;margin:0;">Invoice</h1>
      <p style="color:#64748B;margin:4px 0 0;">{{invoice_number}}</p>
    </div>
  </div>

  <div style="display:flex;gap:24px;padding:24px 0;border-bottom:1px solid #E2E8F0;">
    <div style="flex:1;">
      <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Billed to</p>
      <p style="font-weight:600;margin:0;">{{client_name}}</p>
      <p style="margin:2px 0;">{{client_company}}</p>
      <p style="color:#64748B;margin:2px 0;font-size:14px;">{{client_address}}</p>
    </div>
    <div style="flex:1;">
      <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Issue date</p>
      <p style="margin:0 0 12px;">{{issue_date}}</p>
      <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Due date</p>
      <p style="margin:0;">{{due_date}}</p>
    </div>
  </div>

  <div style="padding:24px 0;">
    {{invoice_items}}
    <div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <table style="width:240px;font-size:14px;">
        <tr><td style="color:#64748B;padding:4px 0;">Subtotal</td><td style="text-align:right;padding:4px 0;">{{subtotal}}</td></tr>
        <tr><td style="color:#64748B;padding:4px 0;">Tax</td><td style="text-align:right;padding:4px 0;">{{tax}}</td></tr>
        <tr><td style="color:#64748B;padding:4px 0;">Discount</td><td style="text-align:right;padding:4px 0;">-{{discount}}</td></tr>
        <tr><td style="font-weight:700;padding:8px 0 0;border-top:1px solid #E2E8F0;">Total</td><td style="text-align:right;font-weight:700;padding:8px 0 0;border-top:1px solid #E2E8F0;">{{total}}</td></tr>
      </table>
    </div>
  </div>

  <div style="padding-top:16px;border-top:1px solid #E2E8F0;">
    <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Notes</p>
    <p style="color:#475569;font-size:14px;">{{notes}}</p>
  </div>
</div>`

export const DEFAULT_QUOTE_TEMPLATE = `<div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px; color: #0F172A;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:1px solid #E2E8F0;">
    <div>
      {{business_logo}}
      <p style="font-weight:600;margin:8px 0 0;">{{business_name}}</p>
      <p style="color:#64748B;font-size:14px;margin:2px 0;">{{business_address}}</p>
      <p style="color:#64748B;font-size:14px;margin:2px 0;">{{business_email}}</p>
    </div>
    <div style="text-align:right;">
      <h1 style="font-size:24px;margin:0;">Quote</h1>
      <p style="color:#64748B;margin:4px 0 0;">{{quote_number}}</p>
    </div>
  </div>

  <div style="display:flex;gap:24px;padding:24px 0;border-bottom:1px solid #E2E8F0;">
    <div style="flex:1;">
      <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Prepared for</p>
      <p style="font-weight:600;margin:0;">{{client_name}}</p>
      <p style="margin:2px 0;">{{client_company}}</p>
      <p style="color:#64748B;margin:2px 0;font-size:14px;">{{client_address}}</p>
    </div>
    <div style="flex:1;">
      <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Issue date</p>
      <p style="margin:0 0 12px;">{{issue_date}}</p>
      <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Valid until</p>
      <p style="margin:0;">{{expiry_date}}</p>
    </div>
  </div>

  <div style="padding:24px 0;">
    {{quote_items}}
    <div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <table style="width:240px;font-size:14px;">
        <tr><td style="color:#64748B;padding:4px 0;">Subtotal</td><td style="text-align:right;padding:4px 0;">{{subtotal}}</td></tr>
        <tr><td style="color:#64748B;padding:4px 0;">Tax</td><td style="text-align:right;padding:4px 0;">{{tax}}</td></tr>
        <tr><td style="color:#64748B;padding:4px 0;">Discount</td><td style="text-align:right;padding:4px 0;">-{{discount}}</td></tr>
        <tr><td style="font-weight:700;padding:8px 0 0;border-top:1px solid #E2E8F0;">Total</td><td style="text-align:right;font-weight:700;padding:8px 0 0;border-top:1px solid #E2E8F0;">{{total}}</td></tr>
      </table>
    </div>
  </div>

  <div style="padding-top:16px;border-top:1px solid #E2E8F0;">
    <p style="font-size:12px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Notes</p>
    <p style="color:#475569;font-size:14px;">{{notes}}</p>
  </div>
</div>`
