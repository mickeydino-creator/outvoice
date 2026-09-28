import type { Invoice, LineItem } from "../types"

export function lineTotal(item: LineItem) {
  return item.quantity * item.unitPrice
}

export function invoiceSubtotal(items: LineItem[]) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0)
}

export function invoiceTax(items: LineItem[]) {
  return items.reduce((sum, item) => sum + lineTotal(item) * (item.taxRate / 100), 0)
}

export function invoiceTotal(invoice: Pick<Invoice, "items" | "discount">) {
  const subtotal = invoiceSubtotal(invoice.items)
  const tax = invoiceTax(invoice.items)
  return Math.max(0, subtotal + tax - invoice.discount)
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric" })
}

// Payment terms are stored as their original English values; this maps them for display.
const PAYMENT_TERMS_LABELS: Record<string, string> = {
  "Due on receipt": "לתשלום מיידי",
  "Net 7": "שוטף + 7",
  "Net 14": "שוטף + 14",
  "Net 30": "שוטף + 30",
  "Net 60": "שוטף + 60",
}

export function paymentTermsLabel(value: string) {
  return PAYMENT_TERMS_LABELS[value] ?? value
}

export function isOverdue(invoice: Invoice) {
  return invoice.status === "sent" && new Date(invoice.dueDate) < new Date()
}

export function effectiveStatus(invoice: Invoice): Invoice["status"] {
  if (invoice.status === "sent" && isOverdue(invoice)) return "overdue"
  return invoice.status
}
