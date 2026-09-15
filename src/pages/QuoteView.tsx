import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, QuoteStatusBadge } from "../components/ui"
import InvoiceDocument from "../components/InvoiceDocument"
import { sendQuoteByEmail } from "../lib/documentEmail"

export default function QuoteView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { quotes, getClient, business, templates, markQuoteStatus, duplicateQuote, deleteQuote, convertQuoteToInvoice } = useData()
  const { showToast } = useToast()
  const [sending, setSending] = useState(false)

  const quote = quotes.find((q) => q.id === id)

  if (!quote) {
    return (
      <div className="px-4 lg:px-8 py-10">
        <p className="text-slate-500">Quote not found.</p>
        <Button className="mt-4" onClick={() => navigate("/quotes")}>
          Back to quotes
        </Button>
      </div>
    )
  }

  const client = getClient(quote.clientId)

  async function handleSend() {
    if (!quote) return
    if (!client?.email) {
      showToast("This client has no email address on file", "error")
      return
    }
    setSending(true)
    try {
      await sendQuoteByEmail(quote, client, business, templates.quoteHtml)
      markQuoteStatus(quote.id, "sent")
      showToast(`Quote ${quote.number} sent to ${client.email}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send quote", "error")
    } finally {
      setSending(false)
    }
  }

  function handleAccept() {
    if (!quote) return
    markQuoteStatus(quote.id, "accepted")
    showToast(`Marked ${quote.number} as accepted`)
  }

  function handleDecline() {
    if (!quote) return
    markQuoteStatus(quote.id, "declined")
    showToast("Quote marked as declined", "info")
  }

  function handleDuplicate() {
    if (!quote) return
    const copy = duplicateQuote(quote.id)
    if (copy) {
      showToast(`Duplicated as ${copy.number}`)
      navigate(`/quotes/${copy.id}/edit`)
    }
  }

  function handleConvert() {
    if (!quote) return
    const invoice = convertQuoteToInvoice(quote.id)
    if (invoice) {
      showToast(`Converted to invoice ${invoice.number}`)
      navigate(`/invoices/${invoice.id}`)
    }
  }

  function handleDownload() {
    showToast("Preparing PDF...", "info")
    setTimeout(() => window.print(), 300)
  }

  function handleDelete() {
    if (!quote) return
    if (confirm(`Delete quote ${quote.number}? This cannot be undone.`)) {
      deleteQuote(quote.id)
      showToast("Quote deleted", "info")
      navigate("/quotes")
    }
  }

  return (
    <div>
      <PageHeader
        title={quote.number}
        subtitle={client ? `${client.name} — ${client.company}` : "No client"}
        actions={
          <>
            <QuoteStatusBadge status={quote.status} />
            {quote.status !== "converted" && (
              <Button variant="secondary" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                Edit
              </Button>
            )}
            <Button variant="secondary" onClick={handleDuplicate}>
              Duplicate
            </Button>
            <Button variant="secondary" onClick={handleDownload}>
              Download PDF
            </Button>
            {quote.status === "draft" && (
              <Button variant="primary" onClick={handleSend} disabled={sending}>
                {sending ? "Sending..." : "Send quote"}
              </Button>
            )}
            {quote.status === "sent" && (
              <>
                <Button variant="secondary" onClick={handleDecline}>
                  Mark declined
                </Button>
                <Button variant="secondary" onClick={handleAccept}>
                  Mark accepted
                </Button>
              </>
            )}
            {(quote.status === "sent" || quote.status === "accepted") && (
              <Button variant="primary" onClick={handleConvert}>
                Convert to Invoice
              </Button>
            )}
          </>
        }
      />

      <div className="px-4 lg:px-8 pb-16">
        {quote.convertedInvoiceId && (
          <div className="max-w-3xl mx-auto mb-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
            This quote was converted to{" "}
            <button className="font-medium underline" onClick={() => navigate(`/invoices/${quote.convertedInvoiceId}`)}>
              an invoice
            </button>
            .
          </div>
        )}
        <InvoiceDocument
          invoice={{ ...quote, dueDate: quote.expiryDate }}
          client={client}
          business={business}
          kind="quote"
          dateLabel="Valid until"
        />
        <div className="max-w-3xl mx-auto mt-4 flex justify-end">
          <button onClick={handleDelete} className="text-xs text-slate-400 hover:text-red-500">
            Delete quote
          </button>
        </div>
      </div>
    </div>
  )
}
