import type { BusinessProfile, Client, LineItem } from "../types"
import { formatCurrency, formatDate, invoiceSubtotal, invoiceTax, invoiceTotal, lineTotal } from "../lib/calc"

interface DocumentLike {
  number: string
  issueDate: string
  dueDate: string
  items: LineItem[]
  discount: number
  notes: string
  paymentTerms: string
}

export default function InvoiceDocument({
  invoice,
  client,
  business,
  kind = "invoice",
  dateLabel = "Due date",
}: {
  invoice: DocumentLike
  client: Client | undefined
  business: BusinessProfile
  kind?: "invoice" | "quote"
  dateLabel?: string
}) {
  const subtotal = invoiceSubtotal(invoice.items)
  const tax = invoiceTax(invoice.items)
  const total = invoiceTotal(invoice)

  return (
    <div id="invoice-print" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold overflow-hidden">
            {business.logoDataUrl ? (
              <img src={business.logoDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              business.logoInitial
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{business.name}</p>
            <p className="text-sm text-slate-500 whitespace-pre-line">{business.address}</p>
            <p className="text-sm text-slate-500">{business.email}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {kind === "quote" ? "Quote" : "Invoice"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{invoice.number}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-8 border-b border-slate-100">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1.5">
            {kind === "quote" ? "Prepared for" : "Billed to"}
          </p>
          {client ? (
            <div className="text-sm text-slate-700">
              <p className="font-medium text-slate-900">{client.name}</p>
              <p>{client.company}</p>
              <p className="text-slate-500 whitespace-pre-line">{client.address}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No client selected</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1.5">Issue date</p>
          <p className="text-sm text-slate-700">{formatDate(invoice.issueDate)}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1.5 mt-3">{dateLabel}</p>
          <p className="text-sm text-slate-700">{formatDate(invoice.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1.5">Payment terms</p>
          <p className="text-sm text-slate-700">{invoice.paymentTerms || "—"}</p>
        </div>
      </div>

      <div className="py-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="font-medium py-2">Description</th>
              <th className="font-medium py-2 text-right w-16">Qty</th>
              <th className="font-medium py-2 text-right w-24">Price</th>
              <th className="font-medium py-2 text-right w-16">Tax</th>
              <th className="font-medium py-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="py-3 text-slate-700">{item.description || "—"}</td>
                <td className="py-3 text-right text-slate-500">{item.quantity}</td>
                <td className="py-3 text-right text-slate-500">{formatCurrency(item.unitPrice, business.currency)}</td>
                <td className="py-3 text-right text-slate-500">{item.taxRate}%</td>
                <td className="py-3 text-right font-medium text-slate-800">
                  {formatCurrency(lineTotal(item), business.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, business.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{business.taxLabel || "Tax"}</span>
              <span>{formatCurrency(tax, business.currency)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount, business.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total</span>
              <span>{formatCurrency(total, business.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1.5">Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
