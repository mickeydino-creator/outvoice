import { supabase } from "./supabaseClient"

const BUCKET = "document-pdfs"

// Uploads a generated invoice/quote PDF to Storage and returns a public,
// directly-downloadable URL for it — used for the "Download PDF" link inside
// the email (separate from the PDF file attached to the email itself).
export async function uploadDocumentPdf(
  userId: string,
  kind: "invoice" | "quote",
  documentId: string,
  pdfBlob: Blob
): Promise<string | null> {
  const path = `${userId}/${kind}/${documentId}.pdf`

  const { error } = await supabase.storage.from(BUCKET).upload(path, pdfBlob, {
    contentType: "application/pdf",
    upsert: true,
  })

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Supabase error (uploadDocumentPdf):", error)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
