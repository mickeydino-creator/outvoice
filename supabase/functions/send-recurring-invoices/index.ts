// Supabase Edge Function: send-recurring-invoices
//
// Meant to run every few minutes on a schedule (see the comment at the bottom
// of supabase/migrations/0005_recurring_invoices.sql). For every active
// recurring invoice whose next_run_at has passed, it:
//   1. claims the run by moving next_run_at to the following occurrence,
//      conditional on next_run_at still holding the value it read, so
//      overlapping or repeated runs never send the same occurrence twice;
//   2. creates a real invoice from the saved items with the next invoice
//      number;
//   3. emails the client a link to the public invoice page and marks the
//      invoice as sent. If the email can't be sent, the invoice stays a draft
//      and the error is saved on the schedule so the app can show it.
//
// If the function was down for a while, a schedule sends once for the missed
// period and then continues from the next future occurrence, rather than
// sending a burst of back-dated invoices.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendResendEmail } from "../_shared/resend.ts"
import { renderEmailShell, escapeHtml } from "../_shared/emailTemplate.ts"
import { nextOccurrence, paymentTermsDays, type RecurrenceRule, type RecurrenceUnit } from "../_shared/recurrence.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "InvoiceFlow <onboarding@resend.dev>"
const APP_URL = Deno.env.get("APP_URL") ?? ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function ruleFromRow(row: any): RecurrenceRule {
  return {
    startDate: String(row.start_date),
    sendTime: String(row.send_time ?? "09:00").slice(0, 5),
    timezone: row.timezone || "UTC",
    unit: row.frequency as RecurrenceUnit,
    interval: Number(row.interval_count) || 1,
    endDate: row.end_date ?? null,
  }
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("he-IL", { style: "currency", currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatDisplayDate(date: Date, timeZone: string) {
  try {
    return date.toLocaleDateString("he-IL", { timeZone, year: "numeric", month: "short", day: "numeric" })
  } catch {
    return date.toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric" })
  }
}

function invoiceTotal(items: any[], discount: number) {
  const subtotal = (items ?? []).reduce((sum, it) => sum + Number(it.quantity ?? 0) * Number(it.unitPrice ?? 0), 0)
  const tax = (items ?? []).reduce(
    (sum, it) => sum + Number(it.quantity ?? 0) * Number(it.unitPrice ?? 0) * (Number(it.taxRate ?? 0) / 100),
    0
  )
  return Math.max(0, subtotal + tax - Number(discount ?? 0))
}

// Same numbering rule as the app (nextInvoiceNumber in DataContext): highest
// numeric part among the user's invoices + 1, starting after 1000.
async function nextInvoiceNumber(admin: any, userId: string, prefix: string) {
  const { data, error } = await admin.from("invoices").select("number").eq("user_id", userId)
  if (error) throw error
  const nums = (data ?? [])
    .map((r: any) => parseInt(String(r.number).replace(/\D/g, ""), 10))
    .filter((n: number) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 1000
  return `${prefix || "INV"}-${max + 1}`
}

// Mirrors buildDocumentEmail in src/lib/emailLayout.ts so a recurring invoice
// looks exactly like one sent by hand.
function buildInvoiceEmail(params: { businessName: string; clientName: string; number: string; total: string; dueDate: string; viewUrl?: string }) {
  const { businessName, clientName, number, total, dueDate, viewUrl } = params
  const safeClient = clientName ? ` ${escapeHtml(clientName)}` : ""
  const safeBusiness = escapeHtml(businessName || "נותן השירות שלך")
  return renderEmailShell({
    businessName,
    eyebrow: "חשבונית",
    heading: `חשבונית ${number}`,
    bodyHtml: `<p style="margin:0;">שלום${safeClient},</p><p style="margin:8px 0 0;">קיבלת חשבונית חדשה מ-${safeBusiness}. אפשר לצפות בחשבונית ולהוריד אותה בקישור הבא.</p>`,
    infoRows: [
      { label: "לקוח", value: clientName },
      { label: "תאריך לתשלום", value: dueDate },
      { label: "סה״כ", value: total, emphasis: true },
    ],
    primaryButton: viewUrl ? { label: "לצפייה בחשבונית", url: viewUrl } : undefined,
  })
}

function withNewItemIds(items: any[]) {
  return (items ?? []).map((it) => ({ ...it, id: crypto.randomUUID() }))
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const results = { due: 0, created: 0, sent: 0, skipped: 0, errors: [] as string[] }

  try {
    const now = new Date()
    const { data: schedules, error } = await admin
      .from("recurring_invoices")
      .select("*")
      .eq("active", true)
      .not("next_run_at", "is", null)
      .lte("next_run_at", now.toISOString())

    if (error) throw error
    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const userIds = [...new Set(schedules.map((s) => s.user_id))]
    const clientIds = [...new Set(schedules.map((s) => s.client_id).filter(Boolean))]
    const [{ data: businessRows }, { data: clientRows }] = await Promise.all([
      admin.from("business_profile").select("*").in("user_id", userIds),
      clientIds.length ? admin.from("clients").select("*").in("id", clientIds) : Promise.resolve({ data: [] as any[] }),
    ])
    const businessByUser = new Map((businessRows ?? []).map((r) => [r.user_id, r]))
    const clientById = new Map((clientRows ?? []).map((r) => [r.id, r]))

    for (const schedule of schedules) {
      results.due += 1
      const scheduledAt = new Date(schedule.next_run_at)
      const rule = ruleFromRow(schedule)
      const upcoming = nextOccurrence(rule, new Date(Math.max(now.getTime(), scheduledAt.getTime())))

      // Claim this occurrence. Zero rows back means another run got it first.
      const { data: claimed, error: claimError } = await admin
        .from("recurring_invoices")
        .update({
          next_run_at: upcoming ? upcoming.toISOString() : null,
          active: upcoming !== null,
          last_run_at: now.toISOString(),
          run_count: Number(schedule.run_count ?? 0) + 1,
        })
        .eq("id", schedule.id)
        .eq("next_run_at", schedule.next_run_at)
        .select("id")
        .maybeSingle()

      if (claimError) {
        results.errors.push(`schedule ${schedule.id}: ${claimError.message}`)
        continue
      }
      if (!claimed) {
        results.skipped += 1
        continue
      }

      const business = businessByUser.get(schedule.user_id)
      const client = schedule.client_id ? clientById.get(schedule.client_id) : undefined
      const timezone = rule.timezone

      try {
        const issueDate = now
        const dueDate = new Date(issueDate.getTime() + paymentTermsDays(schedule.payment_terms) * 86_400_000)
        const number = await nextInvoiceNumber(admin, schedule.user_id, business?.invoice_prefix ?? "INV")
        const invoiceId = crypto.randomUUID()
        const items = withNewItemIds(schedule.items)

        const { error: insertError } = await admin.from("invoices").insert({
          id: invoiceId,
          user_id: schedule.user_id,
          number,
          client_id: schedule.client_id,
          issue_date: issueDate.toISOString(),
          due_date: dueDate.toISOString(),
          items,
          discount: schedule.discount,
          notes: schedule.notes,
          payment_terms: schedule.payment_terms,
          status: "draft",
          created_at: now.toISOString(),
          recurring_id: schedule.id,
        })
        if (insertError) throw insertError
        results.created += 1

        let sendError: string | null = null
        if (!client?.email) sendError = "ללקוח לא שמורה כתובת אימייל. החשבונית נשמרה כטיוטה."
        else if (!RESEND_API_KEY) sendError = "שירות האימייל לא הוגדר (חסר RESEND_API_KEY). החשבונית נשמרה כטיוטה."

        if (!sendError) {
          const html = buildInvoiceEmail({
            businessName: business?.name ?? "",
            clientName: client.name ?? "",
            number,
            total: formatCurrency(invoiceTotal(items, schedule.discount), business?.currency ?? "ILS"),
            dueDate: formatDisplayDate(dueDate, timezone),
            viewUrl: APP_URL ? `${APP_URL}/i/${invoiceId}` : undefined,
          })
          const sendResult = await sendResendEmail(RESEND_API_KEY!, FROM_EMAIL, {
            to: client.email,
            subject: `חשבונית ${number} מ-${business?.name ?? ""}`.trim(),
            html,
          })
          if (sendResult.ok) {
            await admin.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoiceId)
            results.sent += 1
          } else {
            sendError = `שליחת האימייל נכשלה: ${sendResult.error ?? ""}. החשבונית נשמרה כטיוטה.`
          }
        }

        await admin
          .from("recurring_invoices")
          .update({ last_invoice_id: invoiceId, last_error: sendError })
          .eq("id", schedule.id)
        if (sendError) results.errors.push(`schedule ${schedule.id}: ${sendError}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await admin.from("recurring_invoices").update({ last_error: `יצירת החשבונית נכשלה: ${message}` }).eq("id", schedule.id)
        results.errors.push(`schedule ${schedule.id}: ${message}`)
      }
    }

    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(
      JSON.stringify({ ...results, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
