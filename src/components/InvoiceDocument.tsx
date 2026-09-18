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

// Mirrors the look of the customizable PDF/email template (Settings ->
// Document Templates) so what freelancers and clients see on screen matches
// what gets sent and downloaded.
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
  const label = kind === "quote" ? "QUOTE" : "INVOICE"
  const heading = kind === "quote" ? "Quote" : "Invoice"

  return (
    <div
      id="invoice-print"
      className="max-w-3xl mx-auto bg-white rounded-[28px] border border-slate-200 shadow-[0_25px_70px_rgba(15,23,42,0.10)] overflow-hidden"
    >
      <div className="p-6 sm:p-10 bg-gradient-to-br from-blue-50/60 via-white to-white border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            {business.logoDataUrl ? (
              <img
                src={business.logoDataUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-1.5 shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg">
                {business.logoInitial}
              </div>
            )}
            <div>
              <p className="font-extrabold text-slate-900 tracking-tight">{business.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{business.email}</p>
              <p className="text-xs text-slate-500 whitespace-pre-line">{business.address}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold tracking-wide text-blue-600">
              {label}
            </span>
            <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-slate-900 mt-2 leading-none">
              {heading}
            </h2>
            <p className="text-xs text-slate-400 mt-2">#{invoice.number}</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-2">
              {kind === "quote" ? "Prepared for" : "Billed to"}
            </p>
            {client ? (
              <div className="text-sm text-slate-700">
                <p className="font-extrabold text-slate-900">{client.name}</p>
                <p className="mt-1">{client.company}</p>
                <p className="text-slate-500 whitespace-pre-line">{client.address}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No client selected</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-2">
              {kind === "quote" ? "Quote status" : "Payment status"}
            </p>
            <p className="text-sm font-extrabold text-slate-900">
              {kind === "quote" ? "Open proposal" : "Awaiting payment"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {kind === "quote" ? "Valid until" : "Due"} {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl border border-slate-200 overflow-hidden mb-8">
          <div className="p-4 sm:border-r border-b sm:border-b-0 border-slate-200">
            <p className="text-[10px] font-extrabold text-slate-400 mb-1">
              {kind === "quote" ? "Quote number" : "Invoice number"}
            </p>
            <p className="text-sm font-bold text-slate-800">#{invoice.number}</p>
          </div>
          <div className="p-4 sm:border-r border-b sm:border-b-0 border-slate-200">
            <p className="text-[10px] font-extrabold text-slate-400 mb-1">Issue date</p>
            <p className="text-sm font-bold text-slate-800">{formatDate(invoice.issueDate)}</p>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-extrabold text-slate-400 mb-1">{dateLabel}</p>
            <p className="text-sm font-bold text-slate-800">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <p className="text-sm font-extrabold text-slate-800 mb-3">Services & Items</p>
        <table className="w-full text-sm rounded-2xl border border-slate-200 overflow-hidden">
          <thead className="bg-slate-50">
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
              <th className="font-extrabold py-3 px-4">Description</th>
              <th className="font-extrabold py-3 px-4 text-right">Qty</th>
              <th className="font-extrabold py-3 px-4 text-right">Rate</th>
              <th className="font-extrabold py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-3.5 px-4 font-bold text-slate-800">{item.description || "—"}</td>
                <td className="py-3.5 px-4 text-right text-slate-600">{item.quantity}</td>
                <td className="py-3.5 px-4 text-right text-slate-600">
                  {formatCurrency(item.unitPrice, business.currency)}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-600">
                  {formatCurrency(lineTotal(item), business.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 h-fit">
            <p className="text-[11px] font-extrabold text-slate-800 mb-2">Notes & Terms</p>
            <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">
              {invoice.notes || "—"}
              {invoice.paymentTerms ? `\n${invoice.paymentTerms}` : ""}
            </p>
          </div>

          <div className="rounded-[20px] bg-slate-900 text-white p-5 shadow-lg">
            <div className="flex justify-between text-xs text-slate-400 py-1.5">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, business.currency)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 py-1.5">
              <span>{business.taxLabel || "Tax"}</span>
              <span>{formatCurrency(tax, business.currency)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-xs text-red-300 py-1.5">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount, business.currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-end mt-3 pt-4 border-t border-white/10">
              <span className="text-xs text-slate-400">Total</span>
              <span className="text-2xl font-extrabold tracking-tight">{formatCurrency(total, business.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
