import type { BusinessProfile, ReminderSettings } from "../types"
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
  currency: "ILS",
  logoInitial: "",
  invoicePrefix: "INV",
  defaultTaxRate: 0,
  taxLabel: "מע״מ",
  defaultPaymentTerms: "Net 14",
  invoiceFooter: "",
  emailSubjectTemplate: "חשבונית {{invoice_number}} מאת {{business_name}}",
  emailBodyTemplate: "",
  onboarded: false,
  timezone: "UTC",
}

export const defaultDocumentTemplates = {
  invoiceHtml: DEFAULT_INVOICE_TEMPLATE,
  quoteHtml: DEFAULT_QUOTE_TEMPLATE,
}

export const defaultReminderSettings: ReminderSettings = {
  enabled: true,
  daysBefore: [3],
  onDueDate: true,
  daysAfter: [3, 7],
  message: "",
}
