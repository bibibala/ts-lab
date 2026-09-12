/**
 * clipboard — browser clipboard wrapper for copy and paste
 * ---------------------------------------------------------
 *  Copy (write):   copyTextToBoard / copyHtmlToBoard / copyImageToBoard / copyFileToBoard / copyItemsToBoard
 *  Paste (read):   pasteTextFromBoard / pasteImageFromBoard / pasteAllFromBoard
 *  Cut:            cutFromInput
 *  Events:         onCopy / onCut / onPaste / onPasteFiles
 *  Detection:      isSupported / isRichSupported / queryPermission
 */

// copy / cut
export {
  copyFileToBoard,
  copyHtmlToBoard,
  copyImageToBoard,
  copyItemsToBoard,
  copyTextToBoard,
  cutFromInput,
} from './copy'

// events
export { onCopy, onCut, onPaste, onPasteFiles } from './events'

// paste
export { pasteAllFromBoard, pasteImageFromBoard, pasteTextFromBoard } from './paste'

// support
export { isRichSupported, isSupported, queryPermission } from './support'

// types & error
export type {
  BoardEventPayload,
  BoardReadItem,
  BoardWriteItem,
  ClipboardErrorCode,
  OnPasteFilesOptions,
  PermissionState,
  PreparedFile,
} from './types'

export { ClipboardError } from './types'

// utils
export { formatFileSize, prepareFiles } from './utils'
