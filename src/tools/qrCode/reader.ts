// ===================== QR Code Reader =====================

import type { ImageInput } from './types'
import { utf8Decode } from './encoder'
import { MASK_FNS } from './matrix'
import { ALIGN_POS, EC_BLOCK, getTotalCodewords } from './qrTables'
import { rsDecode } from './reedSolomon'
import { ECLevel } from './types'

interface Point {
  x: number
  y: number
  w: number // finder pattern pixel width (for ms estimation)
}

function binarize(
  data: Uint8ClampedArray | Uint8Array | number[],
  w: number,
  h: number,
): boolean[][] {
  const gray: number[] = Array.from({ length: w * h })
  let min = 255
  let max = 0
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4
    const v = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
    gray[i] = v
    if (v < min)
      min = v
    if (v > max)
      max = v
  }
  const threshold = (min + max) / 2

  const binary: boolean[][] = Array.from({ length: h }, () => Array.from({ length: w }))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      binary[y][x] = gray[y * w + x] < threshold
    }
  }
  return binary
}

function findFinderCenters(binary: boolean[][]): Point[] {
  const h = binary.length
  const w = binary[0].length
  const centers: Point[] = []

  const checkRatio = (counts: number[], tol: number): boolean => {
    const total = counts.reduce((a, b) => a + b, 0)
    const ms = total / 7
    return (
      Math.abs(counts[0] - ms) < ms * tol
      && Math.abs(counts[1] - ms) < ms * tol
      && Math.abs(counts[2] - 3 * ms) < ms * tol * 3
      && Math.abs(counts[3] - ms) < ms * tol
      && Math.abs(counts[4] - ms) < ms * tol
    )
  }

  for (let y = 0; y < h; y++) {
    const counts = [0, 0, 0, 0, 0]
    let state = 0

    for (let x = 0; x < w; x++) {
      const dark = binary[y][x]
      if (dark === (state % 2 === 0)) {
        counts[state]++
      }
      else {
        if (state === 4) {
          if (checkRatio(counts, 0.4)) {
            const cx = x - counts[4] - counts[3] - Math.floor(counts[2] / 2)
            // Verify vertically
            if (verifyVerticalCross(binary, Math.floor(cx), y, counts)) {
              const totalWidth = counts.reduce((a, b) => a + b, 0)
              centers.push({ x: cx, y, w: totalWidth })
            }
          }
          counts[0] = counts[2]
          counts[1] = counts[3]
          counts[2] = counts[4]
          counts[3] = 1
          counts[4] = 0
          state = 3
        }
        else {
          state++
          counts[state]++
        }
      }
    }
  }

  // Cluster centers into 3 groups (top-left, top-right, bottom-left)
  if (centers.length < 3)
    return centers

  // Sort by x, then cluster by proximity
  const sorted = [...centers].sort((a, b) => a.x - b.x)
  const clusters: Point[][] = [[sorted[0]]]

  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1]
    const lastCenter = last[last.length - 1]
    const dist = Math.abs(sorted[i].x - lastCenter.x)
    // If close in x, same finder column
    if (dist < 10) {
      last.push(sorted[i])
    }
    else {
      clusters.push([sorted[i]])
    }
  }

  // Need at least 2 clusters (left column and right column)
  if (clusters.length < 2)
    return []

  // Take the top-most center from each cluster, plus a distinct bottom-left
  const leftCluster = clusters[0]
  const rightCluster = clusters[clusters.length - 1]

  // Sort left cluster by y to separate top-left from bottom-left
  const leftByY = [...leftCluster].sort((a, b) => a.y - b.y)
  const tlHalf = leftByY.slice(0, Math.ceil(leftByY.length / 2))
  const blHalf = leftByY.slice(-Math.ceil(leftByY.length / 2))
  const tl = { x: median(tlHalf.map(c => c.x)), y: median(tlHalf.map(c => c.y)), w: median(tlHalf.map(c => c.w)) }
  const bl = { x: median(blHalf.map(c => c.x)), y: median(blHalf.map(c => c.y)), w: median(blHalf.map(c => c.w)) }

  // Right cluster top-most
  const rightByY = [...rightCluster].sort((a, b) => a.y - b.y)
  const trHalf = rightByY.slice(0, Math.ceil(rightByY.length / 2))
  const tr = { x: median(trHalf.map(c => c.x)), y: median(trHalf.map(c => c.y)), w: median(trHalf.map(c => c.w)) }

  return [tl, tr, bl]
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

function verifyVerticalCross(
  binary: boolean[][],
  cx: number,
  cy: number,
  hCounts: number[],
): boolean {
  const h = binary.length
  if (cx < 0 || cx >= binary[0].length)
    return false

  const totalWidth = hCounts.reduce((a, b) => a + b, 0)
  const startY = Math.max(0, cy - totalWidth)
  const endY = Math.min(h, cy + totalWidth)

  // Collect all dark/light runs in the vertical line
  const allRuns: number[] = []
  let runStart = startY
  for (let y = startY + 1; y <= endY; y++) {
    if (y === endY || binary[y][cx] !== binary[runStart][cx]) {
      allRuns.push(y - runStart)
      runStart = y
    }
  }

  // Look for 1:1:3:1:1 pattern in any 5 consecutive runs
  for (let i = 0; i + 5 <= allRuns.length; i++) {
    const runs = allRuns.slice(i, i + 5)
    const total = runs.reduce((a, b) => a + b, 0)
    const ms = total / 7
    if (
      Math.abs(runs[0] - ms) < ms * 0.5
      && Math.abs(runs[1] - ms) < ms * 0.5
      && Math.abs(runs[2] - 3 * ms) < ms * 1.5
      && Math.abs(runs[3] - ms) < ms * 0.5
      && Math.abs(runs[4] - ms) < ms * 0.5
    ) {
      return true
    }
  }

  return false
}

function orderFinderPatterns(centers: Point[]): [Point, Point, Point] {
  // Sort by y then x to find consistent ordering
  const sorted = [...centers].sort((a, b) => a.y - b.y || a.x - b.x)

  // Simple approach: sort by y asc, take first two as top row, last one as bottom
  // In top row, smaller x is top-left, larger x is top-right
  const topTwo = sorted.slice(0, 2).sort((a, b) => a.x - b.x)
  const topLeft = topTwo[0]
  const topRight = topTwo[1]
  const bottomLeft = sorted[2]

  return [topLeft, topRight, bottomLeft]
}

function readQRModules(
  binary: boolean[][],
  tl: Point,
  tr: Point,
  bl: Point,
  size: number,
): boolean[][] {
  const modules: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }))

  // Recompute accurate module size from finder distance and known size
  const hDist = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2)
  const ms = hDist / (size - 7) // finder centers are (size - 7) modules apart horizontally

  // Top-left corner of the QR code (3.5 modules from finder center)
  const ox = tl.x - 3.5 * ms
  const oy = tl.y - 3.5 * ms

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const px = ox + (c + 0.5) * ms
      const py = oy + (r + 0.5) * ms
      const ix = Math.floor(px)
      const iy = Math.floor(py)
      if (iy >= 0 && iy < binary.length && ix >= 0 && ix < binary[0].length) {
        modules[r][c] = binary[iy][ix]
      }
      else {
        modules[r][c] = false
      }
    }
  }

  return modules
}

function readFormatInfo(modules: boolean[][]): { ecLevel: ECLevel, mask: number } | null {
  const size = modules.length

  // Read first copy of format info
  const positions1: [number, number][] = [
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

  // Read second copy
  const positions2: [number, number][] = [
    [size - 1, 8],
    [size - 2, 8],
    [size - 3, 8],
    [size - 4, 8],
    [size - 5, 8],
    [size - 6, 8],
    [size - 7, 8],
    [8, size - 8],
    [8, size - 7],
    [8, size - 6],
    [8, size - 5],
    [8, size - 4],
    [8, size - 3],
    [8, size - 2],
    [8, size - 1],
  ]

  let bits1 = 0
  let bits2 = 0
  // ISO/IEC 18004: format bits are read MSB (bit 14) first
  for (let i = 0; i < 15; i++) {
    const [r1, c1] = positions1[i]
    const [r2, c2] = positions2[i]
    if (modules[r1]?.[c1])
      bits1 |= (1 << (14 - i))
    if (modules[r2]?.[c2])
      bits2 |= (1 << (14 - i))
  }

  // Try both copies and choose the one with fewer errors
  for (const rawBits of [bits1, bits2]) {
    const decoded = decodeFormatBits(rawBits)
    if (decoded)
      return decoded
  }

  return null
}

function decodeFormatBits(bits: number): { ecLevel: ECLevel, mask: number } | null {
  // XOR with mask
  const b = bits ^ 0x5412

  // Check 0-bit error first
  if (isValidFormatBCH(b)) {
    return extractFormatData(b)
  }

  // Try to correct using BCH (1-bit and 2-bit errors)
  let best = b
  let bestErrors = 15

  for (let i = 0; i < 15; i++) {
    const corrected = b ^ (1 << i)
    if (isValidFormatBCH(corrected)) {
      const errors = countBitDiff(b, corrected)
      if (errors < bestErrors) {
        bestErrors = errors
        best = corrected
      }
    }
    // Also try 2-bit errors
    for (let j = i + 1; j < 15; j++) {
      const corrected2 = b ^ (1 << i) ^ (1 << j)
      if (isValidFormatBCH(corrected2)) {
        const errors = countBitDiff(b, corrected2)
        if (errors < bestErrors) {
          bestErrors = errors
          best = corrected2
        }
      }
    }
  }

  if (bestErrors <= 3 && isValidFormatBCH(best)) {
    return extractFormatData(best)
  }

  return null
}

function extractFormatData(bits: number): { ecLevel: ECLevel, mask: number } | null {
  const data = (bits >> 10) & 0x1F
  const ecIdx = data >> 3
  const mask = data & 0x7
  const ecMap: ECLevel[] = [ECLevel.M, ECLevel.L, ECLevel.H, ECLevel.Q]
  if (ecIdx >= 0 && ecIdx < 4 && mask < 8) {
    return { ecLevel: ecMap[ecIdx], mask }
  }
  return null
}

function isValidFormatBCH(bits: number): boolean {
  let b = bits & 0x7FFF
  for (let i = 14; i >= 10; i--) {
    if (b & (1 << i))
      b ^= (0x537 << (i - 10))
  }
  return (b & 0x3FF) === 0
}

function countBitDiff(a: number, b: number): number {
  let diff = a ^ b
  let count = 0
  while (diff) {
    count++
    diff &= diff - 1
  }
  return count
}

function unmask(modules: boolean[][], maskIdx: number): void {
  const fn = MASK_FNS[maskIdx]
  const size = modules.length

  // Build isFunction map to avoid unmasking function modules
  const isFunc = buildFunctionModulesMap(size)

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunc[r][c] && fn(r, c)) {
        modules[r][c] = !modules[r][c]
      }
    }
  }
}

function buildFunctionModulesMap(size: number): boolean[][] {
  const map: boolean[][] = Array.from({ length: size }, () => {
    const row: boolean[] = []
    row.length = size
    return row.fill(false)
  })

  // Finder patterns
  const markRect = (row: number, col: number, h: number, w: number): void => {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size)
          map[r][c] = true
      }
    }
  }
  markRect(-1, -1, 9, 9) // top-left
  markRect(-1, size - 8, 9, 9) // top-right
  markRect(size - 8, -1, 9, 9) // bottom-left

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    map[6][i] = true
    map[i][6] = true
  }

  // Format info area (around finders) — must match matrix.ts reserveFormatArea
  for (let i = 0; i <= 8; i++) {
    map[8][i] = true
    map[i][8] = true
  }
  for (let i = size - 8; i < size; i++) {
    map[8][i] = true
  }
  for (let i = size - 7; i < size; i++) {
    map[i][8] = true
  }

  // Dark module
  map[size - 8][8] = true

  // Version info (check if size suggests version >= 7)
  const version = Math.round((size - 17) / 4)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        map[i][size - 11 + j] = true
        map[size - 11 + i][j] = true
      }
    }
  }

  // Alignment patterns
  if (version >= 2) {
    const positions = ALIGN_POS[version] ?? []
    for (const row of positions) {
      for (const col of positions) {
        if (row <= 8 && col <= 8)
          continue
        if (row <= 8 && col >= size - 8)
          continue
        if (row >= size - 8 && col <= 8)
          continue
        markRect(row - 2, col - 2, 5, 5)
      }
    }
  }

  return map
}

function extractData(modules: boolean[][], _version: number): number[] {
  const size = modules.length
  const isFunc = buildFunctionModulesMap(size)

  // Collect data positions in reverse of placement order
  const positions: [number, number][] = []
  let upward = true

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6)
      right = 5
    for (let vert = 0; vert < size; vert++) {
      const row = upward ? (size - 1 - vert) : vert
      for (let j = 0; j < 2; j++) {
        const col = right - j
        if (col >= 0 && !isFunc[row][col]) {
          positions.push([row, col])
        }
      }
    }
    upward = !upward
  }

  // Read codeword bits only — remainder bits after the last byte are not packed
  const version = Math.round((size - 17) / 4)
  const numCodewords = getTotalCodewords(version)
  const numBits = numCodewords * 8

  const bytes: number[] = []
  for (let i = 0; i < numBits; i += 8) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      const [r, c] = positions[i + b]
      if (modules[r]?.[c])
        byte |= (1 << (7 - b))
    }
    bytes.push(byte)
  }

  return bytes
}

function decodeQRData(
  rawBytes: number[],
  version: number,
  ecLevel: ECLevel,
): string | null {
  const info = EC_BLOCK[version][ecLevel]
  const [ecPerBlock, g1Blocks, g1DataCW, g2Blocks, g2DataCW] = info

  // De-interleave data and EC codewords
  const totalBlocks = g1Blocks + g2Blocks
  const blocks: number[][] = Array.from({ length: totalBlocks }, () => [])
  const ecBlocks: number[][] = Array.from({ length: totalBlocks }, () => [])

  const maxDataCW = Math.max(g1DataCW, g2DataCW || 0)
  let offset = 0

  // Read data codewords
  for (let j = 0; j < maxDataCW; j++) {
    for (let i = 0; i < totalBlocks; i++) {
      const cwLen = i < g1Blocks ? g1DataCW : g2DataCW
      if (j < cwLen) {
        blocks[i].push(rawBytes[offset++])
      }
    }
  }

  // Read EC codewords
  for (let j = 0; j < ecPerBlock; j++) {
    for (let i = 0; i < totalBlocks; i++) {
      ecBlocks[i].push(rawBytes[offset++])
    }
  }

  // RS decode each block
  const decodedBlocks: number[][] = []
  for (let i = 0; i < totalBlocks; i++) {
    const block = [...blocks[i], ...ecBlocks[i]]
    const decoded = rsDecode(block, ecPerBlock)
    if (!decoded)
      return null
    decodedBlocks.push(decoded)
  }

  // Interleave data codewords back
  const dataBytes: number[] = []
  for (let j = 0; j < maxDataCW; j++) {
    for (let i = 0; i < totalBlocks; i++) {
      if (j < decodedBlocks[i].length) {
        dataBytes.push(decodedBlocks[i][j])
      }
    }
  }

  // Convert to bit stream and decode
  const bits: number[] = []
  for (const byte of dataBytes) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1)
  }

  // Read mode indicator (4 bits)
  if (bits.length < 4)
    return null
  const mode = (bits[0] << 3) | (bits[1] << 2) | (bits[2] << 1) | bits[3]
  if (mode !== 4)
    return null // Only Byte mode supported for now

  // Read character count
  const ccBits = version <= 9 ? 8 : 16
  let charCount = 0
  for (let i = 0; i < ccBits; i++) {
    charCount = (charCount << 1) | bits[4 + i]
  }

  // Read data bytes
  const dataStart = 4 + ccBits
  const dataBits = charCount * 8
  const resultBytes: number[] = []
  for (let i = 0; i < dataBits; i += 8) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (bits[dataStart + i + b] || 0)
    }
    resultBytes.push(byte)
  }

  return utf8Decode(resultBytes)
}

export function readQRCode(input: ImageInput): string | null {
  const { data, width, height } = input

  // Binarize
  const binary = binarize(
    data instanceof Uint8Array || data instanceof Uint8ClampedArray
      ? Array.from(data)
      : data,
    width,
    height,
  )

  // Find finder patterns
  const centers = findFinderCenters(binary)
  if (centers.length < 3)
    return null

  const [tl, tr, bl] = centers.length === 3 ? centers : orderFinderPatterns(centers)

  // Estimate module size from finder pattern width
  const ms = tl.w / 7

  // Estimate version from finder distance
  const hDist = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2)
  const modulesBetween = Math.round(hDist / ms)
  const estDim = modulesBetween + 7
  let version = Math.round((estDim - 17) / 4)
  version = Math.max(1, Math.min(40, version))

  // Read modules
  const modules = readQRModules(binary, tl, tr, bl, version * 4 + 17)

  // Read format info to get EC level and mask
  const fmt = readFormatInfo(modules)
  if (!fmt)
    return null

  // Unmask
  unmask(modules, fmt.mask)

  // Extract raw bytes
  const rawBytes = extractData(modules, version)

  // Decode
  return decodeQRData(rawBytes, version, fmt.ecLevel)
}
