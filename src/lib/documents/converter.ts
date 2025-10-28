/**
 * Document Conversion Utilities
 * Converts Word documents (.docx) to Tiptap JSON format
 */

import mammoth from 'mammoth'
import { JSONContent } from '@tiptap/core'

export interface ConversionResult {
  success: boolean
  content?: JSONContent
  images?: { buffer: ArrayBuffer; contentType: string; filename: string }[]
  error?: string
  warnings?: string[]
}

/**
 * Convert a .docx file to Tiptap JSON format
 * @param file - The .docx file to convert
 * @returns Conversion result with Tiptap JSON and extracted images
 */
export async function convertDocxToTiptap(file: File): Promise<ConversionResult> {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Convert with mammoth
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        // Custom style mappings for better conversion
        styleMap: [
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2",
          "p[style-name='Heading 3'] => h3",
          "p[style-name='Title'] => h1",
          "p[style-name='Subtitle'] => h2",
        ],
        // Convert images to data URLs
        convertImage: mammoth.images.imgElement(async (image) => {
          const buffer = await image.read()
          const base64 = Buffer.from(buffer).toString('base64')
          return {
            src: `data:${image.contentType};base64,${base64}`,
          }
        }),
      }
    )

    // Parse HTML to Tiptap JSON
    const tiptapContent = htmlToTiptap(result.value)

    // Extract image data for upload
    const images = await extractImagesFromDocx(arrayBuffer)

    return {
      success: true,
      content: tiptapContent,
      images,
      warnings: result.messages.map((m) => m.message),
    }
  } catch (error) {
    console.error('Conversion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
    }
  }
}

/**
 * Convert HTML string to Tiptap JSON format
 * @param html - HTML string to convert
 * @returns Tiptap JSON content
 */
export function htmlToTiptap(html: string): JSONContent {
  // Create a temporary DOM parser
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Convert DOM to Tiptap JSON
  const content = domToTiptap(doc.body)

  return {
    type: 'doc',
    content: content || [],
  }
}

/**
 * Convert DOM node to Tiptap JSON
 * @param node - DOM node to convert
 * @returns Array of Tiptap JSON nodes
 */
function domToTiptap(node: Node): JSONContent[] {
  const result: JSONContent[] = []

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent
      if (text && text.trim()) {
        result.push({
          type: 'text',
          text: text,
        })
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element
      const tiptapNode = elementToTiptap(element)
      if (tiptapNode) {
        result.push(tiptapNode)
      }
    }
  })

  return result
}

/**
 * Convert HTML element to Tiptap JSON node
 * @param element - HTML element to convert
 * @returns Tiptap JSON node or null
 */
function elementToTiptap(element: Element): JSONContent | null {
  const tagName = element.tagName.toLowerCase()

  switch (tagName) {
    case 'p':
      return {
        type: 'paragraph',
        content: domToTiptap(element),
      }

    case 'h1':
      return {
        type: 'heading',
        attrs: { level: 1 },
        content: domToTiptap(element),
      }

    case 'h2':
      return {
        type: 'heading',
        attrs: { level: 2 },
        content: domToTiptap(element),
      }

    case 'h3':
      return {
        type: 'heading',
        attrs: { level: 3 },
        content: domToTiptap(element),
      }

    case 'h4':
      return {
        type: 'heading',
        attrs: { level: 4 },
        content: domToTiptap(element),
      }

    case 'h5':
      return {
        type: 'heading',
        attrs: { level: 5 },
        content: domToTiptap(element),
      }

    case 'h6':
      return {
        type: 'heading',
        attrs: { level: 6 },
        content: domToTiptap(element),
      }

    case 'ul':
      return {
        type: 'bulletList',
        content: domToTiptap(element),
      }

    case 'ol':
      return {
        type: 'orderedList',
        content: domToTiptap(element),
      }

    case 'li':
      return {
        type: 'listItem',
        content: domToTiptap(element),
      }

    case 'strong':
    case 'b':
      return {
        type: 'text',
        marks: [{ type: 'bold' }],
        text: element.textContent || '',
      }

    case 'em':
    case 'i':
      return {
        type: 'text',
        marks: [{ type: 'italic' }],
        text: element.textContent || '',
      }

    case 'u':
      return {
        type: 'text',
        marks: [{ type: 'underline' }],
        text: element.textContent || '',
      }

    case 'a':
      return {
        type: 'text',
        marks: [
          {
            type: 'link',
            attrs: { href: element.getAttribute('href') || '' },
          },
        ],
        text: element.textContent || '',
      }

    case 'img':
      return {
        type: 'image',
        attrs: {
          src: element.getAttribute('src') || '',
          alt: element.getAttribute('alt') || null,
          title: element.getAttribute('title') || null,
        },
      }

    case 'table':
      return {
        type: 'table',
        content: domToTiptap(element),
      }

    case 'tr':
      return {
        type: 'tableRow',
        content: domToTiptap(element),
      }

    case 'th':
      return {
        type: 'tableHeader',
        content: domToTiptap(element),
      }

    case 'td':
      return {
        type: 'tableCell',
        content: domToTiptap(element),
      }

    case 'br':
      return {
        type: 'hardBreak',
      }

    case 'hr':
      return {
        type: 'horizontalRule',
      }

    case 'blockquote':
      return {
        type: 'blockquote',
        content: domToTiptap(element),
      }

    case 'code':
      return {
        type: 'text',
        marks: [{ type: 'code' }],
        text: element.textContent || '',
      }

    case 'pre':
      return {
        type: 'codeBlock',
        content: domToTiptap(element),
      }

    default:
      // For unknown elements, try to extract their content
      const content = domToTiptap(element)
      if (content.length > 0) {
        return {
          type: 'paragraph',
          content,
        }
      }
      return null
  }
}

/**
 * Extract images from .docx file
 * @param arrayBuffer - The .docx file as array buffer
 * @returns Array of image data
 */
async function extractImagesFromDocx(
  arrayBuffer: ArrayBuffer
): Promise<{ buffer: ArrayBuffer; contentType: string; filename: string }[]> {
  try {
    // Note: This is a simplified version. For full image extraction,
    // you would need to parse the .docx as a ZIP file and extract images
    // from the word/media folder. This can be done with jszip.

    // For now, return empty array. Images are converted to base64 in the HTML
    return []
  } catch (error) {
    console.error('Error extracting images:', error)
    return []
  }
}

/**
 * Split Tiptap content into preview and full sections
 * Splits at first "Preview Divider" node, or after N paragraphs
 * @param content - Full Tiptap JSON content
 * @param paragraphCount - Number of paragraphs for preview (default: 3)
 * @returns { preview, full }
 */
export function splitContentForPreview(
  content: JSONContent,
  paragraphCount: number = 3
): { preview: JSONContent; full: JSONContent } {
  if (!content.content || content.content.length === 0) {
    return {
      preview: content,
      full: content,
    }
  }

  // Look for preview divider node
  const dividerIndex = content.content.findIndex(
    (node) => node.type === 'previewDivider'
  )

  if (dividerIndex !== -1) {
    // Split at divider
    return {
      preview: {
        type: 'doc',
        content: content.content.slice(0, dividerIndex),
      },
      full: content,
    }
  }

  // Auto-split after N paragraphs/headings
  let count = 0
  let splitIndex = 0

  for (let i = 0; i < content.content.length; i++) {
    const node = content.content[i]
    if (node.type === 'paragraph' || node.type === 'heading') {
      count++
      if (count >= paragraphCount) {
        splitIndex = i + 1
        break
      }
    }
  }

  if (splitIndex === 0) {
    // Not enough content, return everything as preview
    return {
      preview: content,
      full: content,
    }
  }

  return {
    preview: {
      type: 'doc',
      content: content.content.slice(0, splitIndex),
    },
    full: content,
  }
}
