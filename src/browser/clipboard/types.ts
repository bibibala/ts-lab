/**
 * Type definitions, constants, and error classes for the clipboard module.
 */

/** Common MIME types supported by the clipboard */
export type ClipboardMimeType
  = | 'text/plain'
    | 'text/html'
    | 'image/png'
    | 'image/jpeg'
    | 'image/gif'
    | 'image/svg+xml'
    | (string & {})

/** Rich content item for writing to the clipboard */
export interface ClipboardContentItem {
  /** MIME type, e.g. 'text/plain' | 'text/html' | 'image/png' */
  type: ClipboardMimeType
  /** Data content, either a string or a Blob */
  data: string | Blob
}

/** Result item obtained from reading the clipboard */
export interface ClipboardReadItem {
  type: ClipboardMimeType
  blob: Blob
}

/** Permission query result */
export type ClipboardPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'

/** Unified error code */
export type ClipboardErrorCode
  = | 'NOT_SUPPORTED'
    | 'PERMISSION_DENIED'
    | 'NOT_FOCUSED'
    | 'EMPTY_CLIPBOARD'
    | 'INSECURE_CONTEXT'
    | 'UNSUPPORTED_MIME_TYPE'
    | 'UNKNOWN'

/** Unified clipboard error */
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
 * Whitelist of MIME types that the browser's write() method currently allows writing
 * to the system clipboard (implementations vary slightly across browsers;
 * the list here reflects the common support range of Chrome/Edge).
 * Note: for security reasons, web pages cannot proactively write arbitrary files
 * (such as .docx, .zip, .pdf) to the system clipboard via JS — only the
 * text/image types in this whitelist are allowed.
 */
export const WRITABLE_MIME_TYPES: readonly string[] = [
  'text/plain',
  'text/html',
  'image/png',
]

/** Check whether a MIME type is allowed to be written to the system clipboard via write() */
export function isWritableMimeType(type: string): boolean {
  return WRITABLE_MIME_TYPES.includes(type)
}

/* ==================== Event-related types ==================== */

export interface ClipboardEventPayload {
  /** The native event object */
  originalEvent: ClipboardEvent
  /** Plain text from clipboardData (if any) */
  text: string | null
  /** HTML from clipboardData (if any; common only for paste events) */
  html: string | null
  /** List of image files from clipboardData (common only for paste events) */
  files: File[]
}

/* ==================== File paste related types ==================== */

/** Processed pasted file information */
export interface ProcessedPastedFile {
  /** Stable unique id, convenient for use as a key in list rendering / subsequent removal */
  id: string
  /** The original File object */
  file: File
  /** File name (files pasted from the system generally have a name; some scenarios like screenshots may be an empty string) */
  name: string
  /** Size in bytes */
  size: number
  /** Formatted size, e.g. '1.2 MB' */
  formattedSize: string
  /** MIME type, e.g. 'image/png', 'application/pdf' */
  mimeType: string
  /** Whether this is an image type */
  isImage: boolean
  /**
   * Generated only when isImage is true (via URL.createObjectURL),
   * used for direct thumbnail display with <img :src="previewUrl" />.
   * Null for non-image files; callers may choose an icon based on mimeType/extension.
   * Must call revokePastedFilePreview to release after use, otherwise memory will leak.
   */
  previewUrl: string | null
}

/** Options for onFilePaste */
export interface OnFilePasteOptions {
  /** Whether to preprocess files (generate id, previewUrl, etc.), defaults to true */
  processed?: boolean
  /** Whether to prevent the default paste behavior, defaults to true */
  preventDefault?: boolean
}
