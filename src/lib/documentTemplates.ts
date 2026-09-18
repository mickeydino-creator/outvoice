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

// Four columns only (Description / Qty / Rate / Amount) — per-line tax isn't
// shown here, it's rolled up in the summary card instead. Returns bare <tr>
// rows so the surrounding template supplies its own <table>/<thead>.
function itemsRowsHtml(items: LineItem[], currency: string) {
  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description || "—")}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice, currency)}</td>
          <td>${formatCurrency(lineTotal(item), currency)}</td>
        </tr>`
    )
    .join("")
}

function businessLogoHtml(business: BusinessProfile) {
  if (business.logoDataUrl) {
    return `<img src="${business.logoDataUrl}" alt="${escapeHtml(business.name)}" class="logo" />`
  }
  return `<div class="logo logo-fallback">${escapeHtml(business.logoInitial || business.name.charAt(0) || "?")}</div>`
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
    business_logo: businessLogoHtml(business),
    business_email: escapeHtml(business.email),
    business_address: escapeHtml(business.address).replace(/\n/g, "<br/>"),
    client_name: escapeHtml(client?.name ?? ""),
    client_company: escapeHtml(client?.company ?? ""),
    client_email: escapeHtml(client?.email ?? ""),
    client_address: escapeHtml(client?.address ?? "").replace(/\n/g, "<br/>"),
    invoice_number: escapeHtml(invoice.number),
    issue_date: formatDate(invoice.issueDate),
    due_date: formatDate(invoice.dueDate),
    invoice_items: itemsRowsHtml(invoice.items, business.currency),
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
    business_logo: businessLogoHtml(business),
    business_email: escapeHtml(business.email),
    business_address: escapeHtml(business.address).replace(/\n/g, "<br/>"),
    client_name: escapeHtml(client?.name ?? ""),
    client_company: escapeHtml(client?.company ?? ""),
    client_email: escapeHtml(client?.email ?? ""),
    client_address: escapeHtml(client?.address ?? "").replace(/\n/g, "<br/>"),
    quote_number: escapeHtml(quote.number),
    issue_date: formatDate(quote.issueDate),
    expiry_date: formatDate(quote.expiryDate),
    quote_items: itemsRowsHtml(quote.items, business.currency),
    subtotal: formatCurrency(subtotal, business.currency),
    tax: formatCurrency(tax, business.currency),
    discount: formatCurrency(quote.discount, business.currency),
    total: formatCurrency(total, business.currency),
    notes: escapeHtml(quote.notes).replace(/\n/g, "<br/>"),
  })
}

// Shared look for both documents: a soft hero header, rounded info cards, a
// bordered items table and a dark summary panel. Kept as inline <style> +
// classes (not email-safe inline-styles-per-tag) because this HTML is only
// ever rendered inside a real browser context — html2canvas for the PDF, and
// an iframe for the Settings preview — never sent as raw email HTML.
function documentStyles() {
  return `<style>
    * { box-sizing: border-box; }
    .doc-page { margin: 0; padding: 50px 20px; background: #eef1f5; font-family: "Inter", Arial, sans-serif; color: #111827; }
    .doc { max-width: 900px; margin: auto; background: #fff; border-radius: 28px; overflow: hidden; box-shadow: 0 25px 70px rgba(15, 23, 42, 0.10); }
    .hero { padding: 44px 48px; background: radial-gradient(circle at 90% 20%, rgba(59,130,246,.15), transparent 30%), linear-gradient(135deg, #f7faff 0%, #ffffff 70%); border-bottom: 1px solid #e8edf3; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 30px; }
    .brand { display: flex; align-items: center; gap: 15px; }
    .logo { width: 58px; height: 58px; border-radius: 17px; object-fit: contain; background: #fff; border: 1px solid #e8edf3; padding: 7px; box-shadow: 0 8px 20px rgba(0,0,0,.05); }
    .logo-fallback { display: flex; align-items: center; justify-content: center; background: #2563eb; color: #fff; font-weight: 800; font-size: 20px; padding: 0; }
    .business-name { font-size: 21px; font-weight: 800; letter-spacing: -.4px; }
    .business-meta { margin-top: 4px; color: #718096; font-size: 12px; line-height: 1.7; }
    .doc-heading { text-align: right; }
    .doc-heading .label { display: inline-flex; align-items: center; padding: 6px 11px; background: #eaf3ff; color: #2563eb; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: .4px; margin-bottom: 9px; }
    .doc-heading h1 { margin: 0; font-size: 43px; line-height: 1; font-weight: 800; letter-spacing: -2px; }
    .doc-number { margin-top: 8px; color: #8994a3; font-size: 12px; }
    .content { padding: 38px 48px 48px; }
    .info { display: grid; grid-template-columns: 1.2fr .8fr; gap: 18px; margin-bottom: 35px; }
    .card { padding: 21px; background: #fbfcfe; border: 1px solid #e8edf3; border-radius: 18px; }
    .card-label { margin-bottom: 9px; color: #9aa4b2; font-size: 10px; font-weight: 800; letter-spacing: .7px; text-transform: uppercase; }
    .card-main { font-size: 16px; font-weight: 800; }
    .card-text { margin-top: 5px; color: #707b8c; font-size: 12px; line-height: 1.8; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 35px; overflow: hidden; border: 1px solid #e8edf3; border-radius: 18px; }
    .meta-item { padding: 18px 20px; border-right: 1px solid #e8edf3; }
    .meta-item:last-child { border-right: none; }
    .meta-label { margin-bottom: 5px; color: #9aa4b2; font-size: 10px; font-weight: 800; }
    .meta-value { font-size: 14px; font-weight: 700; }
    .items-title { margin-bottom: 12px; font-size: 14px; font-weight: 800; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; border: 1px solid #e8edf3; border-radius: 18px; }
    thead { background: #f7f9fc; }
    th { padding: 13px 15px; color: #7c8796; font-size: 10px; font-weight: 800; text-align: left; }
    th:not(:first-child), td:not(:first-child) { text-align: right; }
    td { padding: 17px 15px; border-top: 1px solid #edf0f4; font-size: 13px; }
    td:first-child { font-weight: 700; }
    .bottom { display: grid; grid-template-columns: 1fr 320px; gap: 40px; margin-top: 35px; }
    .notes { height: fit-content; padding: 20px; background: #f8fafc; border: 1px solid #e8edf3; border-radius: 18px; }
    .notes-title { margin-bottom: 8px; font-size: 11px; font-weight: 800; }
    .notes-text { color: #6f7a8a; font-size: 12px; line-height: 1.8; }
    .summary { padding: 22px; background: #111827; border-radius: 20px; color: #fff; box-shadow: 0 14px 35px rgba(17,24,39,.18); }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; color: #aeb7c5; font-size: 12px; }
    .summary-row.discount { color: #ff8f8f; }
    .summary-total { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px; padding-top: 17px; border-top: 1px solid rgba(255,255,255,.12); }
    .total-label { color: #aeb7c5; font-size: 12px; }
    .total-value { font-size: 29px; font-weight: 800; letter-spacing: -1px; }
    .footer { display: flex; justify-content: space-between; margin-top: 38px; padding-top: 22px; border-top: 1px solid #edf0f4; color: #9aa4b2; font-size: 10px; }
    @media (max-width: 650px) {
      .doc-page { padding: 15px; }
      .hero, .content { padding: 28px 22px; }
      .top { flex-direction: column; }
      .doc-heading { text-align: left; }
      .info, .bottom { grid-template-columns: 1fr; }
      .meta { grid-template-columns: 1fr; }
      .meta-item { border-right: none; border-bottom: 1px solid #e8edf3; }
      .meta-item:last-child { border-bottom: none; }
      .footer { flex-direction: column; gap: 8px; }
    }
    @media print {
      .doc-page { padding: 0; background: #fff; }
      .doc { max-width: none; box-shadow: none; border-radius: 0; }
    }
  </style>`
}

export const DEFAULT_INVOICE_TEMPLATE = `${documentStyles()}
<div class="doc-page">
<div class="doc">
  <div class="hero">
    <div class="top">
      <div class="brand">
        {{business_logo}}
        <div>
          <div class="business-name">{{business_name}}</div>
          <div class="business-meta">{{business_email}}<br>{{business_address}}</div>
        </div>
      </div>
      <div class="doc-heading">
        <div class="label">INVOICE</div>
        <h1>Invoice</h1>
        <div class="doc-number">#{{invoice_number}}</div>
      </div>
    </div>
  </div>
  <div class="content">
    <div class="info">
      <div class="card">
        <div class="card-label">Billed To</div>
        <div class="card-main">{{client_name}}</div>
        <div class="card-text">{{client_company}}<br>{{client_email}}<br>{{client_address}}</div>
      </div>
      <div class="card">
        <div class="card-label">Payment Status</div>
        <div class="card-main">Awaiting Payment</div>
        <div class="card-text">Due {{due_date}}</div>
      </div>
    </div>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-value">#{{invoice_number}}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Issue Date</div>
        <div class="meta-value">{{issue_date}}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Due Date</div>
        <div class="meta-value">{{due_date}}</div>
      </div>
    </div>
    <div class="items">
      <div class="items-title">Services &amp; Items</div>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>{{invoice_items}}</tbody>
      </table>
    </div>
    <div class="bottom">
      <div class="notes">
        <div class="notes-title">Notes &amp; Terms</div>
        <div class="notes-text">{{notes}}</div>
      </div>
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
        <div class="summary-row"><span>Tax</span><span>{{tax}}</span></div>
        <div class="summary-row discount"><span>Discount</span><span>-{{discount}}</span></div>
        <div class="summary-total"><div class="total-label">Total</div><div class="total-value">{{total}}</div></div>
      </div>
    </div>
    <div class="footer"><span>{{business_name}}</span><span>{{business_email}}</span></div>
  </div>
</div>
</div>`

export const DEFAULT_QUOTE_TEMPLATE = `${documentStyles()}
<div class="doc-page">
<div class="doc">
  <div class="hero">
    <div class="top">
      <div class="brand">
        {{business_logo}}
        <div>
          <div class="business-name">{{business_name}}</div>
          <div class="business-meta">{{business_email}}<br>{{business_address}}</div>
        </div>
      </div>
      <div class="doc-heading">
        <div class="label">QUOTE</div>
        <h1>Quote</h1>
        <div class="doc-number">#{{quote_number}}</div>
      </div>
    </div>
  </div>
  <div class="content">
    <div class="info">
      <div class="card">
        <div class="card-label">Prepared For</div>
        <div class="card-main">{{client_name}}</div>
        <div class="card-text">{{client_company}}<br>{{client_email}}<br>{{client_address}}</div>
      </div>
      <div class="card">
        <div class="card-label">Quote Status</div>
        <div class="card-main">Open Proposal</div>
        <div class="card-text">Valid until {{expiry_date}}</div>
      </div>
    </div>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Quote Number</div>
        <div class="meta-value">#{{quote_number}}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Issue Date</div>
        <div class="meta-value">{{issue_date}}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Valid Until</div>
        <div class="meta-value">{{expiry_date}}</div>
      </div>
    </div>
    <div class="items">
      <div class="items-title">Services &amp; Items</div>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>{{quote_items}}</tbody>
      </table>
    </div>
    <div class="bottom">
      <div class="notes">
        <div class="notes-title">Notes &amp; Terms</div>
        <div class="notes-text">{{notes}}</div>
      </div>
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
        <div class="summary-row"><span>Tax</span><span>{{tax}}</span></div>
        <div class="summary-row discount"><span>Discount</span><span>-{{discount}}</span></div>
        <div class="summary-total"><div class="total-label">Total</div><div class="total-value">{{total}}</div></div>
      </div>
    </div>
    <div class="footer"><span>{{business_name}}</span><span>{{business_email}}</span></div>
  </div>
</div>
</div>`
