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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export function isOverdue(invoice: Invoice) {
  return invoice.status === "sent" && new Date(invoice.dueDate) < new Date()
}

export function effectiveStatus(invoice: Invoice): Invoice["status"] {
  if (invoice.status === "sent" && isOverdue(invoice)) return "overdue"
  return invoice.status
}
