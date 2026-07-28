/**
 * Rich content clipboard read/write: images, HTML, and multiple MIME types.
 * Requires browser support for ClipboardItem.
 */

import type { ClipboardContentItem, ClipboardMimeType, ClipboardReadItem } from './types'
import { isRichClipboardSupported } from './detect'
import { assertSupported, normalizeError } from './internal'
import { ClipboardError, isWritableMimeType, WRITABLE_MIME_TYPES } from './types'

/**
 * Write rich content to the clipboard. Supports writing multiple MIME types
 * simultaneously (e.g., providing text/plain alongside text/html).
 * Requires ClipboardItem support; throws NOT_SUPPORTED otherwise.
 */
export async function writeRich(items: ClipboardContentItem[]): Promise<void> {
  assertSupported(
    isRichClipboardSupported(),
    'NOT_SUPPORTED',
    'Rich clipboard writing is not supported in this environment (requires ClipboardItem support).',
  )
  assertSupported(items.length > 0, 'UNKNOWN', 'items must not be empty')

  const dataByType: Record<string, Blob> = {}
  for (const item of items) {
    if (!isWritableMimeType(item.type)) {
      throw new ClipboardError(
        'UNSUPPORTED_MIME_TYPE',
        `Browser does not allow writing MIME type "${item.type}". System clipboard write only supports: ${WRITABLE_MIME_TYPES.join(', ')}. `
        + `Arbitrary files (such as documents, archives) cannot be written to the system clipboard via web JavaScript — this is a browser security restriction.`,
      )
    }
    const blob
      = typeof item.data === 'string'
        ? new Blob([item.data], { type: item.type })
        : item.data
    dataByType[item.type] = blob
  }

  try {
    const clipboardItem = new ClipboardItem(dataByType)
    await navigator.clipboard.write([clipboardItem])
  }
  catch (err) {
    throw normalizeError(err)
  }
}

/**
 * Read all content items from the clipboard (may include images, HTML, etc.).
 */
export async function readRich(): Promise<ClipboardReadItem[]> {
  assertSupported(
    isRichClipboardSupported(),
    'NOT_SUPPORTED',
    'Rich clipboard reading is not supported in this environment (requires ClipboardItem support).',
  )

  try {
    const clipboardItems = await navigator.clipboard.read()
    const result: ClipboardReadItem[] = []

    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        const blob = await clipboardItem.getType(type)
        result.push({ type: type as ClipboardMimeType, blob })
      }
    }
    return result
  }
  catch (err) {
    throw normalizeError(err)
  }
}

/** Convenience method: write an image Blob (e.g., from canvas.toBlob or a fetched image). Falls back to blob.type if no type is provided. */
export async function writeImage(
  blob: Blob,
  type?: ClipboardMimeType,
): Promise<void> {
  const mimeType = type || (blob.type as ClipboardMimeType) || 'image/png'
  await writeRich([{ type: mimeType, data: blob }])
}

/** Convenience method: write HTML rich text with an optional plain-text fallback for pasting into plain-text contexts. */
export async function writeHtml(html: string, plainTextFallback?: string): Promise<void> {
  const items: ClipboardContentItem[] = [{ type: 'text/html', data: html }]
  if (plainTextFallback !== undefined) {
    items.push({ type: 'text/plain', data: plainTextFallback })
  }
  await writeRich(items)
}

/** Convenience method: read the first image from the clipboard (if present), otherwise return null. */
export async function readImage(): Promise<Blob | null> {
  const items = await readRich()
  const imageItem = items.find(item => item.type.startsWith('image/'))
  return imageItem ? imageItem.blob : null
}
