import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useData } from "../store/DataContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, EmptyState, Input, QuoteStatusBadge, Select } from "../components/ui"
import { formatCurrency, formatDate, invoiceTotal } from "../lib/calc"
import type { QuoteStatus } from "../types"

export default function Quotes() {
  const { quotes, clients, business } = useData()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<QuoteStatus | "all">("all")

  const filtered = useMemo(() => {
    return quotes
      .filter((q) => {
        const client = clients.find((c) => c.id === q.clientId)
        const matchesQuery =
          !query ||
          q.number.toLowerCase().includes(query.toLowerCase()) ||
          client?.name.toLowerCase().includes(query.toLowerCase()) ||
          client?.company.toLowerCase().includes(query.toLowerCase())
        const matchesStatus = status === "all" || q.status === status
        return matchesQuery && matchesStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [quotes, clients, query, status])

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} total quotes`}
        actions={
          <Button variant="primary" onClick={() => navigate("/quotes/new")}>
            <PlusIcon /> Create Quote
          </Button>
        }
      />

      <div className="px-4 lg:px-8 pb-10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by quote number or client..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus | "all")} className="sm:w-44">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="converted">Converted</option>
          </Select>
        </div>

        {quotes.length === 0 ? (
          <EmptyState
            title="No quotes yet"
            description="Send a professional quote and convert it to an invoice the moment your client accepts."
            action={
              <Button variant="primary" onClick={() => navigate("/quotes/new")}>
                Create your first quote
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching quotes" description="Try adjusting your search or filters." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="font-medium px-5 py-3">Quote</th>
                    <th className="font-medium px-5 py-3">Client</th>
                    <th className="font-medium px-5 py-3">Issued</th>
                    <th className="font-medium px-5 py-3">Expires</th>
                    <th className="font-medium px-5 py-3">Amount</th>
                    <th className="font-medium px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => {
                    const client = clients.find((c) => c.id === q.clientId)
                    return (
                      <tr key={q.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <Link to={`/quotes/${q.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                            {q.number}
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
                        <td className="px-5 py-3.5 text-slate-500">{formatDate(q.issueDate)}</td>
                        <td className="px-5 py-3.5 text-slate-500">{formatDate(q.expiryDate)}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          {formatCurrency(invoiceTotal(q), business.currency)}
                        </td>
                        <td className="px-5 py-3.5">
                          <QuoteStatusBadge status={q.status} />
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
