import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { BusinessProfile, Client, DocumentTemplates, Invoice, InvoiceStatus, LineItem, Product, Quote, QuoteStatus } from "../types"
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient"
import { defaultDocumentTemplates, emptyBusinessProfile } from "../lib/defaults"
import { DEFAULT_INVOICE_TEMPLATE, DEFAULT_QUOTE_TEMPLATE } from "../lib/documentTemplates"
import { sanitizeHtml } from "../lib/sanitizeHtml"
import {
  businessFromRow,
  businessToRow,
  clientFromRow,
  clientToRow,
  invoiceFromRow,
  invoiceToRow,
  productFromRow,
  productToRow,
  quoteFromRow,
  quoteToRow,
} from "../lib/supabaseMappers"
import { effectiveStatus, invoiceTotal } from "../lib/calc"

interface DataContextValue {
  loading: boolean
  clients: Client[]
  invoices: Invoice[]
  quotes: Quote[]
  products: Product[]
  business: BusinessProfile
  templates: DocumentTemplates
  nextInvoiceNumber: () => string
  nextQuoteNumber: () => string
  addClient: (client: Omit<Client, "id" | "createdAt">) => Client
  updateClient: (id: string, patch: Partial<Client>) => void
  getClient: (id: string) => Client | undefined
  saveInvoice: (invoice: Invoice) => void
  deleteInvoice: (id: string) => void
  markInvoiceStatus: (id: string, status: InvoiceStatus) => void
  duplicateInvoice: (id: string) => Invoice | undefined
  createBlankInvoice: () => Invoice
  clientStats: (clientId: string) => { totalInvoiced: number; totalPaid: number; outstanding: number; invoices: Invoice[] }
  saveQuote: (quote: Quote) => void
  deleteQuote: (id: string) => void
  markQuoteStatus: (id: string, status: QuoteStatus) => void
  duplicateQuote: (id: string) => Quote | undefined
  convertQuoteToInvoice: (id: string) => Invoice | undefined
  createBlankQuote: () => Quote
  addProduct: (product: Omit<Product, "id">) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateBusiness: (patch: Partial<BusinessProfile>) => void
  completeOnboarding: (patch: Partial<BusinessProfile>) => void
  saveTemplate: (type: "invoice" | "quote", html: string) => void
  resetTemplate: (type: "invoice" | "quote") => void
}

const DataContext = createContext<DataContextValue | null>(null)

function makeId() {
  return crypto.randomUUID()
}

function logSupabaseError(action: string, error: unknown) {
  // eslint-disable-next-line no-console
  console.error(`Supabase error (${action}):`, error)
}

export function makeBlankLineItem(): LineItem {
  return { id: makeId(), description: "", quantity: 1, unitPrice: 0, taxRate: 0 }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [business, setBusiness] = useState<BusinessProfile>(emptyBusinessProfile)
  const [templates, setTemplates] = useState<DocumentTemplates>(defaultDocumentTemplates)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadAll() {
      const [clientsRes, productsRes, invoicesRes, quotesRes, businessRes, templatesRes] = await Promise.allSettled([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("business_profile").select("*").eq("id", 1).maybeSingle(),
        supabase.from("document_templates").select("*"),
      ])

      if (cancelled) return

      if (clientsRes.status === "rejected" || clientsRes.value.error) logSupabaseError("load clients", clientsRes.status === "rejected" ? clientsRes.reason : clientsRes.value.error)
      else setClients((clientsRes.value.data ?? []).map(clientFromRow))

      if (productsRes.status === "rejected" || productsRes.value.error) logSupabaseError("load products", productsRes.status === "rejected" ? productsRes.reason : productsRes.value.error)
      else setProducts((productsRes.value.data ?? []).map(productFromRow))

      if (invoicesRes.status === "rejected" || invoicesRes.value.error) logSupabaseError("load invoices", invoicesRes.status === "rejected" ? invoicesRes.reason : invoicesRes.value.error)
      else setInvoices((invoicesRes.value.data ?? []).map(invoiceFromRow))

      if (quotesRes.status === "rejected" || quotesRes.value.error) logSupabaseError("load quotes", quotesRes.status === "rejected" ? quotesRes.reason : quotesRes.value.error)
      else setQuotes((quotesRes.value.data ?? []).map(quoteFromRow))

      if (businessRes.status === "rejected" || businessRes.value.error) logSupabaseError("load business_profile", businessRes.status === "rejected" ? businessRes.reason : businessRes.value.error)
      else if (businessRes.value.data) setBusiness(businessFromRow(businessRes.value.data))

      if (templatesRes.status === "rejected" || templatesRes.value.error) logSupabaseError("load document_templates", templatesRes.status === "rejected" ? templatesRes.reason : templatesRes.value.error)
      else {
        const rows = templatesRes.value.data ?? []
        const invoiceRow = rows.find((r) => r.type === "invoice")
        const quoteRow = rows.find((r) => r.type === "quote")
        setTemplates({
          invoiceHtml: invoiceRow?.html ?? DEFAULT_INVOICE_TEMPLATE,
          quoteHtml: quoteRow?.html ?? DEFAULT_QUOTE_TEMPLATE,
        })
      }

      setLoading(false)
    }

    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  function nextInvoiceNumber() {
    const nums = invoices
      .map((inv) => parseInt(inv.number.replace(/\D/g, ""), 10))
      .filter((n) => !Number.isNaN(n))
    const max = nums.length ? Math.max(...nums) : 1000
    return `${business.invoicePrefix || "INV"}-${max + 1}`
  }

  function nextQuoteNumber() {
    const nums = quotes
      .map((q) => parseInt(q.number.replace(/\D/g, ""), 10))
      .filter((n) => !Number.isNaN(n))
    const max = nums.length ? Math.max(...nums) : 2000
    return `QUO-${max + 1}`
  }

  function addClient(client: Omit<Client, "id" | "createdAt">) {
    const newClient: Client = { ...client, id: makeId(), createdAt: new Date().toISOString() }
    setClients((prev) => [newClient, ...prev])
    supabase
      .from("clients")
      .insert({ id: newClient.id, ...clientToRow(client), created_at: newClient.createdAt })
      .then(({ error }) => error && logSupabaseError("addClient", error))
    return newClient
  }

  function updateClient(id: string, patch: Partial<Client>) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    const current = clients.find((c) => c.id === id)
    if (!current) return
    supabase
      .from("clients")
      .update(clientToRow({ ...current, ...patch }))
      .eq("id", id)
      .then(({ error }) => error && logSupabaseError("updateClient", error))
  }

  function getClient(id: string) {
    return clients.find((c) => c.id === id)
  }

  function saveInvoice(invoice: Invoice) {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === invoice.id)
      return exists ? prev.map((inv) => (inv.id === invoice.id ? invoice : inv)) : [invoice, ...prev]
    })
    supabase
      .from("invoices")
      .upsert(invoiceToRow(invoice))
      .then(({ error }) => error && logSupabaseError("saveInvoice", error))
  }

  function deleteInvoice(id: string) {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .then(({ error }) => error && logSupabaseError("deleteInvoice", error))
  }

  function markInvoiceStatus(id: string, status: InvoiceStatus) {
    let updated: Invoice | undefined
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv
        const patch: Partial<Invoice> = { status }
        if (status === "sent" && !inv.sentAt) patch.sentAt = new Date().toISOString()
        if (status === "paid") patch.paidAt = new Date().toISOString()
        updated = { ...inv, ...patch }
        return updated
      })
    )
    if (updated) {
      supabase
        .from("invoices")
        .update(invoiceToRow(updated))
        .eq("id", id)
        .then(({ error }) => error && logSupabaseError("markInvoiceStatus", error))
    }
  }

  function duplicateInvoice(id: string) {
    const source = invoices.find((inv) => inv.id === id)
    if (!source) return undefined
    const copy: Invoice = {
      ...source,
      id: makeId(),
      number: nextInvoiceNumber(),
      status: "draft",
      createdAt: new Date().toISOString(),
      sentAt: undefined,
      paidAt: undefined,
      items: source.items.map((it) => ({ ...it, id: makeId() })),
    }
    setInvoices((prev) => [copy, ...prev])
    supabase
      .from("invoices")
      .insert(invoiceToRow(copy))
      .then(({ error }) => error && logSupabaseError("duplicateInvoice", error))
    return copy
  }

  function createBlankInvoice(): Invoice {
    const today = new Date()
    const due = new Date()
    due.setDate(due.getDate() + 14)
    return {
      id: makeId(),
      number: nextInvoiceNumber(),
      clientId: clients[0]?.id ?? "",
      issueDate: today.toISOString(),
      dueDate: due.toISOString(),
      items: [makeBlankLineItem()],
      discount: 0,
      notes: business.invoiceFooter || "",
      paymentTerms: business.defaultPaymentTerms || "Net 14",
      status: "draft",
      createdAt: today.toISOString(),
    }
  }

  function clientStats(clientId: string) {
    const clientInvoices = invoices.filter((inv) => inv.clientId === clientId)
    const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + invoiceTotal(inv), 0)
    const totalPaid = clientInvoices
      .filter((inv) => effectiveStatus(inv) === "paid")
      .reduce((sum, inv) => sum + invoiceTotal(inv), 0)
    return {
      totalInvoiced,
      totalPaid,
      outstanding: totalInvoiced - totalPaid,
      invoices: clientInvoices,
    }
  }

  function saveQuote(quote: Quote) {
    setQuotes((prev) => {
      const exists = prev.some((q) => q.id === quote.id)
      return exists ? prev.map((q) => (q.id === quote.id ? quote : q)) : [quote, ...prev]
    })
    supabase
      .from("quotes")
      .upsert(quoteToRow(quote))
      .then(({ error }) => error && logSupabaseError("saveQuote", error))
  }

  function deleteQuote(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id))
    supabase
      .from("quotes")
      .delete()
      .eq("id", id)
      .then(({ error }) => error && logSupabaseError("deleteQuote", error))
  }

  function markQuoteStatus(id: string, status: QuoteStatus) {
    let updated: Quote | undefined
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const patch: Partial<Quote> = { status }
        if (status === "sent" && !q.sentAt) patch.sentAt = new Date().toISOString()
        updated = { ...q, ...patch }
        return updated
      })
    )
    if (updated) {
      supabase
        .from("quotes")
        .update(quoteToRow(updated))
        .eq("id", id)
        .then(({ error }) => error && logSupabaseError("markQuoteStatus", error))
    }
  }

  function duplicateQuote(id: string) {
    const source = quotes.find((q) => q.id === id)
    if (!source) return undefined
    const copy: Quote = {
      ...source,
      id: makeId(),
      number: nextQuoteNumber(),
      status: "draft",
      createdAt: new Date().toISOString(),
      sentAt: undefined,
      convertedInvoiceId: undefined,
      items: source.items.map((it) => ({ ...it, id: makeId() })),
    }
    setQuotes((prev) => [copy, ...prev])
    supabase
      .from("quotes")
      .insert(quoteToRow(copy))
      .then(({ error }) => error && logSupabaseError("duplicateQuote", error))
    return copy
  }

  function convertQuoteToInvoice(id: string) {
    const source = quotes.find((q) => q.id === id)
    if (!source) return undefined
    const today = new Date()
    const due = new Date()
    due.setDate(due.getDate() + 14)
    const invoice: Invoice = {
      id: makeId(),
      number: nextInvoiceNumber(),
      clientId: source.clientId,
      issueDate: today.toISOString(),
      dueDate: due.toISOString(),
      items: source.items.map((it) => ({ ...it, id: makeId() })),
      discount: source.discount,
      notes: source.notes,
      paymentTerms: source.paymentTerms,
      status: "draft",
      createdAt: today.toISOString(),
    }
    const updatedQuote: Quote = { ...source, status: "converted", convertedInvoiceId: invoice.id }

    setInvoices((prev) => [invoice, ...prev])
    setQuotes((prev) => prev.map((q) => (q.id === id ? updatedQuote : q)))

    supabase
      .from("invoices")
      .insert(invoiceToRow(invoice))
      .then(({ error }) => error && logSupabaseError("convertQuoteToInvoice:insert", error))
    supabase
      .from("quotes")
      .update(quoteToRow(updatedQuote))
      .eq("id", id)
      .then(({ error }) => error && logSupabaseError("convertQuoteToInvoice:update", error))

    return invoice
  }

  function createBlankQuote(): Quote {
    const today = new Date()
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 14)
    return {
      id: makeId(),
      number: nextQuoteNumber(),
      clientId: clients[0]?.id ?? "",
      issueDate: today.toISOString(),
      expiryDate: expiry.toISOString(),
      items: [makeBlankLineItem()],
      discount: 0,
      notes: business.invoiceFooter || "",
      paymentTerms: business.defaultPaymentTerms || "Net 14",
      status: "draft",
      createdAt: today.toISOString(),
    }
  }

  function addProduct(product: Omit<Product, "id">) {
    const newProduct: Product = { ...product, id: makeId() }
    setProducts((prev) => [newProduct, ...prev])
    supabase
      .from("products")
      .insert({ id: newProduct.id, ...productToRow(product) })
      .then(({ error }) => error && logSupabaseError("addProduct", error))
    return newProduct
  }

  function updateProduct(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    const current = products.find((p) => p.id === id)
    if (!current) return
    supabase
      .from("products")
      .update(productToRow({ ...current, ...patch }))
      .eq("id", id)
      .then(({ error }) => error && logSupabaseError("updateProduct", error))
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    supabase
      .from("products")
      .delete()
      .eq("id", id)
      .then(({ error }) => error && logSupabaseError("deleteProduct", error))
  }

  function updateBusiness(patch: Partial<BusinessProfile>) {
    const next = { ...business, ...patch }
    setBusiness(next)
    supabase
      .from("business_profile")
      .upsert(businessToRow(next))
      .then(({ error }) => error && logSupabaseError("updateBusiness", error))
  }

  function completeOnboarding(patch: Partial<BusinessProfile>) {
    updateBusiness({ ...patch, onboarded: true })
  }

  function saveTemplate(type: "invoice" | "quote", html: string) {
    const clean = sanitizeHtml(html)
    setTemplates((prev) => ({ ...prev, [type === "invoice" ? "invoiceHtml" : "quoteHtml"]: clean }))
    supabase
      .from("document_templates")
      .upsert({ type, html: clean })
      .then(({ error }) => error && logSupabaseError("saveTemplate", error))
  }

  function resetTemplate(type: "invoice" | "quote") {
    const fallback = type === "invoice" ? DEFAULT_INVOICE_TEMPLATE : DEFAULT_QUOTE_TEMPLATE
    saveTemplate(type, fallback)
  }

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      clients,
      invoices,
      quotes,
      products,
      business,
      templates,
      nextInvoiceNumber,
      nextQuoteNumber,
      addClient,
      updateClient,
      getClient,
      saveInvoice,
      deleteInvoice,
      markInvoiceStatus,
      duplicateInvoice,
      createBlankInvoice,
      clientStats,
      saveQuote,
      deleteQuote,
      markQuoteStatus,
      duplicateQuote,
      convertQuoteToInvoice,
      createBlankQuote,
      addProduct,
      updateProduct,
      deleteProduct,
      updateBusiness,
      completeOnboarding,
      saveTemplate,
      resetTemplate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, clients, invoices, quotes, products, business, templates]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
