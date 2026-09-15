import type { BusinessProfile, Client, Invoice, LineItem, Product, Quote } from "../types"

export function clientFromRow(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    address: row.address,
    createdAt: row.created_at,
  }
}

export function clientToRow(client: Omit<Client, "id" | "createdAt">) {
  return {
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
  }
}

export function productFromRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    taxRate: Number(row.tax_rate),
  }
}

export function productToRow(product: Omit<Product, "id">) {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    tax_rate: product.taxRate,
  }
}

function itemsFromJson(items: unknown): LineItem[] {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    id: item.id,
    description: item.description ?? "",
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    taxRate: Number(item.taxRate) || 0,
    productId: item.productId,
  }))
}

export function invoiceFromRow(row: any): Invoice {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id ?? "",
    issueDate: row.issue_date,
    dueDate: row.due_date,
    items: itemsFromJson(row.items),
    discount: Number(row.discount) || 0,
    notes: row.notes ?? "",
    paymentTerms: row.payment_terms ?? "",
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? undefined,
    paidAt: row.paid_at ?? undefined,
  }
}

export function invoiceToRow(invoice: Invoice) {
  return {
    id: invoice.id,
    number: invoice.number,
    client_id: invoice.clientId || null,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    items: invoice.items,
    discount: invoice.discount,
    notes: invoice.notes,
    payment_terms: invoice.paymentTerms,
    status: invoice.status,
    created_at: invoice.createdAt,
    sent_at: invoice.sentAt ?? null,
    paid_at: invoice.paidAt ?? null,
  }
}

export function quoteFromRow(row: any): Quote {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id ?? "",
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    items: itemsFromJson(row.items),
    discount: Number(row.discount) || 0,
    notes: row.notes ?? "",
    paymentTerms: row.payment_terms ?? "",
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? undefined,
    convertedInvoiceId: row.converted_invoice_id ?? undefined,
  }
}

export function quoteToRow(quote: Quote) {
  return {
    id: quote.id,
    number: quote.number,
    client_id: quote.clientId || null,
    issue_date: quote.issueDate,
    expiry_date: quote.expiryDate,
    items: quote.items,
    discount: quote.discount,
    notes: quote.notes,
    payment_terms: quote.paymentTerms,
    status: quote.status,
    created_at: quote.createdAt,
    sent_at: quote.sentAt ?? null,
    converted_invoice_id: quote.convertedInvoiceId ?? null,
  }
}

export function businessFromRow(row: any): BusinessProfile {
  return {
    name: row.name ?? "",
    businessType: row.business_type ?? "",
    country: row.country ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    currency: row.currency ?? "USD",
    logoInitial: row.logo_initial ?? "",
    logoDataUrl: row.logo_data_url ?? undefined,
    invoicePrefix: row.invoice_prefix ?? "INV",
    defaultTaxRate: Number(row.default_tax_rate) || 0,
    taxLabel: row.tax_label ?? "Tax",
    defaultPaymentTerms: row.default_payment_terms ?? "Net 14",
    invoiceFooter: row.invoice_footer ?? "",
    emailSubjectTemplate: row.email_subject_template ?? "",
    emailBodyTemplate: row.email_body_template ?? "",
    onboarded: Boolean(row.onboarded),
  }
}

export function businessToRow(business: BusinessProfile) {
  return {
    name: business.name,
    business_type: business.businessType,
    country: business.country,
    email: business.email,
    phone: business.phone,
    address: business.address,
    currency: business.currency,
    logo_initial: business.logoInitial,
    logo_data_url: business.logoDataUrl ?? null,
    invoice_prefix: business.invoicePrefix,
    default_tax_rate: business.defaultTaxRate,
    tax_label: business.taxLabel,
    default_payment_terms: business.defaultPaymentTerms,
    invoice_footer: business.invoiceFooter,
    email_subject_template: business.emailSubjectTemplate,
    email_body_template: business.emailBodyTemplate,
    onboarded: business.onboarded,
  }
}
