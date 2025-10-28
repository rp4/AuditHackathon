import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFGenerationOptions {
  filename?: string
  title?: string
  author?: string
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

/**
 * Generate a PDF from HTML content
 * @param element - The HTML element to convert to PDF
 * @param options - PDF generation options
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  options: PDFGenerationOptions = {}
): Promise<void> {
  const {
    filename = 'document.pdf',
    title = 'Document',
    author = 'OpenAuditSwarms',
    orientation = 'portrait',
    margin = 20,
  } = options

  try {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement

    // Create a temporary container
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '210mm' // A4 width
    container.style.backgroundColor = 'white'
    container.appendChild(clone)
    document.body.appendChild(container)

    // Use html2canvas to convert HTML to canvas
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      windowWidth: 794, // A4 width in pixels at 96 DPI
    })

    // Remove temporary container
    document.body.removeChild(container)

    // Get canvas dimensions
    const imgWidth = orientation === 'portrait' ? 210 : 297 // A4 dimensions in mm
    const imgHeight = orientation === 'portrait' ? 297 : 210
    const pageWidth = imgWidth - (margin * 2)
    const pageHeight = imgHeight - (margin * 2)

    // Calculate image dimensions
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const ratio = canvasWidth / pageWidth
    const calculatedHeight = canvasHeight / ratio

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    })

    // Set PDF metadata
    pdf.setProperties({
      title,
      author,
      creator: 'OpenAuditSwarms',
    })

    const imgData = canvas.toDataURL('image/png')
    let heightLeft = calculatedHeight
    let position = 0

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, margin + position, pageWidth, calculatedHeight)
    heightLeft -= pageHeight

    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - calculatedHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, margin + position, pageWidth, calculatedHeight)
      heightLeft -= pageHeight
    }

    // Download the PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}

/**
 * Generate a PDF from text content with custom styling
 * @param content - The text content to include in the PDF
 * @param options - PDF generation options
 */
export function generatePDFFromText(
  content: string,
  options: PDFGenerationOptions = {}
): void {
  const {
    filename = 'document.pdf',
    title = 'Document',
    author = 'OpenAuditSwarms',
    orientation = 'portrait',
    margin = 20,
  } = options

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    })

    // Set PDF metadata
    pdf.setProperties({
      title,
      author,
      creator: 'OpenAuditSwarms',
    })

    const pageWidth = orientation === 'portrait' ? 210 : 297
    const pageHeight = orientation === 'portrait' ? 297 : 210
    const contentWidth = pageWidth - (margin * 2)

    // Add title
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin, margin + 10)

    // Add content
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    // Split text into lines that fit the page width
    const lines = pdf.splitTextToSize(content, contentWidth)

    let yPosition = margin + 20
    const lineHeight = 7
    const maxYPosition = pageHeight - margin

    lines.forEach((line: string) => {
      if (yPosition + lineHeight > maxYPosition) {
        pdf.addPage()
        yPosition = margin
      }
      pdf.text(line, margin, yPosition)
      yPosition += lineHeight
    })

    // Download the PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}
