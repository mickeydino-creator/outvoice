import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Renders a self-contained HTML string (an invoice/quote document) into a PDF
// by rasterizing it off-screen and embedding the result as a single-page PDF.
// Returns the PDF as a base64 string (no data: prefix) ready for use as an
// email attachment.
export async function htmlToPdfBase64(html: string): Promise<string> {
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

    const dataUri = pdf.output("datauristring")
    return dataUri.split(",")[1] ?? ""
  } finally {
    document.body.removeChild(container)
  }
}
