/**
 * Copy (write) operations: text, HTML, image, file — plus cutting selected text from an input.
 */

import type { BoardWriteItem } from './types'
import { assertSupported, execCommandWithTempElement, isExecCommandSupported, normalizeError } from './internal'
import { isRichSupported, isSupported } from './support'
import { ClipboardError, isWritableMimeType } from './types'

/**
 * Copy plain text to the clipboard.
 * Prefers navigator.clipboard.writeText; falls back to execCommand('copy')
 * when the Clipboard API is unavailable or fails.
 */
export async function copyTextToBoard(text: string): Promise<void> {
  if (isSupported()) {
    try {
      await navigator.clipboard.writeText(text)
      return
    }
    catch (err) {
      // Native write failed — fall back only if execCommand is available.
      if (!isExecCommandSupported()) {
        throw normalizeError(err)
      }
    }
  }

  assertSupported(
    isExecCommandSupported(),
    'NOT_SUPPORTED',
    'Current environment does not support any clipboard copy method',
  )

  const ok = execCommandWithTempElement(text, 'copy')
  if (!ok) {
    throw new ClipboardError('UNKNOWN', 'Fallback copy method failed')
  }
}

/**
 * Low-level: write several formats to the clipboard at once (e.g. HTML + plain text)
 * via navigator.clipboard.write. Requires ClipboardItem support (isRichSupported).
 */
export async function copyItemsToBoard(items: BoardWriteItem[]): Promise<void> {
  assertSupported(
    isRichSupported(),
    'NOT_SUPPORTED',
    'Rich clipboard writing is not supported in this environment (requires ClipboardItem support).',
  )
  assertSupported(items.length > 0, 'UNKNOWN', 'items must not be empty')

  const dataByType: Record<string, Blob> = {}
  for (const item of items) {
    if (!isWritableMimeType(item.type)) {
      throw new ClipboardError(
        'UNSUPPORTED_MIME_TYPE',
        `Browser does not allow writing MIME type "${item.type}" to the system clipboard. `
        + `Only ${['text/plain', 'text/html', 'image/png'].join(', ')} are writable — `
        + `arbitrary files (documents, archives) are blocked by browser security policy.`,
      )
    }
    dataByType[item.type]
      = typeof item.data === 'string'
        ? new Blob([item.data], { type: item.type })
        : item.data
  }

  try {
    await navigator.clipboard.write([new ClipboardItem(dataByType)])
  }
  catch (err) {
    throw normalizeError(err)
  }
}

/**
 * Copy rich HTML to the clipboard. Pasting into email / docs keeps formatting;
 * plainFallback is what pasting into a plain-text input will produce.
 */
export async function copyHtmlToBoard(html: string, plainFallback?: string): Promise<void> {
  const items: BoardWriteItem[] = [{ type: 'text/html', data: html }]
  if (plainFallback !== undefined) {
    items.push({ type: 'text/plain', data: plainFallback })
  }
  await copyItemsToBoard(items)
}

/** Copy an image (Blob) to the clipboard, e.g. from canvas.toBlob or a fetched image. */
export async function copyImageToBoard(blob: Blob): Promise<void> {
  await copyItemsToBoard([{ type: blob.type || 'image/png', data: blob }])
}

/**
 * Copy a file to the clipboard.
 * Note: browsers only allow writing image files — anything else throws
 * UNSUPPORTED_MIME_TYPE (a browser security restriction, not a library limit).
 */
export async function copyFileToBoard(file: File): Promise<void> {
  if (!isWritableMimeType(file.type)) {
    throw new ClipboardError(
      'UNSUPPORTED_MIME_TYPE',
      `Cannot copy file "${file.name}" (type ${file.type || 'unknown'}) to the system clipboard: `
      + `browsers only allow writing ${['text/plain', 'text/html', 'image/png'].join(', ')}.`,
    )
  }
  await copyItemsToBoard([{ type: file.type, data: file }])
}

/**
 * Cut the selected text of an input / textarea: the selection is copied to the
 * clipboard and removed from the element. Returns the cut text.
 */
export async function cutFromInput(el: HTMLInputElement | HTMLTextAreaElement): Promise<string> {
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? el.value.length
  const selected = el.value.slice(start, end)

  assertSupported(selected.length > 0, 'EMPTY_CLIPBOARD', 'No text selected')

  await copyTextToBoard(selected)

  el.value = el.value.slice(0, start) + el.value.slice(end)
  el.selectionStart = el.selectionEnd = start
  el.dispatchEvent(new Event('input', { bubbles: true }))

  return selected
}
