import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { BusinessProfile, Client, Invoice, InvoiceStatus, LineItem } from "../types"
import { businessProfile as seedBusinessProfile, seedClients, seedInvoices } from "../lib/seed"
import { effectiveStatus, invoiceTotal } from "../lib/calc"

interface DataContextValue {
  clients: Client[]
  invoices: Invoice[]
  business: BusinessProfile
  nextInvoiceNumber: () => string
  addClient: (client: Omit<Client, "id" | "createdAt">) => Client
  updateClient: (id: string, patch: Partial<Client>) => void
  getClient: (id: string) => Client | undefined
  saveInvoice: (invoice: Invoice) => void
  deleteInvoice: (id: string) => void
  markInvoiceStatus: (id: string, status: InvoiceStatus) => void
  duplicateInvoice: (id: string) => Invoice | undefined
  createBlankInvoice: () => Invoice
  clientStats: (clientId: string) => { totalInvoiced: number; totalPaid: number; outstanding: number; invoices: Invoice[] }
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
  const [business] = useState<BusinessProfile>(() => loadInitial("if_business", seedBusinessProfile))

  function persistClients(next: Client[]) {
    setClients(next)
    localStorage.setItem("if_clients", JSON.stringify(next))
  }

  function persistInvoices(next: Invoice[]) {
    setInvoices(next)
    localStorage.setItem("if_invoices", JSON.stringify(next))
  }

  function nextInvoiceNumber() {
    const nums = invoices
      .map((inv) => parseInt(inv.number.replace(/\D/g, ""), 10))
      .filter((n) => !Number.isNaN(n))
    const max = nums.length ? Math.max(...nums) : 1000
    return `INV-${max + 1}`
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
      notes: "",
      paymentTerms: "Net 14",
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

  const value = useMemo<DataContextValue>(
    () => ({
      clients,
      invoices,
      business,
      nextInvoiceNumber,
      addClient,
      updateClient,
      getClient,
      saveInvoice,
      deleteInvoice,
      markInvoiceStatus,
      duplicateInvoice,
      createBlankInvoice,
      clientStats,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clients, invoices, business]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
