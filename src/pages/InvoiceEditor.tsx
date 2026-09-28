import { useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useData, makeBlankLineItem } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, Input, Label, Select, Textarea } from "../components/ui"
import { formatCurrency, invoiceSubtotal, invoiceTax, invoiceTotal, lineTotal } from "../lib/calc"
import type { Invoice, LineItem } from "../types"
import InvoiceDocument from "../components/InvoiceDocument"
import LivePreviewPanel from "../components/LivePreviewPanel"
import { sendInvoiceByEmail } from "../lib/documentEmail"

export default function InvoiceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, clients, products, business, saveInvoice, createBlankInvoice, getClient } = useData()
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)

  const [searchParams] = useSearchParams()
  const isNew = !id || id === "new"
  const existing = !isNew ? invoices.find((inv) => inv.id === id) : undefined
  const [invoice, setInvoice] = useState<Invoice>(() => {
    if (existing) return existing
    const blank = createBlankInvoice()
    const preselectedClient = searchParams.get("client")
    if (preselectedClient) blank.clientId = preselectedClient
    return blank
  })
  const [showPreview, setShowPreview] = useState(false)

  const client = getClient(invoice.clientId)
  const subtotal = invoiceSubtotal(invoice.items)
  const tax = invoiceTax(invoice.items)
  const total = invoiceTotal(invoice)

  function updateField<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    setInvoice((prev) => ({ ...prev, [key]: value }))
  }

  function updateItem(itemId: string, patch: Partial<LineItem>) {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    }))
  }

  function addItem() {
    setInvoice((prev) => ({ ...prev, items: [...prev.items, makeBlankLineItem()] }))
  }

  function addProductItem(productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `li-${Date.now()}-${Math.random()}`, description: product.name, quantity: 1, unitPrice: product.price, taxRate: product.taxRate, productId: product.id },
      ],
    }))
  }

  function removeItem(itemId: string) {
    setInvoice((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }))
  }

  const canSave = useMemo(() => !!invoice.clientId && invoice.items.some((it) => it.description.trim()), [invoice])

  function handleSave(status?: Invoice["status"], andToast?: string) {
    const toSave = status ? { ...invoice, status } : invoice
    saveInvoice(toSave)
    setInvoice(toSave)
    if (andToast) showToast(andToast)
    return toSave
  }

  function handleSaveDraft() {
    handleSave("draft", "הטיוטה נשמרה")
    navigate(`/invoices/${invoice.id}`)
  }

  async function handleSend() {
    if (!client?.email) {
      showToast("ללקוח זה לא שמורה כתובת אימייל", "error")
      return
    }
    setSending(true)
    try {
      await sendInvoiceByEmail(invoice, client, business)
      handleSave("sent", "החשבונית נשלחה ללקוח")
      navigate(`/invoices/${invoice.id}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "שליחת החשבונית נכשלה", "error")
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "יצירת חשבונית" : `עריכת ${invoice.number}`}
        subtitle="ממלאים את הפרטים, והסכומים מחושבים אוטומטית."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "עריכה" : "תצוגה מקדימה"}
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={!canSave}>
              שמירת טיוטה
            </Button>
            <Button variant="primary" onClick={handleSend} disabled={!canSave || sending}>
              {sending ? "בשליחה..." : "שליחת חשבונית"}
            </Button>
          </>
        }
      />

      <div className="px-4 lg:px-8 pb-16">
        {showPreview ? (
          <InvoiceDocument invoice={invoice} client={client} business={business} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">פרטי החשבונית</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>לקוח</Label>
                    <Select value={invoice.clientId} onChange={(e) => updateField("clientId", e.target.value)}>
                      <option value="">בחירת לקוח</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.company ? ` - ${c.company}` : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>מספר חשבונית</Label>
                    <Input value={invoice.number} onChange={(e) => updateField("number", e.target.value)} />
                  </div>
                  <div>
                    <Label>תאריך הפקה</Label>
                    <Input
                      type="date"
                      value={invoice.issueDate.slice(0, 10)}
                      onChange={(e) => updateField("issueDate", new Date(e.target.value).toISOString())}
                    />
                  </div>
                  <div>
                    <Label>תאריך לתשלום</Label>
                    <Input
                      type="date"
                      value={invoice.dueDate.slice(0, 10)}
                      onChange={(e) => updateField("dueDate", new Date(e.target.value).toISOString())}
                    />
                  </div>
                  <div>
                    <Label>תנאי תשלום</Label>
                    <Select value={invoice.paymentTerms} onChange={(e) => updateField("paymentTerms", e.target.value)}>
                      <option value="Due on receipt">לתשלום מיידי</option>
                      <option value="Net 7">שוטף + 7</option>
                      <option value="Net 14">שוטף + 14</option>
                      <option value="Net 30">שוטף + 30</option>
                      <option value="Net 60">שוטף + 60</option>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">פריטים</h3>
                  <div className="flex gap-2">
                    {products.length > 0 && (
                      <Select
                        className="w-56"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) addProductItem(e.target.value)
                        }}
                      >
                        <option value="">+ הוספה ממוצרים ושירותים</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    )}
                    <Button size="sm" variant="secondary" onClick={addItem}>
                      + הוספת פריט
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-slate-400 px-1">
                    <div className="col-span-5">תיאור</div>
                    <div className="col-span-2">כמות</div>
                    <div className="col-span-2">מחיר ליחידה</div>
                    <div className="col-span-1">מע״מ %</div>
                    <div className="col-span-2 text-end">סכום</div>
                  </div>
                  {invoice.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-center">
                      <div className="col-span-2 sm:col-span-5">
                        <Input
                          placeholder="לדוגמה: עיצוב זהות מותגית"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Input
                          type="number"
                          min={0}
                          value={item.taxRate}
                          onChange={(e) => updateItem(item.id, { taxRate: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {formatCurrency(lineTotal(item), business.currency)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="הסרת פריט"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <div>
                  <Label>הנחה ({business.currency})</Label>
                  <Input
                    type="number"
                    min={0}
                    value={invoice.discount}
                    onChange={(e) => updateField("discount", Number(e.target.value))}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <Label>הערות</Label>
                  <Textarea
                    rows={3}
                    placeholder="תודה על שיתוף הפעולה..."
                    value={invoice.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                  />
                </div>
              </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">סיכום</h3>
                <SummaryRow label="סכום ביניים" value={formatCurrency(subtotal, business.currency)} />
                <SummaryRow label="מע״מ" value={formatCurrency(tax, business.currency)} />
                <SummaryRow label="הנחה" value={`-${formatCurrency(invoice.discount, business.currency)}`} />
                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <span className="text-sm font-semibold text-slate-800">סה״כ</span>
                  <span className="text-lg font-semibold text-slate-900">{formatCurrency(total, business.currency)}</span>
                </div>
                {!canSave && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                    כדי לשמור, יש לבחור לקוח ולהוסיף לפחות פריט אחד.
                  </p>
                )}
              </Card>

              <Card className="hidden lg:block p-3">
                <h3 className="text-sm font-semibold text-slate-800 px-2 pt-1 pb-3">תצוגה חיה</h3>
                <LivePreviewPanel>
                  <InvoiceDocument invoice={invoice} client={client} business={business} />
                </LivePreviewPanel>
              </Card>
            </div>
          </div>
        )}
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

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}
