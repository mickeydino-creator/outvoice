import { useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import LineItemsCard from "../components/LineItemsCard"
import { Button, Card, Input, Label, Select, Textarea } from "../components/ui"
import { formatCurrency, invoiceSubtotal, invoiceTax, invoiceTotal } from "../lib/calc"
import { upcomingOccurrences, zonedTimeToUtc } from "../lib/recurrence"
import { formatSendMoment, frequencyLabel, recurrenceRuleOf, unitPluralLabel } from "../lib/recurringSchedule"
import type { RecurringFrequency, RecurringInvoice } from "../types"

export default function RecurringInvoiceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recurringInvoices } = useData()

  const isNew = !id || id === "new"
  const existing = !isNew ? recurringInvoices.find((r) => r.id === id) : undefined

  if (!isNew && !existing) {
    return (
      <div className="px-4 lg:px-8 py-10">
        <p className="text-slate-500">החשבונית החוזרת לא נמצאה.</p>
        <Button className="mt-4" onClick={() => navigate("/recurring")}>
          חזרה לחשבוניות חוזרות
        </Button>
      </div>
    )
  }

  return <RecurringForm key={id ?? "new"} existing={existing} />
}

function RecurringForm({ existing }: { existing?: RecurringInvoice }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { clients, business, getClient, createBlankRecurring, saveRecurring, deleteRecurring } = useData()
  const { showToast } = useToast()
  const isNew = !existing
  const [form, setForm] = useState<RecurringInvoice>(() => existing ?? createBlankRecurring(searchParams.get("from") ?? undefined))

  const client = getClient(form.clientId)
  const upcoming = useMemo(() => {
    if (!form.startDate || !form.sendTime) return []
    return upcomingOccurrences(recurrenceRuleOf(form), new Date(), 3)
  }, [form])

  const startsInPast = form.startDate && form.sendTime ? zonedTimeToUtc(form.startDate, form.sendTime, form.timezone) <= new Date() : false
  const hasItems = form.items.some((it) => it.description.trim())
  const endBeforeStart = !!form.endDate && form.endDate < form.startDate
  const canSave = !!form.clientId && hasItems && !!form.startDate && !!form.sendTime && !endBeforeStart

  function update<K extends keyof RecurringInvoice>(key: K, value: RecurringInvoice[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const wantActive = isNew || form.active
    const saved = saveRecurring({ ...form, active: wantActive })
    if (saved.active && saved.nextRunAt) showToast(`נשמר. החשבונית הבאה תישלח ב-${formatSendMoment(saved.nextRunAt, saved.timezone)}`)
    else if (wantActive) showToast("נשמר, אבל אין מועד שליחה לפני תאריך הסיום", "error")
    else showToast("נשמר. החשבונית החוזרת מושהית.", "info")
    navigate("/recurring")
  }

  function handleDelete() {
    if (confirm("למחוק את החשבונית החוזרת? חשבוניות שכבר נשלחו לא יימחקו.")) {
      deleteRecurring(form.id)
      showToast("החשבונית החוזרת נמחקה", "info")
      navigate("/recurring")
    }
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "חשבונית חוזרת חדשה" : "עריכת חשבונית חוזרת"}
        subtitle="בוחרים לקוח, פריטים ותדירות. החשבונית תיווצר ותישלח ללקוח אוטומטית בכל מחזור."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/recurring")}>
              ביטול
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!canSave}>
              {isNew ? "הפעלת חשבונית חוזרת" : "שמירה"}
            </Button>
          </>
        }
      />

      <div className="px-4 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">לקוח ותנאים</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>לקוח</Label>
                  <Select value={form.clientId} onChange={(e) => update("clientId", e.target.value)}>
                    <option value="">בחירת לקוח</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` - ${c.company}` : ""}
                      </option>
                    ))}
                  </Select>
                  {client && !client.email && (
                    <p className="mt-1 text-xs text-amber-600">ללקוח זה אין אימייל, ולכן החשבוניות יישמרו כטיוטה ולא יישלחו.</p>
                  )}
                </div>
                <div>
                  <Label>תנאי תשלום</Label>
                  <Select value={form.paymentTerms} onChange={(e) => update("paymentTerms", e.target.value)}>
                    <option value="Due on receipt">לתשלום מיידי</option>
                    <option value="Net 7">שוטף + 7</option>
                    <option value="Net 14">שוטף + 14</option>
                    <option value="Net 30">שוטף + 30</option>
                    <option value="Net 60">שוטף + 60</option>
                  </Select>
                  <p className="mt-1 text-xs text-slate-400">תאריך התשלום נקבע לפי יום ההפקה של כל חשבונית.</p>
                </div>
              </div>
            </Card>

            <LineItemsCard items={form.items} onChange={(items) => update("items", items)} />

            <Card className="p-5 space-y-4">
              <div>
                <Label>הנחה ({business.currency})</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.discount}
                  onChange={(e) => update("discount", Number(e.target.value))}
                  className="max-w-xs"
                />
              </div>
              <div>
                <Label>הערות</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">תזמון</h3>
              <div>
                <Label>תדירות</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">כל</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={form.interval}
                    onChange={(e) => update("interval", Math.min(365, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
                    className="w-20"
                  />
                  <Select value={form.frequency} onChange={(e) => update("frequency", e.target.value as RecurringFrequency)}>
                    {(["day", "week", "month", "year"] as RecurringFrequency[]).map((f) => (
                      <option key={f} value={f}>
                        {unitPluralLabel(f)}
                      </option>
                    ))}
                  </Select>
                </div>
                <p className="mt-1 text-xs text-slate-400">{frequencyLabel(form.frequency, form.interval)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>תאריך שליחה ראשון</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
                </div>
                <div>
                  <Label>שעה</Label>
                  <Input type="time" value={form.sendTime} onChange={(e) => update("sendTime", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>תאריך סיום (לא חובה)</Label>
                <Input type="date" value={form.endDate ?? ""} min={form.startDate} onChange={(e) => update("endDate", e.target.value || undefined)} />
                {endBeforeStart && <p className="mt-1 text-xs text-red-600">תאריך הסיום מוקדם מתאריך השליחה הראשון.</p>}
              </div>
              <p className="text-xs text-slate-400">השעות לפי אזור הזמן {form.timezone}.</p>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">השליחות הקרובות</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500">אין מועדי שליחה לפני תאריך הסיום.</p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((d) => (
                    <li key={d.toISOString()} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {formatSendMoment(d.toISOString(), form.timezone)}
                    </li>
                  ))}
                </ul>
              )}
              {startsInPast && upcoming.length > 0 && (
                <p className="text-xs text-slate-400">מועד ההתחלה כבר עבר, ולכן השליחה הראשונה תהיה במחזור הבא.</p>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">סכום לכל חשבונית</h3>
              <SummaryRow label="סכום ביניים" value={formatCurrency(invoiceSubtotal(form.items), business.currency)} />
              <SummaryRow label="מע״מ" value={formatCurrency(invoiceTax(form.items), business.currency)} />
              <SummaryRow label="הנחה" value={`-${formatCurrency(form.discount, business.currency)}`} />
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <span className="text-sm font-semibold text-slate-800">סה״כ</span>
                <span className="text-lg font-semibold text-slate-900">{formatCurrency(invoiceTotal(form), business.currency)}</span>
              </div>
              {!canSave && !endBeforeStart && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">כדי לשמור, יש לבחור לקוח ולהוסיף לפחות פריט אחד.</p>
              )}
            </Card>

            {!isNew && (
              <div className="flex justify-end">
                <button onClick={handleDelete} className="text-xs text-slate-400 hover:text-red-500">
                  מחיקת החשבונית החוזרת
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}
