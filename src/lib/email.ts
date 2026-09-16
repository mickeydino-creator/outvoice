import { supabase } from "./supabaseClient"

export interface EmailAttachment {
  filename: string
  content: string // base64, no data: prefix
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, html, attachments },
  })
  if (error) {
    // The Supabase client's default error message ("Edge Function returned a
    // non-2xx status code") hides the actual reason. The real message is in
    // the function's JSON response body, so surface that instead when we can.
    const context: Response | undefined = (error as { context?: Response }).context
    const detail = await context
      ?.clone()
      .json()
      .then((body) => body?.error as string | undefined)
      .catch(() => undefined)
    throw new Error(detail ?? error.message)
  }
  return data as { success: boolean; id?: string }
}
