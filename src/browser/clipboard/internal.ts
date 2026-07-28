/**
 * Internal utility functions for the clipboard module. Not exposed publicly.
 */

import type { ClipboardErrorCode } from './types'
import { ClipboardError } from './types'

export function assertSupported(condition: boolean, code: ClipboardErrorCode, message: string): void {
  if (!condition) {
    throw new ClipboardError(code, message)
  }
}

export function normalizeError(err: unknown): ClipboardError {
  if (err instanceof ClipboardError)
    return err

  const name = (err as any)?.name
  const message = (err as any)?.message ?? String(err)

  if (name === 'NotAllowedError') {
    return new ClipboardError(
      'PERMISSION_DENIED',
      'Clipboard access denied; permission may not be granted or the page may not be focused.',
      err,
    )
  }
  if (name === 'NotFoundError') {
    return new ClipboardError('EMPTY_CLIPBOARD', 'No matching data found on the clipboard.', err)
  }
  return new ClipboardError('UNKNOWN', message, err)
}

/** Use a hidden textarea to execute execCommand as a fallback. */
export function execCommandWithTempElement(
  text: string,
  command: 'copy' | 'cut',
): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'
  textarea.setAttribute('readonly', '')
  document.body.appendChild(textarea)

  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  let success = false
  try {
    success = document.execCommand(command)
  }
  finally {
    document.body.removeChild(textarea)
  }
  return success
}
