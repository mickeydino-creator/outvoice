import { useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useData, makeBlankLineItem } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, Card, Input, Label, Select, Textarea } from "../components/ui"
import { formatCurrency, invoiceSubtotal, invoiceTax, invoiceTotal, lineTotal } from "../lib/calc"
import type { LineItem, Quote } from "../types"
import InvoiceDocument from "../components/InvoiceDocument"
import { sendQuoteByEmail } from "../lib/documentEmail"

export default function QuoteEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { quotes, clients, products, business, templates, saveQuote, createBlankQuote, getClient } = useData()
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)

  const isNew = !id || id === "new"
  const existing = !isNew ? quotes.find((q) => q.id === id) : undefined
  const [quote, setQuote] = useState<Quote>(() => {
    if (existing) return existing
    const blank = createBlankQuote()
    const preselectedClient = searchParams.get("client")
    if (preselectedClient) blank.clientId = preselectedClient
    return blank
  })
  const [showPreview, setShowPreview] = useState(false)

  const client = getClient(quote.clientId)
  const subtotal = invoiceSubtotal(quote.items)
  const tax = invoiceTax(quote.items)
  const total = invoiceTotal(quote)

  function updateField<K extends keyof Quote>(key: K, value: Quote[K]) {
    setQuote((prev) => ({ ...prev, [key]: value }))
  }

  function updateItem(itemId: string, patch: Partial<LineItem>) {
    setQuote((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    }))
  }

  function addItem() {
    setQuote((prev) => ({ ...prev, items: [...prev.items, makeBlankLineItem()] }))
  }

  function addProductItem(productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setQuote((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `li-${Date.now()}-${Math.random()}`, description: product.name, quantity: 1, unitPrice: product.price, taxRate: product.taxRate, productId: product.id },
      ],
    }))
  }

  function removeItem(itemId: string) {
    setQuote((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }))
  }

  const canSave = useMemo(() => !!quote.clientId && quote.items.some((it) => it.description.trim()), [quote])

  function handleSave(status?: Quote["status"], andToast?: string) {
    const toSave = status ? { ...quote, status } : quote
    saveQuote(toSave)
    setQuote(toSave)
    if (andToast) showToast(andToast)
    return toSave
  }

  function handleSaveDraft() {
    handleSave("draft", "Draft saved")
    navigate(`/quotes/${quote.id}`)
  }

  async function handleSend() {
    if (!client?.email) {
      showToast("This client has no email address on file", "error")
      return
    }
    setSending(true)
    try {
      await sendQuoteByEmail(quote, client, business, templates.quoteHtml)
      handleSave("sent", "Quote sent to client")
      navigate(`/quotes/${quote.id}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send quote", "error")
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={isNew ? "Create Quote" : `Edit ${quote.number}`}
        subtitle="Fill in the details below — totals are calculated automatically."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "Edit" : "Preview"}
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={!canSave}>
              Save draft
            </Button>
            <Button variant="primary" onClick={handleSend} disabled={!canSave || sending}>
              {sending ? "Sending..." : "Send quote"}
            </Button>
          </>
        }
      />

      <div className="px-4 lg:px-8 pb-16">
        {showPreview ? (
          <InvoiceDocument
            invoice={{ ...quote, dueDate: quote.expiryDate }}
            client={client}
            business={business}
            kind="quote"
            dateLabel="Valid until"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Quote details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <Select value={quote.clientId} onChange={(e) => updateField("clientId", e.target.value)}>
                      <option value="">Select a client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.company}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Quote number</Label>
                    <Input value={quote.number} onChange={(e) => updateField("number", e.target.value)} />
                  </div>
                  <div>
                    <Label>Issue date</Label>
                    <Input
                      type="date"
                      value={quote.issueDate.slice(0, 10)}
                      onChange={(e) => updateField("issueDate", new Date(e.target.value).toISOString())}
                    />
                  </div>
                  <div>
                    <Label>Expiry date</Label>
                    <Input
                      type="date"
                      value={quote.expiryDate.slice(0, 10)}
                      onChange={(e) => updateField("expiryDate", new Date(e.target.value).toISOString())}
                    />
                  </div>
                  <div>
                    <Label>Payment terms</Label>
                    <Select value={quote.paymentTerms} onChange={(e) => updateField("paymentTerms", e.target.value)}>
                      <option>Due on receipt</option>
                      <option>Net 7</option>
                      <option>Net 14</option>
                      <option>Net 30</option>
                      <option>Net 60</option>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">Line items</h3>
                  <div className="flex gap-2">
                    {products.length > 0 && (
                      <Select
                        className="w-56"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) addProductItem(e.target.value)
                        }}
                      >
                        <option value="">+ Add from Products & Services</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    )}
                    <Button size="sm" variant="secondary" onClick={addItem}>
                      + Add item
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-slate-400 px-1">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit price</div>
                    <div className="col-span-1">Tax %</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  {quote.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-center">
                      <div className="col-span-2 sm:col-span-5">
                        <Input
                          placeholder="e.g. Brand identity design"
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
                          aria-label="Remove item"
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
                  <Label>Discount ({business.currency})</Label>
                  <Input
                    type="number"
                    min={0}
                    value={quote.discount}
                    onChange={(e) => updateField("discount", Number(e.target.value))}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    rows={3}
                    placeholder="This quote is valid for 14 days..."
                    value={quote.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                  />
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-5 space-y-3 sticky top-24">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Summary</h3>
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal, business.currency)} />
                <SummaryRow label="Tax" value={formatCurrency(tax, business.currency)} />
                <SummaryRow label="Discount" value={`-${formatCurrency(quote.discount, business.currency)}`} />
                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <span className="text-sm font-semibold text-slate-800">Total</span>
                  <span className="text-lg font-semibold text-slate-900">{formatCurrency(total, business.currency)}</span>
                </div>
                {!canSave && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                    Select a client and add at least one line item to save.
                  </p>
                )}
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
