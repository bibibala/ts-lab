/**
 * clipboard — Full-featured browser clipboard capability wrapper
 * ------------------------------------------------------------
 *  1. Modern Clipboard API: writeText / readText / writeRich / readRich
 *  2. Fallback: document.execCommand('copy' | 'cut')
 *  3. Permission queries: Permissions API (clipboard-read / clipboard-write)
 *  4. Copy / cut / paste DOM event listener wrappers
 *  5. Image, HTML rich-text, and multi-MIME-type read/write
 *  6. Feature detection and unified error types
 *  7. File paste: structured results via paste event listener
 */

// cut
export { cutFromInput, cutText } from './cut'

// detection
export {
  isClipboardApiSupported,
  isExecCommandSupported,
  isRichClipboardSupported,
  isSecureContext,
  queryClipboardPermission,
} from './detect'

// events
export { onClipboardEvent } from './events'

// file
export {
  formatFileSize,
  generateId,
  onFilePaste,
  processPastedFiles,
  revokePastedFilePreview,
  writeFile,
} from './file'

// rich content
export { readImage, readRich, writeHtml, writeImage, writeRich } from './rich'

// text
export { readText, writeText } from './text'

// types & constants
export type {
  ClipboardContentItem,
  ClipboardErrorCode,
  ClipboardEventPayload,
  ClipboardMimeType,
  ClipboardPermissionState,
  ClipboardReadItem,
  OnFilePasteOptions,
  ProcessedPastedFile,
} from './types'

export {
  ClipboardError,
  isWritableMimeType,
  WRITABLE_MIME_TYPES,
} from './types'
