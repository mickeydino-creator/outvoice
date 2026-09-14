export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue"

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  issueDate: string
  dueDate: string
  items: LineItem[]
  discount: number
  notes: string
  paymentTerms: string
  status: InvoiceStatus
  createdAt: string
  sentAt?: string
  paidAt?: string
}

export interface BusinessProfile {
  name: string
  email: string
  phone: string
  address: string
  currency: string
  logoInitial: string
}
