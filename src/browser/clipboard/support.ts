/**
 * Clipboard capability detection and permission querying.
 */

import type { PermissionState } from './types'

/**
 * Whether the modern Clipboard API is available.
 * Note: navigator.clipboard only exists in secure contexts (HTTPS / localhost),
 * so this implicitly requires one.
 */
export function isSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.clipboard
}

/** Whether rich writing is available (ClipboardItem — needed for HTML, images, and pasteAllFromBoard). */
export function isRichSupported(): boolean {
  return (
    isSupported()
    && typeof (navigator.clipboard as any).write === 'function'
    && typeof window !== 'undefined'
    && typeof (window as any).ClipboardItem !== 'undefined'
  )
}

/**
 * Query the clipboard read/write permission state.
 * Returns 'unknown' when the query fails — this only means the state can't be
 * determined ahead of time, not that the operation is unavailable.
 */
export async function queryPermission(
  action: 'read' | 'write',
): Promise<PermissionState> {
  try {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'unknown'
    }
    const status = await navigator.permissions.query({
      name: `clipboard-${action}` as PermissionName,
    })
    return status.state as PermissionState
  }
  catch {
    return 'unknown'
  }
}
