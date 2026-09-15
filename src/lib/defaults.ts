import type { BusinessProfile } from "../types"
import { DEFAULT_INVOICE_TEMPLATE, DEFAULT_QUOTE_TEMPLATE } from "./documentTemplates"

// Blank starting state used only until real data is loaded from Supabase.
// Contains no business/demo content of any kind.
export const emptyBusinessProfile: BusinessProfile = {
  name: "",
  businessType: "",
  country: "",
  email: "",
  phone: "",
  address: "",
  currency: "USD",
  logoInitial: "",
  invoicePrefix: "INV",
  defaultTaxRate: 0,
  taxLabel: "Tax",
  defaultPaymentTerms: "Net 14",
  invoiceFooter: "",
  emailSubjectTemplate: "Invoice {{invoice_number}} from {{business_name}}",
  emailBodyTemplate: "",
  onboarded: false,
}

export const defaultDocumentTemplates = {
  invoiceHtml: DEFAULT_INVOICE_TEMPLATE,
  quoteHtml: DEFAULT_QUOTE_TEMPLATE,
}
