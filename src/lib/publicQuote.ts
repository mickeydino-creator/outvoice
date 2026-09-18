import { supabase } from "./supabaseClient"
import type { BusinessProfile, Client, Quote } from "../types"
import { quoteFromRow, clientFromRow, businessFromRow } from "./supabaseMappers"
import { extractFunctionErrorMessage } from "./functionError"

export interface PublicQuoteData {
  quote: Quote
  client?: Client
  business: BusinessProfile
}

async function invokePublicQuote(action: "get" | "approve" | "decline", quoteId: string): Promise<PublicQuoteData> {
  const { data, error } = await supabase.functions.invoke("public-quote", {
    body: { action, quoteId },
  })

  if (error) {
    throw new Error(await extractFunctionErrorMessage(error, error.message))
  }

  if (data?.error) throw new Error(data.error)

  return {
    quote: quoteFromRow(data.quote),
    client: data.client ? clientFromRow(data.client) : undefined,
    business: businessFromRow(data.business ?? {}),
  }
}

export function fetchPublicQuote(quoteId: string) {
  return invokePublicQuote("get", quoteId)
}

export function approvePublicQuote(quoteId: string) {
  return invokePublicQuote("approve", quoteId)
}

export function declinePublicQuote(quoteId: string) {
  return invokePublicQuote("decline", quoteId)
}
