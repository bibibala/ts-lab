/**
 * Paste (read) operations: text, all formats, and the first image.
 * Requires the modern Clipboard API; execCommand has no reliable read equivalent.
 */

import type { BoardReadItem } from './types'
import { assertSupported, normalizeError } from './internal'
import { isRichSupported, isSupported } from './support'

/** Paste plain text from the clipboard. Requires the user to have granted read permission. */
export async function pasteTextFromBoard(): Promise<string> {
  assertSupported(
    isSupported(),
    'NOT_SUPPORTED',
    'Clipboard reading is not supported in this environment (requires a modern browser + secure context)',
  )

  try {
    return await navigator.clipboard.readText()
  }
  catch (err) {
    throw normalizeError(err)
  }
}

/** Paste everything on the clipboard as a list of { type, blob } entries (may include images, HTML…). */
export async function pasteAllFromBoard(): Promise<BoardReadItem[]> {
  assertSupported(
    isRichSupported(),
    'NOT_SUPPORTED',
    'Rich clipboard reading is not supported in this environment (requires ClipboardItem support).',
  )

  try {
    const clipboardItems = await navigator.clipboard.read()
    const result: BoardReadItem[] = []

    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        const blob = await clipboardItem.getType(type)
        result.push({ type, blob })
      }
    }
    return result
  }
  catch (err) {
    throw normalizeError(err)
  }
}

/** Paste the first image found on the clipboard, or null when there is none. */
export async function pasteImageFromBoard(): Promise<Blob | null> {
  const items = await pasteAllFromBoard()
  const imageItem = items.find(item => item.type.startsWith('image/'))
  return imageItem ? imageItem.blob : null
}
