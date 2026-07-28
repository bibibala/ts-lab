/**
 * Cut operation wrapper.
 */

import { isExecCommandSupported } from './detect'
import { assertSupported, execCommandWithTempElement } from './internal'
import { writeText } from './text'

/**
 * Cut text to the clipboard. Does not clear the source (e.g. input field) after writing
 * — callers may combine this with cutFromInput or clear the selection themselves.
 */
export async function cutText(text: string): Promise<void> {
  if (isExecCommandSupported()) {
    const ok = execCommandWithTempElement(text, 'cut')
    if (ok)
      return
  }
  await writeText(text)
}

/**
 * Cut the selected content from an editable input or textarea: copy the selected text
 * to the clipboard and remove it from the element.
 */
export async function cutFromInput(
  el: HTMLInputElement | HTMLTextAreaElement,
): Promise<string> {
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? el.value.length
  const selected = el.value.slice(start, end)

  assertSupported(selected.length > 0, 'EMPTY_CLIPBOARD', 'No text selected')

  await writeText(selected)

  el.value = el.value.slice(0, start) + el.value.slice(end)
  el.selectionStart = el.selectionEnd = start
  el.dispatchEvent(new Event('input', { bubbles: true }))

  return selected
}
