import { useMemo } from "react"
import { useData } from "../store/DataContext"
import PageHeader from "../components/PageHeader"
import { Card } from "../components/ui"
import { effectiveStatus, formatCurrency, invoiceTotal, lineTotal } from "../lib/calc"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const PIE_COLORS = ["#2563EB", "#E2E8F0"]

export default function Reports() {
  const { invoices, clients, business } = useData()

  const revenueByMonth = useMemo(() => {
    const months: { label: string; revenue: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString("en-US", { month: "short" })
      const revenue = invoices
        .filter((inv) => {
          if (effectiveStatus(inv) !== "paid" || !inv.paidAt) return false
          const paidDate = new Date(inv.paidAt)
          return paidDate.getFullYear() === d.getFullYear() && paidDate.getMonth() === d.getMonth()
        })
        .reduce((sum, inv) => sum + invoiceTotal(inv), 0)
      months.push({ label, revenue: Math.round(revenue) })
    }
    return months
  }, [invoices])

  const paidVsUnpaid = useMemo(() => {
    let paid = 0
    let unpaid = 0
    for (const inv of invoices) {
      const total = invoiceTotal(inv)
      if (effectiveStatus(inv) === "paid") paid += total
      else if (inv.status !== "draft") unpaid += total
    }
    return [
      { name: "Paid", value: Math.round(paid) },
      { name: "Unpaid", value: Math.round(unpaid) },
    ]
  }, [invoices])

  const topClients = useMemo(() => {
    const totals = new Map<string, number>()
    for (const inv of invoices) {
      if (effectiveStatus(inv) !== "paid") continue
      totals.set(inv.clientId, (totals.get(inv.clientId) ?? 0) + invoiceTotal(inv))
    }
    return [...totals.entries()]
      .map(([clientId, total]) => ({ client: clients.find((c) => c.id === clientId), total }))
      .filter((row) => row.client)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [invoices, clients])

  const revenueByService = useMemo(() => {
    const totals = new Map<string, number>()
    for (const inv of invoices) {
      if (effectiveStatus(inv) !== "paid") continue
      for (const item of inv.items) {
        const key = item.description || "Other"
        totals.set(key, (totals.get(key) ?? 0) + lineTotal(item))
      }
    }
    return [...totals.entries()]
      .map(([service, total]) => ({ service, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [invoices])

  const maxServiceTotal = Math.max(1, ...revenueByService.map((r) => r.total))
  const maxClientTotal = Math.max(1, ...topClients.map((r) => r.total))

  return (
    <div>
      <PageHeader title="Reports" subtitle="Understand where your revenue is coming from." />

      <div className="px-4 lg:px-8 pb-16 space-y-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Revenue over time (12 months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
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
                  cursor={{ fill: "#F1F5F9" }}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Paid vs unpaid</h3>
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paidVsUnpaid} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={2}>
                      {paidVsUnpaid.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), business.currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {paidVsUnpaid.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-500">{entry.name}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(entry.value, business.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Top clients</h3>
            {topClients.length === 0 ? (
              <p className="text-sm text-slate-400">No paid invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {topClients.map((row) => (
                  <div key={row.client!.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{row.client!.name}</span>
                      <span className="font-medium text-slate-800">{formatCurrency(row.total, business.currency)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(row.total / maxClientTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Revenue by service</h3>
          {revenueByService.length === 0 ? (
            <p className="text-sm text-slate-400">No paid invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {revenueByService.map((row) => (
                <div key={row.service}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{row.service}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(row.total, business.currency)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${(row.total / maxServiceTotal) * 100}%`, backgroundColor: "#60A5FA" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
