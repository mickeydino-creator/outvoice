import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { BusinessProfile, Client, Invoice, InvoiceStatus, LineItem, Product, Quote, QuoteStatus } from "../types"
import {
  businessProfile as seedBusinessProfile,
  seedClients,
  seedInvoices,
  seedProducts,
  seedQuotes,
} from "../lib/seed"
import { effectiveStatus, invoiceTotal } from "../lib/calc"

interface DataContextValue {
  clients: Client[]
  invoices: Invoice[]
  quotes: Quote[]
  products: Product[]
  business: BusinessProfile
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
}

const DataContext = createContext<DataContextValue | null>(null)

function loadInitial<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore corrupt storage
  }
  return fallback
}

let idCounter = 0
function makeId(prefix: string) {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export function makeBlankLineItem(): LineItem {
  return { id: makeId("li"), description: "", quantity: 1, unitPrice: 0, taxRate: 0 }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadInitial("if_clients", seedClients))
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInitial("if_invoices", seedInvoices))
  const [quotes, setQuotes] = useState<Quote[]>(() => loadInitial("if_quotes", seedQuotes))
  const [products, setProducts] = useState<Product[]>(() => loadInitial("if_products", seedProducts))
  const [business, setBusiness] = useState<BusinessProfile>(() => loadInitial("if_business", seedBusinessProfile))

  function persistClients(next: Client[]) {
    setClients(next)
    localStorage.setItem("if_clients", JSON.stringify(next))
  }

  function persistInvoices(next: Invoice[]) {
    setInvoices(next)
    localStorage.setItem("if_invoices", JSON.stringify(next))
  }

  function persistQuotes(next: Quote[]) {
    setQuotes(next)
    localStorage.setItem("if_quotes", JSON.stringify(next))
  }

  function persistProducts(next: Product[]) {
    setProducts(next)
    localStorage.setItem("if_products", JSON.stringify(next))
  }

  function persistBusiness(next: BusinessProfile) {
    setBusiness(next)
    localStorage.setItem("if_business", JSON.stringify(next))
  }

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
    const newClient: Client = { ...client, id: makeId("c"), createdAt: new Date().toISOString() }
    persistClients([newClient, ...clients])
    return newClient
  }

  function updateClient(id: string, patch: Partial<Client>) {
    persistClients(clients.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function getClient(id: string) {
    return clients.find((c) => c.id === id)
  }

  function saveInvoice(invoice: Invoice) {
    const exists = invoices.some((inv) => inv.id === invoice.id)
    if (exists) {
      persistInvoices(invoices.map((inv) => (inv.id === invoice.id ? invoice : inv)))
    } else {
      persistInvoices([invoice, ...invoices])
    }
  }

  function deleteInvoice(id: string) {
    persistInvoices(invoices.filter((inv) => inv.id !== id))
  }

  function markInvoiceStatus(id: string, status: InvoiceStatus) {
    persistInvoices(
      invoices.map((inv) => {
        if (inv.id !== id) return inv
        const patch: Partial<Invoice> = { status }
        if (status === "sent" && !inv.sentAt) patch.sentAt = new Date().toISOString()
        if (status === "paid") patch.paidAt = new Date().toISOString()
        return { ...inv, ...patch }
      })
    )
  }

  function duplicateInvoice(id: string) {
    const source = invoices.find((inv) => inv.id === id)
    if (!source) return undefined
    const copy: Invoice = {
      ...source,
      id: makeId("inv"),
      number: nextInvoiceNumber(),
      status: "draft",
      createdAt: new Date().toISOString(),
      sentAt: undefined,
      paidAt: undefined,
      items: source.items.map((it) => ({ ...it, id: makeId("li") })),
    }
    persistInvoices([copy, ...invoices])
    return copy
  }

  function createBlankInvoice(): Invoice {
    const today = new Date()
    const due = new Date()
    due.setDate(due.getDate() + 14)
    return {
      id: makeId("inv"),
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
    const exists = quotes.some((q) => q.id === quote.id)
    if (exists) {
      persistQuotes(quotes.map((q) => (q.id === quote.id ? quote : q)))
    } else {
      persistQuotes([quote, ...quotes])
    }
  }

  function deleteQuote(id: string) {
    persistQuotes(quotes.filter((q) => q.id !== id))
  }

  function markQuoteStatus(id: string, status: QuoteStatus) {
    persistQuotes(
      quotes.map((q) => {
        if (q.id !== id) return q
        const patch: Partial<Quote> = { status }
        if (status === "sent" && !q.sentAt) patch.sentAt = new Date().toISOString()
        return { ...q, ...patch }
      })
    )
  }

  function duplicateQuote(id: string) {
    const source = quotes.find((q) => q.id === id)
    if (!source) return undefined
    const copy: Quote = {
      ...source,
      id: makeId("q"),
      number: nextQuoteNumber(),
      status: "draft",
      createdAt: new Date().toISOString(),
      sentAt: undefined,
      convertedInvoiceId: undefined,
      items: source.items.map((it) => ({ ...it, id: makeId("li") })),
    }
    persistQuotes([copy, ...quotes])
    return copy
  }

  function convertQuoteToInvoice(id: string) {
    const source = quotes.find((q) => q.id === id)
    if (!source) return undefined
    const today = new Date()
    const due = new Date()
    due.setDate(due.getDate() + 14)
    const invoice: Invoice = {
      id: makeId("inv"),
      number: nextInvoiceNumber(),
      clientId: source.clientId,
      issueDate: today.toISOString(),
      dueDate: due.toISOString(),
      items: source.items.map((it) => ({ ...it, id: makeId("li") })),
      discount: source.discount,
      notes: source.notes,
      paymentTerms: source.paymentTerms,
      status: "draft",
      createdAt: today.toISOString(),
    }
    persistInvoices([invoice, ...invoices])
    persistQuotes(quotes.map((q) => (q.id === id ? { ...q, status: "converted", convertedInvoiceId: invoice.id } : q)))
    return invoice
  }

  function createBlankQuote(): Quote {
    const today = new Date()
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 14)
    return {
      id: makeId("q"),
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
    const newProduct: Product = { ...product, id: makeId("p") }
    persistProducts([newProduct, ...products])
    return newProduct
  }

  function updateProduct(id: string, patch: Partial<Product>) {
    persistProducts(products.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function deleteProduct(id: string) {
    persistProducts(products.filter((p) => p.id !== id))
  }

  function updateBusiness(patch: Partial<BusinessProfile>) {
    persistBusiness({ ...business, ...patch })
  }

  function completeOnboarding(patch: Partial<BusinessProfile>) {
    persistBusiness({ ...business, ...patch, onboarded: true })
  }

  const value = useMemo<DataContextValue>(
    () => ({
      clients,
      invoices,
      quotes,
      products,
      business,
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clients, invoices, quotes, products, business]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
