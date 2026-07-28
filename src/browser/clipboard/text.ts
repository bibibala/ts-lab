/**
 * Plain text clipboard read and write.
 * Writes prefer the Clipboard API, falling back to execCommand('copy') on
 * failure or when unsupported. Reads only support the Clipboard API
 * (execCommand has no reliable read capability).
 */

import { isClipboardApiSupported, isExecCommandSupported } from './detect'
import { assertSupported, execCommandWithTempElement, normalizeError } from './internal'
import { ClipboardError } from './types'

/**
 * Write plain text to the clipboard.
 * Prefers navigator.clipboard.writeText, falling back to execCommand('copy')
 * on failure or when unsupported.
 */
export async function writeText(text: string): Promise<void> {
  if (isClipboardApiSupported()) {
    try {
      await navigator.clipboard.writeText(text)
      return
    }
    catch (err) {
      if (!isExecCommandSupported()) {
        throw normalizeError(err)
      }
    }
  }

  assertSupported(
    isExecCommandSupported(),
    'NOT_SUPPORTED',
    'Current environment does not support any clipboard write method',
  )

  const ok = execCommandWithTempElement(text, 'copy')
  if (!ok) {
    throw new ClipboardError('UNKNOWN', 'Fallback copy method failed')
  }
}

/**
 * Read plain text from the clipboard.
 * Note: execCommand has no reliable read capability; reading almost always
 * requires the async Clipboard API, so NOT_SUPPORTED is thrown when it is
 * unavailable.
 */
export async function readText(): Promise<string> {
  assertSupported(
    isClipboardApiSupported(),
    'NOT_SUPPORTED',
    'Current environment does not support clipboard reading (requires modern browser + secure context)',
  )

  try {
    return await navigator.clipboard.readText()
  }
  catch (err) {
    throw normalizeError(err)
  }
}
