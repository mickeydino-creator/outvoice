import { useNavigate, useParams } from "react-router-dom"
import { useData } from "../store/DataContext"
import { useToast } from "../store/ToastContext"
import PageHeader from "../components/PageHeader"
import { Button, StatusBadge } from "../components/ui"
import InvoiceDocument from "../components/InvoiceDocument"
import { effectiveStatus } from "../lib/calc"

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, getClient, business, markInvoiceStatus, duplicateInvoice, deleteInvoice } = useData()
  const { showToast } = useToast()

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

  function handleSend() {
    if (!invoice) return
    markInvoiceStatus(invoice.id, "sent")
    showToast(`Invoice ${invoice.number} sent to ${client?.email ?? "client"}`)
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

  function handleDownload() {
    showToast("Preparing PDF...", "info")
    setTimeout(() => window.print(), 300)
  }

  function handleDelete() {
    if (!invoice) return
    if (confirm(`Delete invoice ${invoice.number}? This cannot be undone.`)) {
      deleteInvoice(invoice.id)
      showToast("Invoice deleted", "info")
      navigate("/invoices")
    }
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
            <Button variant="secondary" onClick={handleDownload}>
              Download PDF
            </Button>
            {status === "draft" && (
              <Button variant="primary" onClick={handleSend}>
                Send invoice
              </Button>
            )}
            {(status === "sent" || status === "overdue") && (
              <Button variant="primary" onClick={handleMarkPaid}>
                Mark as paid
              </Button>
            )}
          </>
        }
      />

      <div className="px-4 lg:px-8 pb-16">
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
