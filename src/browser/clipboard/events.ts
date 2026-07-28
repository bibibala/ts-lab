/**
 * Clipboard DOM event listener wrapper.
 */

import type { ClipboardEventPayload } from './types'

type ClipboardDomEventName = 'copy' | 'cut' | 'paste'

function extractPayload(e: ClipboardEvent): ClipboardEventPayload {
  const cd = e.clipboardData
  const text = cd?.getData('text/plain') || null
  const html = cd?.getData('text/html') || null
  const files: File[] = []

  if (cd?.items) {
    for (let i = 0; i < cd.items.length; i++) {
      const item = cd.items[i]
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file)
          files.push(file)
      }
    }
  }

  return { originalEvent: e, text, html, files }
}

/**
 * Listen for copy/cut/paste events on an element (or document), returns an unbind function.
 *
 * Example:
 *   const unbind = onClipboardEvent('paste', (payload) => {
 *     console.log(payload.text, payload.files);
 *   });
 *   // When you no longer need it:
 *   unbind();
 */
export function onClipboardEvent(
  eventName: ClipboardDomEventName,
  handler: (payload: ClipboardEventPayload) => void,
  target: HTMLElement | Document = document,
): () => void {
  const listener = (e: Event): void => {
    handler(extractPayload(e as ClipboardEvent))
  }
  target.addEventListener(eventName, listener as EventListener)
  return () => target.removeEventListener(eventName, listener as EventListener)
}
