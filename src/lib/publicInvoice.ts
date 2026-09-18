import { supabase } from "./supabaseClient"
import type { BusinessProfile, Client, Invoice } from "../types"
import { invoiceFromRow, clientFromRow, businessFromRow } from "./supabaseMappers"
import { extractFunctionErrorMessage } from "./functionError"

export interface PublicInvoiceData {
  invoice: Invoice
  client?: Client
  business: BusinessProfile
  templateHtml?: string
}

export async function fetchPublicInvoice(invoiceId: string): Promise<PublicInvoiceData> {
  const { data, error } = await supabase.functions.invoke("public-invoice", {
    body: { invoiceId },
  })

  if (error) {
    throw new Error(await extractFunctionErrorMessage(error, error.message))
  }

  if (data?.error) throw new Error(data.error)

  return {
    invoice: invoiceFromRow(data.invoice),
    client: data.client ? clientFromRow(data.client) : undefined,
    business: businessFromRow(data.business ?? {}),
    templateHtml: data.templateHtml ?? undefined,
  }
}
