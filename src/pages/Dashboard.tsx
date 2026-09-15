import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useData } from "../store/DataContext"
import { Card, StatusBadge } from "../components/ui"
import { effectiveStatus, formatCurrency, formatDate, invoiceTotal } from "../lib/calc"
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import PageHeader from "../components/PageHeader"

export default function Dashboard() {
  const { invoices, clients, business } = useData()

  const stats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let totalRevenue = 0
    let outstanding = 0
    let overdue = 0
    let paidThisMonth = 0

    for (const inv of invoices) {
      const status = effectiveStatus(inv)
      const total = invoiceTotal(inv)
      if (status === "paid") {
        totalRevenue += total
        if (inv.paidAt && new Date(inv.paidAt) >= startOfMonth) paidThisMonth += total
      } else if (status === "sent" || status === "overdue") {
        outstanding += total
        if (status === "overdue") overdue += total
      }
    }

    return { totalRevenue, outstanding, overdue, paidThisMonth }
  }, [invoices])

  const chartData = useMemo(() => {
    const months: { label: string; revenue: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString("en-US", { month: "short" })
      const monthRevenue = invoices
        .filter((inv) => {
          if (effectiveStatus(inv) !== "paid" || !inv.paidAt) return false
          const paidDate = new Date(inv.paidAt)
          return paidDate.getFullYear() === d.getFullYear() && paidDate.getMonth() === d.getMonth()
        })
        .reduce((sum, inv) => sum + invoiceTotal(inv), 0)
      months.push({ label, revenue: Math.round(monthRevenue) })
    }
    return months
  }, [invoices])

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const activity = useMemo(() => {
    const events: { id: string; text: string; time: string }[] = []
    for (const inv of invoices) {
      const client = clients.find((c) => c.id === inv.clientId)
      if (inv.paidAt) events.push({ id: `${inv.id}-paid`, text: `${client?.name ?? "Client"} paid ${inv.number}`, time: inv.paidAt })
      if (inv.sentAt) events.push({ id: `${inv.id}-sent`, text: `Sent ${inv.number} to ${client?.name ?? "client"}`, time: inv.sentAt })
    }
    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6)
  }, [invoices, clients])

  return (
    <div>
      <PageHeader
        title={`Welcome back${business.name ? "" : ""}`}
        subtitle="Here's how your business is doing."
        actions={
          <div className="flex gap-2">
            <Link to="/clients?new=1" data-tutorial="action-add-client">
              <ActionButton label="Add Client" variant="secondary" />
            </Link>
            <Link to="/quotes/new" data-tutorial="action-create-quote">
              <ActionButton label="Create Quote" variant="secondary" />
            </Link>
            <Link to="/invoices/new" data-tutorial="action-create-invoice">
              <ActionButton label="Create Invoice" variant="primary" />
            </Link>
          </div>
        }
      />

      <div className="px-4 lg:px-8 pb-10 space-y-6">
        <div data-tutorial="dashboard-overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total revenue" value={formatCurrency(stats.totalRevenue, business.currency)} tone="ink" />
          <StatCard label="Outstanding" value={formatCurrency(stats.outstanding, business.currency)} tone="blue" />
          <StatCard label="Overdue" value={formatCurrency(stats.overdue, business.currency)} tone="red" />
          <StatCard label="Paid this month" value={formatCurrency(stats.paidThisMonth, business.currency)} tone="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Revenue, last 6 months</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value), business.currency)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#revFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent activity</h3>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-slate-700">{event.text}</p>
                      <p className="text-xs text-slate-400">{formatDate(event.time)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent invoices</h3>
            <Link to="/invoices" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="font-medium px-5 py-2">Invoice</th>
                  <th className="font-medium px-5 py-2">Client</th>
                  <th className="font-medium px-5 py-2">Due date</th>
                  <th className="font-medium px-5 py-2">Amount</th>
                  <th className="font-medium px-5 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => {
                  const client = clients.find((c) => c.id === inv.clientId)
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer"
                    >
                      <td className="px-5 py-3">
                        <Link to={`/invoices/${inv.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{client?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {formatCurrency(invoiceTotal(inv), business.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={effectiveStatus(inv)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

function ActionButton({ label, variant }: { label: string; variant: "primary" | "secondary" }) {
  return (
    <span
      className={`inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
        variant === "primary"
          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20"
          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </span>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "ink" | "blue" | "red" | "green" }) {
  const toneStyles = {
    ink: "text-slate-900",
    blue: "text-blue-600",
    red: "text-red-600",
    green: "text-emerald-600",
  }
  return (
    <Card className="p-4 lg:p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-xl lg:text-2xl font-semibold tracking-tight ${toneStyles[tone]}`}>{value}</p>
    </Card>
  )
}
