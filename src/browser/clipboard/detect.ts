/**
 * Clipboard feature detection and permission querying.
 */

import type { ClipboardPermissionState } from './types'

/** Whether running in a secure context (HTTPS / localhost). */
export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && !!window.isSecureContext
}

/** Whether the modern async Clipboard API is supported. */
export function isClipboardApiSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.clipboard
}

/** Whether write()/read() (rich content, including images) is supported. */
export function isRichClipboardSupported(): boolean {
  return (
    isClipboardApiSupported()
    && typeof (navigator.clipboard as any).write === 'function'
    && typeof window !== 'undefined'
    && typeof (window as any).ClipboardItem !== 'undefined'
  )
}

/** Whether the execCommand fallback is supported. */
export function isExecCommandSupported(): boolean {
  return typeof document !== 'undefined' && typeof document.execCommand === 'function'
}

/**
 * Query the clipboard read/write permission state.
 * Note: Permissions API support for clipboard-read / clipboard-write is inconsistent
 * (Firefox has limited support). Returns 'unknown' when the query fails, which does not
 * mean the operation is unavailable — only that it cannot be determined ahead of time.
 */
export async function queryClipboardPermission(
  name: 'clipboard-read' | 'clipboard-write',
): Promise<ClipboardPermissionState> {
  try {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'unknown'
    }
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    })
    return status.state as ClipboardPermissionState
  }
  catch {
    return 'unknown'
  }
}
