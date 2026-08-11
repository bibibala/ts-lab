// ---------------------------------------------------------------------------
// Steganography — pixel-domain spread-spectrum encode + decode
//
// Embeds a 16-bit code as low-amplitude additive noise across fixed-size
// blocks, recoverable via correlation voting with the same PRNG seed.
//
// Not robust against aggressive recompression / resizing / denoising.
// ---------------------------------------------------------------------------

// ---- constants ----------------------------------------------------------

const STEGO_BLOCK = 16 // px per block
const STEGO_BITS = 16 // bits of payload, cycled across blocks for redundancy
const STEGO_AMPLITUDE = 3 // production amplitude (0-255) — invisible at normal viewing
const STEGO_DEBUG_AMPLITUDE = 60 // exaggerated amplitude for stegoDebug
const STEGO_SECRET = 0x9E3779B9 // fixed seed shared between encoder and decoder

// ---- PRNG ---------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let state = seed | 0
  return function () {
    state = (state + 0x6D2B79F5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pnPattern(blockX: number, blockY: number): Int8Array {
  const seed = (Math.imul(blockX, 73856093) ^ Math.imul(blockY, 19349663) ^ STEGO_SECRET) | 0
  const rand = mulberry32(seed)
  const pattern = new Int8Array(STEGO_BLOCK * STEGO_BLOCK)
  for (let i = 0; i < pattern.length; i++) pattern[i] = rand() < 0.5 ? -1 : 1
  return pattern
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

// ---- encode -------------------------------------------------------------

/**
 * Embed `code` (low STEGO_BITS bits) into `canvas` in place.
 * No-ops if the canvas is smaller than a single block.
 */
export function embedInvisibleCode(canvas: HTMLCanvasElement, code: number, debug: boolean): void {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const blocksX = Math.floor(width / STEGO_BLOCK)
  const blocksY = Math.floor(height / STEGO_BLOCK)
  if (blocksX === 0 || blocksY === 0) {
    console.warn('[watermark] invisibleId: canvas too small to embed a single block, skipped')
    return
  }

  const amplitude = debug ? STEGO_DEBUG_AMPLITUDE : STEGO_AMPLITUDE
  const img = ctx.getImageData(0, 0, blocksX * STEGO_BLOCK, blocksY * STEGO_BLOCK)
  const data = img.data
  const rowWidth = width

  let blockIndex = 0
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const bit = (code >> (blockIndex % STEGO_BITS)) & 1
      const sign = bit === 1 ? 1 : -1
      const pattern = pnPattern(bx, by)

      for (let y = 0; y < STEGO_BLOCK; y++) {
        for (let x = 0; x < STEGO_BLOCK; x++) {
          const px = bx * STEGO_BLOCK + x
          const py = by * STEGO_BLOCK + y
          const idx = (py * rowWidth + px) * 4
          const delta = sign * pattern[y * STEGO_BLOCK + x] * amplitude
          data[idx] = clamp255(data[idx] + delta)
          data[idx + 1] = clamp255(data[idx + 1] + delta)
          data[idx + 2] = clamp255(data[idx + 2] + delta)
          if (debug)
            data[idx + 3] = 255
        }
      }
      blockIndex++
    }
  }

  ctx.putImageData(img, 0, 0)
}

// ---- decode -------------------------------------------------------------

function toImageData(source: HTMLImageElement | HTMLCanvasElement | ImageData): ImageData | null {
  if (typeof document === 'undefined')
    return null

  if ('data' in source)
    return source as unknown as ImageData

  // Canvas fast path: read pixels directly to avoid drawImage pre-multiplied
  // alpha round-trip that would destroy low-alpha noise pixels
  if ('getContext' in source) {
    const ctx = source.getContext('2d')
    return ctx ? ctx.getImageData(0, 0, source.width, source.height) : null
  }

  // HTMLImageElement — unavoidable drawImage, but alpha=255 guarantee from
  // renderCanvas ensures pre-multiplication is harmless
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return null
  canvas.width = (source as HTMLImageElement).naturalWidth
  canvas.height = (source as HTMLImageElement).naturalHeight
  ctx.drawImage(source as HTMLImageElement, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * Decode the invisible watermark from a screenshot or image.
 *
 * Uses the same PRNG seed and block layout as `embedInvisibleCode`
 * to recover the 16-bit code via spread-spectrum correlation voting.
 *
 * @param source — an `<img>`, `<canvas>`, or `ImageData` (from a screenshot)
 * @returns The decoded 16-bit code, or `null` if the image is too small.
 */
export function decodeWatermark(source: HTMLImageElement | HTMLCanvasElement | ImageData): number | null {
  const imageData = toImageData(source)
  if (!imageData)
    return null

  const { data, width, height } = imageData
  const blocksX = Math.floor(width / STEGO_BLOCK)
  const blocksY = Math.floor(height / STEGO_BLOCK)
  if (blocksX === 0 || blocksY === 0)
    return null

  const accumulators = Array.from({ length: STEGO_BITS }).fill(0) as number[]

  let blockIndex = 0
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const pattern = pnPattern(bx, by)
      const bitPos = blockIndex % STEGO_BITS

      let correlation = 0
      for (let y = 0; y < STEGO_BLOCK; y++) {
        for (let x = 0; x < STEGO_BLOCK; x++) {
          const px = bx * STEGO_BLOCK + x
          const py = by * STEGO_BLOCK + y
          const idx = (py * width + px) * 4
          correlation += data[idx] * pattern[y * STEGO_BLOCK + x]
        }
      }
      accumulators[bitPos] += correlation
      blockIndex++
    }
  }

  let code = 0
  for (let i = 0; i < STEGO_BITS; i++) {
    if (accumulators[i] > 0)
      code |= (1 << i)
  }
  return code
}
