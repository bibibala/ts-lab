// ============================================================================
//  MD5 hash — public API
// ============================================================================
import { md5RawAsync } from './core'

/**
 * Compute the MD5 hash (hex string) asynchronously.
 * Yields to the event loop every ~256 KB so the UI stays responsive.
 *
 * @example
 * ```ts
 * const hash = await md5('hello')
 * // '5d41402abc4b2a76b9719d911017c592'
 *
 * const fileHash = await md5(await file.arrayBuffer())
 * ```
 */
export async function md5(input: string | ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = toBytes(input)
  const buf = await md5RawAsync(bytes)
  return bufferToHex(buf)
}

// ---------------------------------------------------------------------------
//  Internal helpers
// ---------------------------------------------------------------------------

function toBytes(input: string | ArrayBuffer | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) {
    return input
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  }
  return new TextEncoder().encode(input)
}

function bufferToHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf)
  let hex = ''
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i].toString(16).padStart(2, '0')
  }
  return hex
}
