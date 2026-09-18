// Supabase Edge Function: public-invoice
//
// Powers the public, no-login-required invoice page. Same security pattern
// as public-quote: this is the ONLY way an anonymous visitor can read an
// invoice — the `invoices` table has no public RLS policy, so a client can
// never list or guess their way into another user's invoices. Uses the
// service role key (bypasses RLS) but only ever looks up the single invoice
// id it was given, and only ever reads (no mutation — invoices aren't
// approved/rejected by clients like quotes are).
//
// POST body: { invoiceId: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  let body: { invoiceId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { invoiceId } = body
  if (!invoiceId || typeof invoiceId !== "string") {
    return json({ error: "Missing invoiceId" }, 400)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle()

  if (invoiceError) return json({ error: "Failed to load invoice" }, 500)
  if (!invoice) return json({ error: "Invoice not found" }, 404)

  const [{ data: client }, { data: business }] = await Promise.all([
    admin.from("clients").select("*").eq("id", invoice.client_id).maybeSingle(),
    admin.from("business_profile").select("*").eq("user_id", invoice.user_id).maybeSingle(),
  ])

  return json({ invoice, client, business })
})
