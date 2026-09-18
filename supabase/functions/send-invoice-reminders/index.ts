// Supabase Edge Function: send-invoice-reminders
//
// Meant to be triggered on a schedule (Supabase Cron / pg_cron, see the
// comment at the bottom of supabase/migrations/0004_quote_approval_and_reminders.sql).
// For every unpaid, sent invoice across all users, checks each user's
// reminder settings (with sensible defaults when unset) and — respecting
// their business timezone — sends a reminder email to the client when a
// configured offset (days before / on / after the due date) lands on today,
// and only if that exact reminder hasn't already been sent (enforced by a
// unique constraint on invoice_reminders, so this is safe to run more than
// once and safe against concurrent runs).
//
// Never touches paid or draft invoices, and never re-sends a reminder whose
// (invoice_id, reminder_key) pair already has a log row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendResendEmail } from "../_shared/resend.ts"
import { renderEmailShell, escapeHtml } from "../_shared/emailTemplate.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "InvoiceFlow <onboarding@resend.dev>"
const APP_URL = Deno.env.get("APP_URL") ?? ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DEFAULT_SETTINGS = { enabled: true, days_before: [3], on_due_date: true, days_after: [3, 7], message: "" }

function dateKeyInTimezone(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which is exactly what we need to compare
  // calendar days without DST arithmetic headaches.
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number)
  const [ty, tm, td] = toKey.split("-").map(Number)
  const from = Date.UTC(fy, fm - 1, fd)
  const to = Date.UTC(ty, tm - 1, td)
  return Math.round((to - from) / 86_400_000)
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
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

function buildReminderEmail(params: {
  customMessage: string
  clientName: string
  businessName: string
  businessLogoDataUrl?: string
  invoiceNumber: string
  total: string
  dueDate: string
  isOverdue: boolean
  viewUrl?: string
}) {
  const { customMessage, clientName, businessName, businessLogoDataUrl, invoiceNumber, total, dueDate, isOverdue, viewUrl } = params

  const rendered = customMessage
    ? customMessage
        .replace(/\{\{\s*client_name\s*\}\}/gi, clientName)
        .replace(/\{\{\s*business_name\s*\}\}/gi, businessName)
        .replace(/\{\{\s*invoice_number\s*\}\}/gi, invoiceNumber)
        .replace(/\{\{\s*total\s*\}\}/gi, total)
        .replace(/\{\{\s*due_date\s*\}\}/gi, dueDate)
    : `Hi ${clientName}, this is a reminder that invoice #${invoiceNumber} for ${total} ${
        isOverdue ? "was due on" : "is due on"
      } ${dueDate}${isOverdue ? " and is now overdue" : ""}.`

  const bodyHtml = escapeHtml(rendered).replace(/\n/g, "<br/>")

  return renderEmailShell({
    businessName,
    businessLogoDataUrl,
    eyebrow: "Payment reminder",
    heading: `Invoice #${invoiceNumber}`,
    bodyHtml: `<p style="margin:0;">${bodyHtml}</p>`,
    infoRows: [
      { label: isOverdue ? "Was due" : "Due date", value: dueDate },
      { label: "Total", value: total, emphasis: true },
    ],
    primaryButton: viewUrl ? { label: "View invoice", url: viewUrl } : undefined,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  const results = { checked: 0, sent: 0, skipped: 0, errors: [] as string[] }

  try {
    // Only ever consider invoices that are sent (never draft) and not paid —
    // "paid" invoices are a different status entirely so they're excluded by
    // this filter alone, and stay excluded permanently once marked paid.
    const { data: invoices, error: invoicesError } = await admin
      .from("invoices")
      .select("*")
      .eq("status", "sent")

    if (invoicesError) throw invoicesError

    if (!invoices || invoices.length === 0) {
      return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const userIds = [...new Set(invoices.map((inv) => inv.user_id).filter(Boolean))]
    const clientIds = [...new Set(invoices.map((inv) => inv.client_id).filter(Boolean))]

    const [{ data: settingsRows }, { data: businessRows }, { data: clientRows }] = await Promise.all([
      admin.from("invoice_reminder_settings").select("*").in("user_id", userIds),
      admin.from("business_profile").select("*").in("user_id", userIds),
      admin.from("clients").select("*").in("id", clientIds),
    ])

    const settingsByUser = new Map((settingsRows ?? []).map((r) => [r.user_id, r]))
    const businessByUser = new Map((businessRows ?? []).map((r) => [r.user_id, r]))
    const clientById = new Map((clientRows ?? []).map((r) => [r.id, r]))

    for (const invoice of invoices) {
      results.checked += 1
      const settings = settingsByUser.get(invoice.user_id) ?? DEFAULT_SETTINGS
      if (!settings.enabled) {
        results.skipped += 1
        continue
      }

      const business = businessByUser.get(invoice.user_id)
      const client = clientById.get(invoice.client_id)
      if (!client?.email) {
        results.skipped += 1
        continue
      }

      const timezone = business?.timezone || "UTC"
      const todayKey = dateKeyInTimezone(new Date(), timezone)
      const dueKey = dateKeyInTimezone(new Date(invoice.due_date), timezone)
      const diff = daysBetween(todayKey, dueKey) // positive = due in the future, 0 = today, negative = overdue

      let reminderKey: string | null = null
      if (diff === 0 && settings.on_due_date) {
        reminderKey = "due"
      } else if (diff > 0 && (settings.days_before ?? []).includes(diff)) {
        reminderKey = `before_${diff}`
      } else if (diff < 0 && (settings.days_after ?? []).includes(-diff)) {
        reminderKey = `after_${-diff}`
      }

      if (!reminderKey) {
        results.skipped += 1
        continue
      }

      // Atomically claim this reminder: if the row already exists, this
      // insert affects zero rows and we skip — that's the whole
      // duplicate-prevention mechanism.
      const { data: inserted, error: insertError } = await admin
        .from("invoice_reminders")
        .insert({ user_id: invoice.user_id, invoice_id: invoice.id, reminder_key: reminderKey })
        .select("id")
        .maybeSingle()

      if (insertError) {
        // Unique violation just means it was already sent — not a real error.
        if (!String(insertError.message ?? "").includes("duplicate")) {
          results.errors.push(`invoice ${invoice.id}: ${insertError.message}`)
        }
        results.skipped += 1
        continue
      }
      if (!inserted) {
        results.skipped += 1
        continue
      }

      if (!RESEND_API_KEY) {
        results.skipped += 1
        continue
      }

      const total = invoiceTotal(invoice.items, invoice.discount)
      const html = buildReminderEmail({
        customMessage: settings.message ?? "",
        clientName: client.name ?? "there",
        businessName: business?.name ?? "Your service provider",
        businessLogoDataUrl: business?.logo_data_url ?? undefined,
        invoiceNumber: invoice.number,
        total: formatCurrency(total, business?.currency ?? "USD"),
        dueDate: dueKey,
        isOverdue: diff < 0,
        // Public link (no login required) — the client has no account.
        viewUrl: APP_URL ? `${APP_URL}/i/${invoice.id}` : undefined,
      })

      const subject =
        diff < 0
          ? `Overdue: Invoice #${invoice.number}`
          : diff === 0
          ? `Invoice #${invoice.number} is due today`
          : `Reminder: Invoice #${invoice.number} due soon`

      const sendResult = await sendResendEmail(RESEND_API_KEY, FROM_EMAIL, {
        to: client.email,
        subject,
        html,
      })

      if (sendResult.ok) {
        results.sent += 1
      } else {
        results.errors.push(`invoice ${invoice.id}: ${sendResult.error}`)
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
