/**
 * Type definitions, the unified error class, and an internal writable-MIME whitelist.
 */

/** Clipboard read/write permission state returned by queryPermission */
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'

/** Unified error code */
export type ClipboardErrorCode
  = | 'NOT_SUPPORTED'
    | 'PERMISSION_DENIED'
    | 'EMPTY_CLIPBOARD'
    | 'UNSUPPORTED_MIME_TYPE'
    | 'UNKNOWN'

/** Unified clipboard error, thrown by all clipboard operations that fail */
export class ClipboardError extends Error {
  code: ClipboardErrorCode
  cause?: unknown

  constructor(code: ClipboardErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'ClipboardError'
    this.code = code
    this.cause = cause
  }
}

/**
 * One format to write to the clipboard, used by copyItemsToBoard.
 *
 * Example:
 *   { type: 'text/html', data: '<b>hi</b>' }
 *   { type: 'text/plain', data: 'hi' }
 */
export interface BoardWriteItem {
  /** MIME type, e.g. 'text/plain' | 'text/html' | 'image/png' */
  type: string
  /** Content: a string for text types, a Blob for binary types (e.g. images) */
  data: string | Blob
}

/** One format read from the clipboard, returned by pasteAllFromBoard */
export interface BoardReadItem {
  type: string
  blob: Blob
}

/** Payload for clipboard DOM events (copy / cut / paste) */
export interface BoardEventPayload {
  /** The native ClipboardEvent */
  originalEvent: ClipboardEvent
  /** Plain text from clipboardData, if any */
  text: string | null
  /** HTML from clipboardData, if any (common for paste events) */
  html: string | null
  /** Files from clipboardData, if any (common for paste events) */
  files: File[]
}

/** A pasted file prepared by prepareFiles / onPasteFiles */
export interface PreparedFile {
  /** Stable unique id, usable as a list key */
  id: string
  /** The original File object */
  file: File
  /** File name (may be empty for screenshots paste) */
  name: string
  /** Size in bytes */
  size: number
  /** Formatted size, e.g. '1.2 MB' */
  formattedSize: string
  /** MIME type, e.g. 'image/png' | 'application/pdf' */
  mimeType: string
  /** Whether this is an image type */
  isImage: boolean
  /**
   * Object URL for image thumbnails (usable directly as <img src>).
   * Null for non-image files. Call dispose() to release it.
   */
  previewUrl: string | null
  /** Release the previewUrl object URL. Call after the preview is no longer displayed. */
  dispose: () => void
}

/** Options for onPasteFiles */
export interface OnPasteFilesOptions {
  /** Preprocess files (id, previewUrl, dispose…), defaults to true */
  processed?: boolean
  /** Prevent the browser's default paste behavior, defaults to true */
  preventDefault?: boolean
}

/* ==================== Internal (not exported publicly) ==================== */

/**
 * MIME types browsers allow pages to write to the system clipboard.
 * Arbitrary files (.zip / .pdf / .docx…) cannot be written via JavaScript —
 * this is a browser security restriction.
 */
export const WRITABLE_MIME_TYPES: readonly string[] = [
  'text/plain',
  'text/html',
  'image/png',
]

/** Whether a MIME type is allowed to be written to the system clipboard */
export function isWritableMimeType(type: string): boolean {
  return WRITABLE_MIME_TYPES.includes(type)
}
