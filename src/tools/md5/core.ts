// ============================================================================
//  MD5 core algorithm — RFC 1321
// ============================================================================

/**
 * T constants: floor(2^32 * abs(sin(i + 1))), i = 0..63
 */
const T: number[] = [
  0xD76AA478,
  0xE8C7B756,
  0x242070DB,
  0xC1BDCEEE,
  0xF57C0FAF,
  0x4787C62A,
  0xA8304613,
  0xFD469501,
  0x698098D8,
  0x8B44F7AF,
  0xFFFF5BB1,
  0x895CD7BE,
  0x6B901122,
  0xFD987193,
  0xA679438E,
  0x49B40821,
  0xF61E2562,
  0xC040B340,
  0x265E5A51,
  0xE9B6C7AA,
  0xD62F105D,
  0x02441453,
  0xD8A1E681,
  0xE7D3FBC8,
  0x21E1CDE6,
  0xC33707D6,
  0xF4D50D87,
  0x455A14ED,
  0xA9E3E905,
  0xFCEFA3F8,
  0x676F02D9,
  0x8D2A4C8A,
  0xFFFA3942,
  0x8771F681,
  0x6D9D6122,
  0xFDE5380C,
  0xA4BEEA44,
  0x4BDECFA9,
  0xF6BB4B60,
  0xBEBFBC70,
  0x289B7EC6,
  0xEAA127FA,
  0xD4EF3085,
  0x04881D05,
  0xD9D4D039,
  0xE6DB99E5,
  0x1FA27CF8,
  0xC4AC5665,
  0xF4292244,
  0x432AFF97,
  0xAB9423A7,
  0xFC93A039,
  0x655B59C3,
  0x8F0CCC92,
  0xFFEFF47D,
  0x85845DD1,
  0x6FA87E4F,
  0xFE2CE6E0,
  0xA3014314,
  0x4E0811A1,
  0xF7537E82,
  0xBD3AF235,
  0x2AD7D2BB,
  0xEB86D391,
]

/**
 * Per-step rotation amounts
 */
const S: number[] = [
  7,
  12,
  17,
  22,
  7,
  12,
  17,
  22,
  7,
  12,
  17,
  22,
  7,
  12,
  17,
  22,
  5,
  9,
  14,
  20,
  5,
  9,
  14,
  20,
  5,
  9,
  14,
  20,
  5,
  9,
  14,
  20,
  4,
  11,
  16,
  23,
  4,
  11,
  16,
  23,
  4,
  11,
  16,
  23,
  4,
  11,
  16,
  23,
  6,
  10,
  15,
  21,
  6,
  10,
  15,
  21,
  6,
  10,
  15,
  21,
  6,
  10,
  15,
  21,
]

function rol(x: number, n: number): number {
  return (x << n) | (x >>> (32 - n))
}

function F(b: number, c: number, d: number): number {
  return (b & c) | (~b & d)
}

function G(b: number, c: number, d: number): number {
  return (b & d) | (c & ~d)
}

function H(b: number, c: number, d: number): number {
  return b ^ c ^ d
}

function I(b: number, c: number, d: number): number {
  return c ^ (b | ~d)
}

/**
 * Pad the message per RFC 1321 §3.1 and split into 512-bit (16-word) blocks.
 * Returns an array of 16-element Uint32Arrays.
 */
function padAndBlock(input: Uint8Array): Uint32Array[] {
  const msgLenBits = input.length * 8

  // Pad: append 0x80, then zeros, then 64-bit original length (little-endian)
  // Padding length: need (input.length + padLen) % 64 == 56
  const padLen = (56 - ((input.length + 1) % 64) + 64) % 64
  const totalLen = input.length + 1 + padLen + 8
  const padded = new Uint8Array(totalLen)

  padded.set(input)
  padded[input.length] = 0x80

  // Write 64-bit original length in bits (little-endian, 2 × 32-bit words)
  // Low 32 bits first, then high 32 bits
  const view = new DataView(padded.buffer)
  view.setUint32(totalLen - 8, msgLenBits & 0xFFFFFFFF, true)
  view.setUint32(totalLen - 4, Math.floor(msgLenBits / 0x100000000) & 0xFFFFFFFF, true)

  // Split into 16-word blocks
  const blocks: Uint32Array[] = []
  for (let i = 0; i < totalLen; i += 64) {
    const block = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      block[j] = view.getUint32(i + j * 4, true)
    }
    blocks.push(block)
  }

  return blocks
}

// ---------------------------------------------------------------------------
//  Internal: single-block processing & final digest assembly
// ---------------------------------------------------------------------------

interface MDState {
  a0: number
  b0: number
  c0: number
  d0: number
}

function processBlock(M: Uint32Array, state: MDState): void {
  let A = state.a0
  let B = state.b0
  let C = state.c0
  let D = state.d0

  for (let i = 0; i < 64; i++) {
    let f: number
    let g: number

    if (i < 16) {
      f = F(B, C, D)
      g = i
    }
    else if (i < 32) {
      f = G(B, C, D)
      g = (5 * i + 1) % 16
    }
    else if (i < 48) {
      f = H(B, C, D)
      g = (3 * i + 5) % 16
    }
    else {
      f = I(B, C, D)
      g = (7 * i) % 16
    }

    f = (f + A + T[i] + M[g]) >>> 0
    A = D
    D = C
    C = B
    B = (B + rol(f, S[i])) >>> 0
  }

  state.a0 = (state.a0 + A) >>> 0
  state.b0 = (state.b0 + B) >>> 0
  state.c0 = (state.c0 + C) >>> 0
  state.d0 = (state.d0 + D) >>> 0
}

function digestToArrayBuffer(state: MDState): ArrayBuffer {
  const out = new ArrayBuffer(16)
  const outView = new DataView(out)
  outView.setUint32(0, state.a0, true)
  outView.setUint32(4, state.b0, true)
  outView.setUint32(8, state.c0, true)
  outView.setUint32(12, state.d0, true)
  return out
}

// ---------------------------------------------------------------------------
//  Public core functions
// ---------------------------------------------------------------------------

/**
 * Compute the raw MD5 digest (16 bytes) for the given input bytes.
 * Synchronous — may block the main thread for large inputs.
 */
export function md5Raw(input: Uint8Array): ArrayBuffer {
  const blocks = padAndBlock(input)
  const state: MDState = {
    a0: 0x67452301,
    b0: 0xEFCDAB89,
    c0: 0x98BADCFE,
    d0: 0x10325476,
  }
  for (const M of blocks) {
    processBlock(M, state)
  }
  return digestToArrayBuffer(state)
}

/**
 * Compute the raw MD5 digest (16 bytes) for the given input bytes.
 * Asynchronous — yields to the event loop every ~256 KB so the UI
 * stays responsive even for multi-MB inputs.
 */
export async function md5RawAsync(input: Uint8Array): Promise<ArrayBuffer> {
  const blocks = padAndBlock(input)
  const state: MDState = {
    a0: 0x67452301,
    b0: 0xEFCDAB89,
    c0: 0x98BADCFE,
    d0: 0x10325476,
  }

  const CHUNK = 4096 // blocks per yield (~256 KB of original data)

  for (let bi = 0; bi < blocks.length; bi++) {
    processBlock(blocks[bi], state)

    // yield to the event loop so the browser can paint / handle input
    if (bi % CHUNK === CHUNK - 1 && bi < blocks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  return digestToArrayBuffer(state)
}
