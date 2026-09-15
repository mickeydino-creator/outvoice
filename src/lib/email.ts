import { supabase } from "./supabaseClient"

export async function sendEmail(to: string, subject: string, html: string) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, html },
  })
  if (error) throw error
  return data as { success: boolean; id?: string }
}
