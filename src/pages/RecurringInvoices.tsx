import { Link, useNavigate } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, EmptyState } from "../components/ui"
import { formatCurrency, invoiceTotal } from "../lib/calc"
import { formatSendMoment, frequencyLabel, recurrenceRuleOf } from "../lib/recurringSchedule"
import { nextOccurrence } from "../lib/recurrence"
import type { RecurringInvoice } from "../types"

export default function RecurringInvoices() {
  const { recurringInvoices, clients, business, setRecurringActive } = useData()
  const { showToast } = useToast()
  const navigate = useNavigate()

  function toggle(r: RecurringInvoice) {
    const updated = setRecurringActive(r.id, !r.active)
    if (!updated) return
    if (!r.active && !updated.active) showToast("לוח הזמנים הסתיים. אפשר לעדכן את תאריך הסיום בעריכה.", "error")
    else showToast(updated.active ? "החשבונית החוזרת הופעלה" : "החשבונית החוזרת הושהתה", "info")
  }

  return (
    <div>
      <PageHeader
        title="חשבוניות חוזרות"
        subtitle="חשבונית שנוצרת ונשלחת ללקוח אוטומטית, בתאריך ובשעה שבחרת."
        actions={
          <Button variant="primary" onClick={() => navigate("/recurring/new")}>
            <PlusIcon /> חשבונית חוזרת חדשה
          </Button>
        }
      />

      <div className="px-4 lg:px-8 pb-10 space-y-4">
        {recurringInvoices.length === 0 ? (
          <EmptyState
            icon={<RepeatIcon className="h-5 w-5" />}
            title="עדיין אין חשבוניות חוזרות"
            description="מגדירים פעם אחת לקוח, פריטים ותדירות, ו-Invoxa תפיק ותשלח את החשבונית בכל מחזור."
            action={
              <Button variant="primary" onClick={() => navigate("/recurring/new")}>
                יצירת חשבונית חוזרת
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="font-medium px-5 py-3">לקוח</th>
                    <th className="font-medium px-5 py-3">סכום</th>
                    <th className="font-medium px-5 py-3">תדירות</th>
                    <th className="font-medium px-5 py-3">שליחה הבאה</th>
                    <th className="font-medium px-5 py-3">נשלחו</th>
                    <th className="font-medium px-5 py-3">סטטוס</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recurringInvoices.map((r) => {
                    const client = clients.find((c) => c.id === r.clientId)
                    // Paused vs. finished: a finished schedule has no occurrence left before its end date.
                    const ended = !r.active && !!r.endDate && nextOccurrence(recurrenceRuleOf(r), new Date()) === null
                    return (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 align-top">
                        <td className="px-5 py-3.5">
                          <Link to={`/recurring/${r.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                            {client?.name ?? "ללא לקוח"}
                          </Link>
                          {client?.company && <p className="text-xs text-slate-400">{client.company}</p>}
                          {r.lastError && <p className="mt-1 max-w-xs text-xs text-red-600">{r.lastError}</p>}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{formatCurrency(invoiceTotal(r), business.currency)}</td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{frequencyLabel(r.frequency, r.interval)}</td>
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{r.active && r.nextRunAt ? formatSendMoment(r.nextRunAt, r.timezone) : "-"}</td>
                        <td className="px-5 py-3.5 text-slate-500">{r.runCount}</td>
                        <td className="px-5 py-3.5">
                          <ActiveBadge active={r.active} ended={ended} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => toggle(r)}>
                              {r.active ? "השהיה" : "הפעלה"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/recurring/${r.id}`)}>
                              עריכה
                            </Button>
                          </div>
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

function ActiveBadge({ active, ended }: { active: boolean; ended: boolean }) {
  const [label, style] = active
    ? ["פעילה", "bg-emerald-50 text-emerald-600"]
    : ended
    ? ["הסתיימה", "bg-slate-100 text-slate-500"]
    : ["מושהית", "bg-amber-50 text-amber-600"]
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l3 3-3 3" />
      <path d="M4 11V9a4 4 0 0 1 4-4h12" />
      <path d="M7 22l-3-3 3-3" />
      <path d="M20 13v2a4 4 0 0 1-4 4H4" />
    </svg>
  )
}
