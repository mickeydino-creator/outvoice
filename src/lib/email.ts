import { supabase } from "./supabaseClient"

export interface EmailAttachment {
  filename: string
  content: string // base64, no data: prefix
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, html, attachments },
  })
  if (error) throw error
  return data as { success: boolean; id?: string }
}
