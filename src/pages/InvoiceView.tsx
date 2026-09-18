import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, StatusBadge } from "../components/ui"
import InvoiceDocument from "../components/InvoiceDocument"
import { effectiveStatus } from "../lib/calc"
import { sendInvoiceByEmail, sendInvoiceReminder } from "../lib/documentEmail"
import { renderInvoiceTemplate } from "../lib/documentTemplates"
import { downloadHtmlAsPdf } from "../lib/pdf"

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, quotes, getClient, business, templates, markInvoiceStatus, duplicateInvoice, deleteInvoice } = useData()
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [reminding, setReminding] = useState(false)

  const invoice = invoices.find((inv) => inv.id === id)

  if (!invoice) {
    return (
      <div className="px-4 lg:px-8 py-10">
        <p className="text-slate-500">Invoice not found.</p>
        <Button className="mt-4" onClick={() => navigate("/invoices")}>
          Back to invoices
        </Button>
      </div>
    )
  }

  const client = getClient(invoice.clientId)
  const status = effectiveStatus(invoice)
  const sourceQuote = invoice.quoteId ? quotes.find((q) => q.id === invoice.quoteId) : undefined

  async function handleSend() {
    if (!invoice) return
    if (!client?.email) {
      showToast("This client has no email address on file", "error")
      return
    }
    setSending(true)
    try {
      await sendInvoiceByEmail(invoice, client, business)
      markInvoiceStatus(invoice.id, "sent")
      showToast(`Invoice ${invoice.number} sent to ${client.email}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send invoice", "error")
    } finally {
      setSending(false)
    }
  }

  async function handleRemind() {
    if (!invoice || !client?.email) return
    setReminding(true)
    try {
      await sendInvoiceReminder(invoice, client, business)
      showToast(`Reminder sent to ${client.email}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send reminder", "error")
    } finally {
      setReminding(false)
    }
  }

  function handleMarkPaid() {
    if (!invoice) return
    markInvoiceStatus(invoice.id, "paid")
    showToast(`Marked ${invoice.number} as paid`)
  }

  function handleDuplicate() {
    if (!invoice) return
    const copy = duplicateInvoice(invoice.id)
    if (copy) {
      showToast(`Duplicated as ${copy.number}`)
      navigate(`/invoices/${copy.id}/edit`)
    }
  }

  async function handleDownload() {
    if (!invoice) return
    setDownloading(true)
    try {
      const html = renderInvoiceTemplate(templates.invoiceHtml, invoice, client, business)
      await downloadHtmlAsPdf(html, `Invoice-${invoice.number}.pdf`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate PDF", "error")
    } finally {
      setDownloading(false)
    }
  }

  function handleDelete() {
    if (!invoice) return
    if (confirm(`Delete invoice ${invoice.number}? This cannot be undone.`)) {
      deleteInvoice(invoice.id)
      showToast("Invoice deleted", "info")
      navigate("/invoices")
    }
  }

  const publicUrl = `${window.location.origin}/i/${invoice.id}`

  function handleCopyLink() {
    navigator.clipboard
      .writeText(publicUrl)
      .then(() => showToast("Public link copied"))
      .catch(() => showToast("Couldn't copy link", "error"))
  }

  return (
    <div>
      <PageHeader
        title={invoice.number}
        subtitle={client ? `${client.name} — ${client.company}` : "No client"}
        actions={
          <>
            <StatusBadge status={status} />
            <Button variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
              Edit
            </Button>
            <Button variant="secondary" onClick={handleDuplicate}>
              Duplicate
            </Button>
            <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Preparing..." : "Download PDF"}
            </Button>
            {status === "draft" && (
              <Button variant="primary" onClick={handleSend} disabled={sending}>
                {sending ? "Sending..." : "Send invoice"}
              </Button>
            )}
            {(status === "sent" || status === "overdue") && (
              <>
                <Button variant="secondary" onClick={handleRemind} disabled={reminding}>
                  {reminding ? "Sending..." : "Remind client"}
                </Button>
                <Button variant="primary" onClick={handleMarkPaid}>
                  Mark as paid
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="px-4 lg:px-8 pb-16">
        {sourceQuote && (
          <div className="max-w-3xl mx-auto mb-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
            Created from{" "}
            <button className="font-medium underline" onClick={() => navigate(`/quotes/${sourceQuote.id}`)}>
              quote {sourceQuote.number}
            </button>
            .
          </div>
        )}
        {status !== "draft" && (
          <div className="max-w-3xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="flex-1 truncate text-xs text-slate-500">
              Public link: <span className="text-slate-700">{publicUrl}</span>
            </p>
            <Button size="sm" variant="secondary" onClick={handleCopyLink}>
              Copy link
            </Button>
          </div>
        )}
        <InvoiceDocument invoice={invoice} client={client} business={business} />
        <div className="max-w-3xl mx-auto mt-4 flex justify-end">
          <button onClick={handleDelete} className="text-xs text-slate-400 hover:text-red-500">
            Delete invoice
          </button>
        </div>
      </div>
    </div>
  )
}
