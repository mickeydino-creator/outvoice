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
        <p className="text-slate-500">החשבונית לא נמצאה.</p>
        <Button className="mt-4" onClick={() => navigate("/invoices")}>
          חזרה לחשבוניות
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
      showToast("ללקוח זה לא שמורה כתובת אימייל", "error")
      return
    }
    setSending(true)
    try {
      await sendInvoiceByEmail(invoice, client, business)
      markInvoiceStatus(invoice.id, "sent")
      showToast(`חשבונית ${invoice.number} נשלחה אל ${client.email}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "שליחת החשבונית נכשלה", "error")
    } finally {
      setSending(false)
    }
  }

  async function handleRemind() {
    if (!invoice || !client?.email) return
    setReminding(true)
    try {
      await sendInvoiceReminder(invoice, client, business)
      showToast(`תזכורת נשלחה אל ${client.email}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "שליחת התזכורת נכשלה", "error")
    } finally {
      setReminding(false)
    }
  }

  function handleMarkPaid() {
    if (!invoice) return
    markInvoiceStatus(invoice.id, "paid")
    showToast(`חשבונית ${invoice.number} סומנה כשולמה`)
  }

  function handleDuplicate() {
    if (!invoice) return
    const copy = duplicateInvoice(invoice.id)
    if (copy) {
      showToast(`נוצר עותק: ${copy.number}`)
      navigate(`/invoices/${copy.id}/edit`)
    }
  }

  async function handleDownload() {
    if (!invoice) return
    setDownloading(true)
    try {
      const html = renderInvoiceTemplate(templates.invoiceHtml, invoice, client, business)
      await downloadHtmlAsPdf(html, `חשבונית-${invoice.number}.pdf`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "יצירת קובץ ה-PDF נכשלה", "error")
    } finally {
      setDownloading(false)
    }
  }

  function handleDelete() {
    if (!invoice) return
    if (confirm(`למחוק את חשבונית ${invoice.number}? לא ניתן לבטל פעולה זו.`)) {
      deleteInvoice(invoice.id)
      showToast("החשבונית נמחקה", "info")
      navigate("/invoices")
    }
  }

  const publicUrl = `${window.location.origin}/i/${invoice.id}`

  function handleCopyLink() {
    navigator.clipboard
      .writeText(publicUrl)
      .then(() => showToast("הקישור ללקוח הועתק"))
      .catch(() => showToast("לא ניתן להעתיק את הקישור", "error"))
  }

  return (
    <div>
      <PageHeader
        title={invoice.number}
        subtitle={client ? `${client.name}${client.company ? ` - ${client.company}` : ""}` : "ללא לקוח"}
        actions={
          <>
            <StatusBadge status={status} />
            <Button variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
              עריכה
            </Button>
            <Button variant="secondary" onClick={handleDuplicate}>
              שכפול
            </Button>
            <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
              {downloading ? "בהכנה..." : "הורדת PDF"}
            </Button>
            {status === "draft" && (
              <Button variant="primary" onClick={handleSend} disabled={sending}>
                {sending ? "בשליחה..." : "שליחת חשבונית"}
              </Button>
            )}
            {(status === "sent" || status === "overdue") && (
              <>
                <Button variant="secondary" onClick={handleRemind} disabled={reminding}>
                  {reminding ? "בשליחה..." : "שליחת תזכורת"}
                </Button>
                <Button variant="primary" onClick={handleMarkPaid}>
                  סימון כשולמה
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="px-4 lg:px-8 pb-16">
        {sourceQuote && (
          <div className="max-w-3xl mx-auto mb-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
            נוצרה מתוך{" "}
            <button className="font-medium underline" onClick={() => navigate(`/quotes/${sourceQuote.id}`)}>
              הצעת מחיר {sourceQuote.number}
            </button>
            .
          </div>
        )}
        {status !== "draft" && (
          <div className="max-w-3xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="flex-1 truncate text-xs text-slate-500">
              קישור ללקוח: <span className="text-slate-700">{publicUrl}</span>
            </p>
            <Button size="sm" variant="secondary" onClick={handleCopyLink}>
              העתקת קישור
            </Button>
          </div>
        )}
        <InvoiceDocument invoice={invoice} client={client} business={business} />
        <div className="max-w-3xl mx-auto mt-4 flex justify-end">
          <button onClick={handleDelete} className="text-xs text-slate-400 hover:text-red-500">
            מחיקת החשבונית
          </button>
        </div>
      </div>
    </div>
  )
}
