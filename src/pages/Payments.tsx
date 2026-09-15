import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useData } from "../store/DataContext"
import PageHeader from "../components/PageHeader"
import { Card, EmptyState, Input, Select, StatusBadge } from "../components/ui"
import { effectiveStatus, formatCurrency, formatDate, invoiceTotal } from "../lib/calc"
import type { InvoiceStatus } from "../types"

export default function Payments() {
  const { invoices, clients, business } = useData()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<InvoiceStatus | "all">("all")

  const stats = useMemo(() => {
    let paid = 0
    let pending = 0
    let overdue = 0
    for (const inv of invoices) {
      const total = invoiceTotal(inv)
      const st = effectiveStatus(inv)
      if (st === "paid") paid += total
      else if (st === "sent") pending += total
      else if (st === "overdue") overdue += total
    }
    return { paid, pending, overdue }
  }, [invoices])

  const rows = useMemo(() => {
    return invoices
      .filter((inv) => {
        const client = clients.find((c) => c.id === inv.clientId)
        const matchesQuery =
          !query ||
          inv.number.toLowerCase().includes(query.toLowerCase()) ||
          client?.name.toLowerCase().includes(query.toLowerCase())
        const matchesStatus = status === "all" || effectiveStatus(inv) === status
        return matchesQuery && matchesStatus && inv.status !== "draft"
      })
      .sort((a, b) => {
        const dateA = a.paidAt ?? a.sentAt ?? a.createdAt
        const dateB = b.paidAt ?? b.sentAt ?? b.createdAt
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
  }, [invoices, clients, query, status])

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track what's been paid, what's pending, and what's overdue." />

      <div className="px-4 lg:px-8 pb-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Paid</p>
            <p className="mt-2 text-xl font-semibold text-emerald-600">{formatCurrency(stats.paid, business.currency)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Pending</p>
            <p className="mt-2 text-xl font-semibold text-blue-600">{formatCurrency(stats.pending, business.currency)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Overdue</p>
            <p className="mt-2 text-xl font-semibold text-red-600">{formatCurrency(stats.overdue, business.currency)}</p>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by invoice number or client..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | "all")} className="sm:w-44">
            <option value="all">All statuses</option>
            <option value="sent">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No payment activity yet" description="Sent and paid invoices will show up here." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="font-medium px-5 py-3">Invoice</th>
                    <th className="font-medium px-5 py-3">Client</th>
                    <th className="font-medium px-5 py-3">Due date</th>
                    <th className="font-medium px-5 py-3">Paid date</th>
                    <th className="font-medium px-5 py-3">Amount</th>
                    <th className="font-medium px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => {
                    const client = clients.find((c) => c.id === inv.clientId)
                    return (
                      <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <Link to={`/invoices/${inv.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{client?.name ?? "—"}</td>
                        <td className="px-5 py-3.5 text-slate-500">{formatDate(inv.dueDate)}</td>
                        <td className="px-5 py-3.5 text-slate-500">{inv.paidAt ? formatDate(inv.paidAt) : "—"}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          {formatCurrency(invoiceTotal(inv), business.currency)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={effectiveStatus(inv)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
