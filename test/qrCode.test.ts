import type { QRCode } from '../src/tools/qrCode/types'
import { describe, expect, it } from 'vitest'
import { ECLevel, generateQRCode, readQRCode } from '../src/tools/qrCode'

const CASES = [
  'A',
  'HELLO WORLD',
  '1234567890',
  '你好',
  'Hello 你好',
  '😀',
  'https://example.com',
  'https://ts-lab.netlify.app',
]

function qrToImage(qr: QRCode, moduleSize = 10, margin = 4) {
  const total = qr.size + 2 * margin
  const w = total * moduleSize
  const h = total * moduleSize
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.floor(y / moduleSize) - margin
      const c = Math.floor(x / moduleSize) - margin
      const dark = r >= 0 && r < qr.size && c >= 0 && c < qr.size && qr.modules[r][c]
      const idx = (y * w + x) * 4
      const v = dark ? 0 : 255
      data[idx] = v
      data[idx + 1] = v
      data[idx + 2] = v
      data[idx + 3] = 255
    }
  }
  return { data, width: w, height: h }
}

function readFormatMask(qr: QRCode): number {
  const positions: [number, number][] = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ]
  let bits = 0
  for (let i = 0; i < 15; i++) {
    const [r, c] = positions[i]
    if (qr.modules[r][c])
      bits |= (1 << (14 - i))
  }
  bits ^= 0x5412
  for (let data = 0; data < 32; data++) {
    let d = data << 10
    for (let i = 14; i >= 10; i--) {
      if (d & (1 << i))
        d ^= (0x537 << (i - 10))
    }
    if (((data << 10) | (d & 0x3FF)) === (bits & 0x7FFF))
      return data & 0x7
  }
  return -1
}

describe('generateQRCode', () => {
  it.each(CASES)('round-trips at ECLevel.M: %j', (text) => {
    const qr = generateQRCode(text, ECLevel.M)
    const decoded = readQRCode(qrToImage(qr))
    expect(decoded).toBe(text)
  })

  it.each(['A', 'HELLO WORLD', '1234567890', '你好'])('round-trips at ECLevel.Q: %j', (text) => {
    const qr = generateQRCode(text, ECLevel.Q)
    const decoded = readQRCode(qrToImage(qr))
    expect(decoded).toBe(text)
  })

  it.each(['A', 'HELLO WORLD', '你好', '😀'])('round-trips at ECLevel.H: %j', (text) => {
    const qr = generateQRCode(text, ECLevel.H)
    const decoded = readQRCode(qrToImage(qr))
    expect(decoded).toBe(text)
  })

  it('places format information MSB-first (decodable mask 0–7)', () => {
    const qr = generateQRCode('hello', ECLevel.M)
    const mask = readFormatMask(qr)
    expect(mask).toBeGreaterThanOrEqual(0)
    expect(mask).toBeLessThan(8)
  })
})
