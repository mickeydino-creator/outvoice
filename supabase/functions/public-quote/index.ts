// Supabase Edge Function: public-quote
//
// Powers the public, no-login-required quote page. This function is the ONLY
// way an anonymous visitor can read or respond to a quote — the `quotes`
// table itself has no public RLS policy, so a client can never list or guess
// their way into another user's quotes. This function uses the service role
// key (bypasses RLS) but only ever looks up the single quote id it was given
// and only returns/mutates that one row.
//
// POST body: { action: "get" | "approve" | "decline", quoteId: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendResendEmail } from "../_shared/resend.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "InvoiceFlow <onboarding@resend.dev>"
const APP_URL = Deno.env.get("APP_URL") ?? ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function escapeHtml(value: string) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  let body: { action?: string; quoteId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { action, quoteId } = body
  if (!quoteId || typeof quoteId !== "string") {
    return json({ error: "Missing quoteId" }, 400)
  }
  if (action !== "get" && action !== "approve" && action !== "decline") {
    return json({ error: "Invalid action" }, 400)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: quote, error: quoteError } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle()

  if (quoteError) return json({ error: "Failed to load quote" }, 500)
  if (!quote) return json({ error: "Quote not found" }, 404)

  const [{ data: client }, { data: business }] = await Promise.all([
    admin.from("clients").select("*").eq("id", quote.client_id).maybeSingle(),
    admin.from("business_profile").select("*").eq("user_id", quote.user_id).maybeSingle(),
  ])

  if (action === "get") {
    return json({ quote, client, business })
  }

  // approve / decline
  if (quote.status !== "sent") {
    // Already responded to (or not yet sent, or already converted) — don't
    // let a stale page re-trigger a status change or a duplicate notification.
    return json({ error: `This quote is already ${quote.status} and can no longer be responded to.`, quote }, 409)
  }

  const newStatus = action === "approve" ? "accepted" : "declined"
  const respondedAt = new Date().toISOString()

  const { data: updated, error: updateError } = await admin
    .from("quotes")
    .update({ status: newStatus, responded_at: respondedAt })
    .eq("id", quoteId)
    .eq("status", "sent") // guards against a race between two simultaneous clicks
    .select("*")
    .maybeSingle()

  if (updateError) return json({ error: "Failed to update quote" }, 500)
  if (!updated) {
    return json({ error: "This quote was already responded to.", quote }, 409)
  }

  // Notify the freelancer using the existing email infrastructure.
  if (RESEND_API_KEY && business?.email) {
    const verb = newStatus === "accepted" ? "approved" : "declined"
    const quoteUrl = APP_URL ? `${APP_URL}/quotes/${quoteId}` : undefined
    const html = `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0F172A;">
      <p style="font-size:15px;line-height:1.6;">Hi ${escapeHtml(business.name || "there")},</p>
      <p style="font-size:15px;line-height:1.6;">
        ${escapeHtml(client?.name ?? "Your client")} has <strong>${verb}</strong> quote #${escapeHtml(quote.number)}.
      </p>
      ${
        newStatus === "accepted"
          ? `<p style="font-size:15px;line-height:1.6;">You can now convert it into an invoice from Invoxa.</p>`
          : ""
      }
      ${
        quoteUrl
          ? `<p style="margin-top:20px;"><a href="${quoteUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;">View quote</a></p>`
          : ""
      }
    </div>`

    await sendResendEmail(RESEND_API_KEY, FROM_EMAIL, {
      to: business.email,
      subject: `Quote #${quote.number} was ${verb}`,
      html,
    }).catch(() => undefined) // never fail the client-facing response over a notification hiccup
  }

  return json({ quote: updated, client, business })
})
