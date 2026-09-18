import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import InvoiceDocument from "../components/InvoiceDocument"
import { Button } from "../components/ui"
import { approvePublicQuote, declinePublicQuote, fetchPublicQuote, type PublicQuoteData } from "../lib/publicQuote"
import { formatDate } from "../lib/calc"

type ViewState = "loading" | "ready" | "not-found" | "error"

export default function PublicQuote() {
  const { id } = useParams()
  const [state, setState] = useState<ViewState>("loading")
  const [data, setData] = useState<PublicQuoteData | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [responding, setResponding] = useState<"approve" | "decline" | null>(null)
  const [confirmDecline, setConfirmDecline] = useState(false)

  useEffect(() => {
    if (!id) {
      setState("not-found")
      return
    }
    let cancelled = false
    fetchPublicQuote(id)
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

  async function handleApprove() {
    if (!id) return
    setResponding("approve")
    try {
      const result = await approvePublicQuote(id)
      setData(result)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to approve quote")
    } finally {
      setResponding(null)
    }
  }

  async function handleDecline() {
    if (!id) return
    setResponding("decline")
    try {
      const result = await declinePublicQuote(id)
      setData(result)
      setConfirmDecline(false)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to decline quote")
    } finally {
      setResponding(null)
    }
  }

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
          <h1 className="text-lg font-semibold text-slate-900">Quote not found</h1>
          <p className="mt-2 text-sm text-slate-500">This link may be invalid or the quote may have been removed.</p>
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

  const { quote, client, business } = data

  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Quote from {business.name || "your service provider"}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Quote {quote.number}</h1>
        </div>

        {quote.status === "sent" && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-sm text-slate-600 mb-4">
              {client?.name ? `Hi ${client.name}, please` : "Please"} review the quote below and let us know if you'd
              like to proceed.
            </p>
            {errorMessage && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>}
            {!confirmDecline ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto justify-center"
                  onClick={handleApprove}
                  disabled={responding !== null}
                >
                  {responding === "approve" ? "Approving..." : "Approve quote"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto justify-center"
                  onClick={() => setConfirmDecline(true)}
                  disabled={responding !== null}
                >
                  Reject quote
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm text-red-700 mb-3">Are you sure you want to reject this quote?</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="danger"
                    className="w-full sm:w-auto justify-center"
                    onClick={handleDecline}
                    disabled={responding !== null}
                  >
                    {responding === "decline" ? "Rejecting..." : "Yes, reject it"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto justify-center"
                    onClick={() => setConfirmDecline(false)}
                    disabled={responding !== null}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {quote.status === "accepted" && (
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center sm:text-left">
            <p className="text-sm font-semibold text-emerald-700">
              ✓ You approved this quote{quote.respondedAt ? ` on ${formatDate(quote.respondedAt)}` : ""}.
            </p>
          </div>
        )}

        {quote.status === "declined" && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-center sm:text-left">
            <p className="text-sm font-semibold text-red-700">
              You rejected this quote{quote.respondedAt ? ` on ${formatDate(quote.respondedAt)}` : ""}.
            </p>
          </div>
        )}

        {quote.status === "converted" && (
          <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50 p-5 text-center sm:text-left">
            <p className="text-sm font-semibold text-violet-700">This quote was approved and converted into an invoice.</p>
          </div>
        )}

        <InvoiceDocument
          invoice={{ ...quote, dueDate: quote.expiryDate }}
          client={client}
          business={business}
          kind="quote"
          dateLabel="Valid until"
        />
      </div>
    </PublicShell>
  )
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>
}
