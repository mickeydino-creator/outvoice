import { supabase } from "./supabaseClient"
import { extractFunctionErrorMessage } from "./functionError"

export interface EmailAttachment {
  filename: string
  content: string // base64, no data: prefix
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, html, attachments },
  })
  if (error) {
    throw new Error(await extractFunctionErrorMessage(error, error.message))
  }
  return data as { success: boolean; id?: string }
}
