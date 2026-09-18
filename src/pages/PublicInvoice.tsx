import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import InvoiceDocument from "../components/InvoiceDocument"
import { Button } from "../components/ui"
import { fetchPublicInvoice, type PublicInvoiceData } from "../lib/publicInvoice"
import { DEFAULT_INVOICE_TEMPLATE, renderInvoiceTemplate } from "../lib/documentTemplates"
import { downloadHtmlAsPdf } from "../lib/pdf"

type ViewState = "loading" | "ready" | "not-found" | "error"

export default function PublicInvoice() {
  const { id } = useParams()
  const [state, setState] = useState<ViewState>("loading")
  const [data, setData] = useState<PublicInvoiceData | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!id) {
      setState("not-found")
      return
    }
    let cancelled = false
    fetchPublicInvoice(id)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setState("ready")
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong")
        setState(err instanceof Error && err.message.toLowerCase().includes("not found") ? "not-found" : "error")
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (state === "loading") {
    return (
      <PublicShell>
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
      </PublicShell>
    )
  }

  if (state === "not-found") {
    return (
      <PublicShell>
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <h1 className="text-lg font-semibold text-slate-900">Invoice not found</h1>
          <p className="mt-2 text-sm text-slate-500">This link may be invalid or the invoice may have been removed.</p>
        </div>
      </PublicShell>
    )
  }

  if (state === "error" || !data) {
    return (
      <PublicShell>
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">{errorMessage || "Please try refreshing the page."}</p>
        </div>
      </PublicShell>
    )
  }

  const { invoice, client, business } = data

  async function handleDownload() {
    setDownloading(true)
    try {
      const html = renderInvoiceTemplate(data!.templateHtml ?? DEFAULT_INVOICE_TEMPLATE, data!.invoice, data!.client, data!.business)
      await downloadHtmlAsPdf(html, `Invoice-${data!.invoice.number}.pdf`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate PDF")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
              Invoice from {business.name || "your service provider"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Invoice {invoice.number}</h1>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto justify-center" onClick={handleDownload} disabled={downloading}>
            {downloading ? "Preparing..." : "Download PDF"}
          </Button>
        </div>

        {invoice.status === "paid" && (
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center sm:text-left">
            <p className="text-sm font-semibold text-emerald-700">✓ This invoice has been paid. Thank you!</p>
          </div>
        )}

        <InvoiceDocument invoice={invoice} client={client} business={business} kind="invoice" dateLabel="Due date" />
      </div>
    </PublicShell>
  )
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>
}
