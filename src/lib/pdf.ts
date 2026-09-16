import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Rasterizes a self-contained HTML string (an invoice/quote document) into a
// single-page PDF, off-screen. Shared by the email-attachment, storage-upload,
// and in-app download paths below.
async function renderHtmlToPdf(html: string): Promise<jsPDF> {
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-99999px"
  container.style.top = "0"
  container.style.width = "800px"
  container.style.background = "#ffffff"
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      windowWidth: 800,
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      unit: "px",
      format: [canvas.width, canvas.height],
    })
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
    return pdf
  } finally {
    document.body.removeChild(container)
  }
}

// Returns the PDF as a base64 string (no data: prefix) ready for use as an
// email attachment.
export async function htmlToPdfBase64(html: string): Promise<string> {
  const pdf = await renderHtmlToPdf(html)
  const dataUri = pdf.output("datauristring")
  return dataUri.split(",")[1] ?? ""
}

// Returns the PDF as a Blob, ready to upload (e.g. to Supabase Storage).
export async function htmlToPdfBlob(html: string): Promise<Blob> {
  const pdf = await renderHtmlToPdf(html)
  return pdf.output("blob")
}

// Renders once and returns both a base64 string (for an email attachment)
// and a Blob (for a Storage upload), avoiding a second render pass.
export async function htmlToPdfOutputs(html: string): Promise<{ base64: string; blob: Blob }> {
  const pdf = await renderHtmlToPdf(html)
  const dataUri = pdf.output("datauristring")
  return {
    base64: dataUri.split(",")[1] ?? "",
    blob: pdf.output("blob"),
  }
}

// Renders and immediately downloads the PDF in the browser.
export async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
  const pdf = await renderHtmlToPdf(html)
  pdf.save(filename)
}
