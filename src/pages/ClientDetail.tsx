import { Link, useNavigate, useParams } from "react-router-dom"
import { useData } from "../store/DataContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, EmptyState, StatusBadge } from "../components/ui"
import { effectiveStatus, formatCurrency, formatDate, invoiceTotal } from "../lib/calc"

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getClient, clientStats, business } = useData()

  const client = id ? getClient(id) : undefined

  if (!client) {
    return (
      <div className="px-4 lg:px-8 py-10">
        <p className="text-slate-500">הלקוח לא נמצא.</p>
        <Button className="mt-4" onClick={() => navigate("/clients")}>
          חזרה ללקוחות
        </Button>
      </div>
    )
  }

  const stats = clientStats(client.id)
  const invoices = [...stats.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={client.company}
        actions={
          <Button variant="primary" onClick={() => navigate(`/invoices/new?client=${client.id}`)}>
            יצירת חשבונית
          </Button>
        }
      />

      <div className="px-4 lg:px-8 pb-16 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">סך החיובים</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(stats.totalInvoiced, business.currency)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">סך התשלומים</p>
            <p className="mt-2 text-xl font-semibold text-emerald-600">{formatCurrency(stats.totalPaid, business.currency)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">יתרה פתוחה לתשלום</p>
            <p className="mt-2 text-xl font-semibold text-amber-600">{formatCurrency(stats.outstanding, business.currency)}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">פרטי קשר</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">אימייל</dt>
                <dd className="text-slate-700"><span dir="ltr">{client.email || "-"}</span></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">טלפון</dt>
                <dd className="text-slate-700"><span dir="ltr">{client.phone || "-"}</span></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">כתובת</dt>
                <dd className="text-slate-700 whitespace-pre-line">{client.address || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">לקוח מאז</dt>
                <dd className="text-slate-700">{formatDate(client.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="lg:col-span-2 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">היסטוריית חשבוניות</h3>
            {invoices.length === 0 ? (
              <EmptyState
                title="עדיין אין חשבוניות"
                description="אפשר ליצור את החשבונית הראשונה ללקוח הזה."
                action={
                  <Button variant="primary" onClick={() => navigate(`/invoices/new?client=${client.id}`)}>
                    יצירת חשבונית
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-start text-xs text-slate-400 border-b border-slate-100">
                      <th className="font-medium px-5 py-2">חשבונית</th>
                      <th className="font-medium px-5 py-2">תאריך לתשלום</th>
                      <th className="font-medium px-5 py-2">סכום</th>
                      <th className="font-medium px-5 py-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <Link to={`/invoices/${inv.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {formatCurrency(invoiceTotal(inv), business.currency)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={effectiveStatus(inv)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
