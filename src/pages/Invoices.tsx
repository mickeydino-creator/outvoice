import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useData } from "../store/DataContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, EmptyState, Input, Select, StatusBadge } from "../components/ui"
import { effectiveStatus, formatCurrency, formatDate, invoiceTotal } from "../lib/calc"
import type { InvoiceStatus } from "../types"

export default function Invoices() {
  const { invoices, clients, business } = useData()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<InvoiceStatus | "all">("all")

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        const client = clients.find((c) => c.id === inv.clientId)
        const matchesQuery =
          !query ||
          inv.number.toLowerCase().includes(query.toLowerCase()) ||
          client?.name.toLowerCase().includes(query.toLowerCase()) ||
          client?.company.toLowerCase().includes(query.toLowerCase())
        const matchesStatus = status === "all" || effectiveStatus(inv) === status
        return matchesQuery && matchesStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, clients, query, status])

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} total invoices`}
        actions={
          <Button variant="primary" onClick={() => navigate("/invoices/new")}>
            <PlusIcon /> Create Invoice
          </Button>
        }
      />

      <div className="px-4 lg:px-8 pb-10 space-y-4">
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Create your first invoice in under a minute. Add your client, line items, and send."
            action={
              <Button variant="primary" onClick={() => navigate("/invoices/new")}>
                Create your first invoice
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching invoices" description="Try adjusting your search or filters." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="font-medium px-5 py-3">Invoice</th>
                    <th className="font-medium px-5 py-3">Client</th>
                    <th className="font-medium px-5 py-3">Issued</th>
                    <th className="font-medium px-5 py-3">Due</th>
                    <th className="font-medium px-5 py-3">Amount</th>
                    <th className="font-medium px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const client = clients.find((c) => c.id === inv.clientId)
                    return (
                      <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <Link to={`/invoices/${inv.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {client ? (
                            <div>
                              <p>{client.name}</p>
                              <p className="text-xs text-slate-400">{client.company}</p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{formatDate(inv.issueDate)}</td>
                        <td className="px-5 py-3.5 text-slate-500">{formatDate(inv.dueDate)}</td>
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

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
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
