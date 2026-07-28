/**
 * File copy/paste functionality.
 *
 * Important limitation: due to browser security policies, web JavaScript cannot
 * actively write arbitrary files (.docx / .zip / .pdf, etc.) to the system
 * clipboard — writeRich() only accepts types in the WRITABLE_MIME_TYPES allowlist.
 * Therefore the "write file" capability is limited to image files (essentially
 * delegating to writeRich); the reliable way to "read files" is to listen for
 * paste events and extract File objects from what the user pasted.
 */

import type { ClipboardEventPayload, OnFilePasteOptions, ProcessedPastedFile } from './types'
import { onClipboardEvent } from './events'
import { writeRich } from './rich'
import { ClipboardError, isWritableMimeType, WRITABLE_MIME_TYPES } from './types'

/**
 * Attempt to write a file to the clipboard.
 * Succeeds only when the file's MIME type is in the WRITABLE_MIME_TYPES
 * allowlist (essentially images); otherwise throws UNSUPPORTED_MIME_TYPE.
 */
export async function writeFile(file: File): Promise<void> {
  if (!isWritableMimeType(file.type)) {
    throw new ClipboardError(
      'UNSUPPORTED_MIME_TYPE',
      `Unable to write file "${file.name}" (type ${file.type || 'unknown'}) to the system clipboard: `
      + `browsers only allow writing ${WRITABLE_MIME_TYPES.join(', ')}; arbitrary file writes are blocked by security policy.`,
    )
  }
  await writeRich([{ type: file.type, data: file }])
}

/** Generate a stable unique id */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Format a byte count as a human-readable string, e.g. '1.2 MB' */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0)
    return '0 B'
  if (bytes === 0)
    return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

/**
 * Convert raw File[] into structured results: generate an id, format the size,
 * and produce a previewUrl (usable directly in <img>) for image files.
 * Does no rendering — only returns data; the caller decides how to display it.
 */
export function processPastedFiles(files: File[]): ProcessedPastedFile[] {
  return files.map((file) => {
    const isImage = file.type.startsWith('image/')
    return {
      id: generateId(),
      file,
      name: file.name || '',
      size: file.size,
      formattedSize: formatFileSize(file.size),
      mimeType: file.type || 'application/octet-stream',
      isImage,
      previewUrl: isImage ? URL.createObjectURL(file) : null,
    }
  })
}

/** Release previewUrls created by processPastedFiles. Call when a list item is removed or a component unmounts to avoid memory leaks. */
export function revokePastedFilePreview(item: ProcessedPastedFile): void {
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl)
  }
}

/**
 * Listen for paste events and fire a callback when files are pasted.
 *
 * By default files are preprocessed (id, previewUrl, etc.) and the callback
 * receives ProcessedPastedFile[]; pass `{ processed: false }` to receive raw
 * File[] instead.
 *
 * Returns an unsubscribe function.
 */
export function onFilePaste(
  handler: (files: ProcessedPastedFile[] | File[], payload: ClipboardEventPayload) => void,
  options: OnFilePasteOptions = {},
  target: HTMLElement | Document = document,
): () => void {
  const { processed = true, preventDefault = true } = options

  return onClipboardEvent(
    'paste',
    (payload) => {
      if (payload.files.length === 0)
        return
      if (preventDefault) {
        payload.originalEvent.preventDefault()
      }
      const result = processed ? processPastedFiles(payload.files) : payload.files
      handler(result, payload)
    },
    target,
  )
}
