/**
 * Helpers for displaying pasted files: size formatting and file preparation.
 */

import type { PreparedFile } from './types'

/** Format a byte count as a human-readable string, e.g. 12582912 → '12.0 MB'. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0 || bytes === 0)
    return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Convert raw File[] into structured PreparedFile[]: id, formatted size,
 * and a previewUrl for image files. Each item carries its own dispose() to
 * release the previewUrl — call it once the preview is no longer displayed.
 */
export function prepareFiles(files: File[]): PreparedFile[] {
  return files.map((file) => {
    const isImage = file.type.startsWith('image/')
    let previewUrl: string | null = null
    if (isImage) {
      previewUrl = URL.createObjectURL(file)
    }
    return {
      id: generateId(),
      file,
      name: file.name || '',
      size: file.size,
      formattedSize: formatFileSize(file.size),
      mimeType: file.type || 'application/octet-stream',
      isImage,
      previewUrl,
      dispose() {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      },
    }
  })
}
