/**
 * Clipboard DOM event helpers: onCopy / onCut / onPaste, plus onPasteFiles
 * which captures files pasted by the user and passes them to a callback.
 */

import type { BoardEventPayload, OnPasteFilesOptions, PreparedFile } from './types'
import { prepareFiles } from './utils'

type ListenerTarget = HTMLElement | Document
type PayloadHandler = (payload: BoardEventPayload) => void

function extractPayload(e: ClipboardEvent): BoardEventPayload {
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

function listen(eventName: 'copy' | 'cut' | 'paste', handler: PayloadHandler, target: ListenerTarget = document): () => void {
  const listener = (e: Event): void => {
    handler(extractPayload(e as ClipboardEvent))
  }
  target.addEventListener(eventName, listener as EventListener)
  return () => target.removeEventListener(eventName, listener as EventListener)
}

/** Listen for the document's copy event; returns an unbind function. */
export function onCopy(handler: PayloadHandler, target?: ListenerTarget): () => void {
  return listen('copy', handler, target)
}

/** Listen for the document's cut event; returns an unbind function. */
export function onCut(handler: PayloadHandler, target?: ListenerTarget): () => void {
  return listen('cut', handler, target)
}

/** Listen for the document's paste event; returns an unbind function. */
export function onPaste(handler: PayloadHandler, target?: ListenerTarget): () => void {
  return listen('paste', handler, target)
}

/**
 * Listen for file paste. Whenever the user pastes files (e.g. a screenshot or
 * files copied from the file manager), the callback receives them all at once.
 *
 * By default files are preprocessed into PreparedFile[] (with previewUrl for
 * images and a dispose() to release it); pass { processed: false } to receive
 * raw File[] instead. Returns an unbind function.
 */
export function onPasteFiles(
  handler: (files: PreparedFile[] | File[], payload: BoardEventPayload) => void,
  options: OnPasteFilesOptions = {},
  target: ListenerTarget = document,
): () => void {
  const { processed = true, preventDefault = true } = options

  return listen(
    'paste',
    (payload) => {
      if (payload.files.length === 0)
        return
      if (preventDefault) {
        payload.originalEvent.preventDefault()
      }
      const result = processed ? prepareFiles(payload.files) : payload.files
      handler(result, payload)
    },
    target,
  )
}
