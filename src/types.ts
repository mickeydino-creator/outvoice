export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue"
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "converted"

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  productId?: string
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

export interface Quote {
  id: string
  number: string
  clientId: string
  issueDate: string
  expiryDate: string
  items: LineItem[]
  discount: number
  notes: string
  paymentTerms: string
  status: QuoteStatus
  createdAt: string
  sentAt?: string
  convertedInvoiceId?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  taxRate: number
}

export interface DocumentTemplates {
  invoiceHtml: string
  quoteHtml: string
}

export interface BusinessProfile {
  name: string
  businessType: string
  country: string
  email: string
  phone: string
  address: string
  currency: string
  logoInitial: string
  logoDataUrl?: string
  invoicePrefix: string
  defaultTaxRate: number
  taxLabel: string
  defaultPaymentTerms: string
  invoiceFooter: string
  emailSubjectTemplate: string
  emailBodyTemplate: string
  onboarded: boolean
}
