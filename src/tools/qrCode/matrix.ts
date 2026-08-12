// ===================== Matrix Construction =====================

import type { ECLevel } from './types'
import { ALIGN_POS } from './qrTables'

export interface QRMatrix {
  size: number
  modules: boolean[][]
  isFunction: boolean[][]
}

export function createMatrix(version: number): QRMatrix {
  const size = version * 4 + 17
  const modules: boolean[][] = Array.from({ length: size }, () => {
    const row: boolean[] = []
    row.length = size
    return row.fill(false)
  })
  const isFunction: boolean[][] = Array.from({ length: size }, () => {
    const row: boolean[] = []
    row.length = size
    return row.fill(false)
  })
  return { size, modules, isFunction }
}

function setModule(m: QRMatrix, row: number, col: number, dark: boolean, isFunc: boolean): void {
  m.modules[row][col] = dark
  if (isFunc)
    m.isFunction[row][col] = true
}

function placeFinderPattern(m: QRMatrix, row: number, col: number): void {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const r = row + dr
      const c = col + dc
      if (r < 0 || r >= m.size || c < 0 || c >= m.size)
        continue
      const dark = (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6))
        || (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6))
        || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
      setModule(m, r, c, dark, true)
    }
  }
}

function placeAlignmentPattern(m: QRMatrix, row: number, col: number): void {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)
      setModule(m, row + dr, col + dc, dark, true)
    }
  }
}

function placeTimingPatterns(m: QRMatrix): void {
  for (let i = 8; i < m.size - 8; i++) {
    const dark = i % 2 === 0
    if (!m.isFunction[6][i])
      setModule(m, 6, i, dark, true)
    if (!m.isFunction[i][6])
      setModule(m, i, 6, dark, true)
  }
}

function reserveFormatArea(m: QRMatrix): void {
  // Around top-left finder pattern
  for (let i = 0; i <= 8; i++) {
    if (!m.isFunction[8][i]) {
      m.isFunction[8][i] = true
    }
    if (!m.isFunction[i][8]) {
      m.isFunction[i][8] = true
    }
  }
  // Around top-right finder pattern
  for (let i = m.size - 8; i < m.size; i++) {
    if (!m.isFunction[8][i]) {
      m.isFunction[8][i] = true
    }
  }
  // Around bottom-left finder pattern
  for (let i = m.size - 7; i < m.size; i++) {
    if (!m.isFunction[i][8]) {
      m.isFunction[i][8] = true
    }
  }
  // Dark module
  setModule(m, m.size - 8, 8, true, true)
}

function reserveVersionArea(m: QRMatrix, version: number): void {
  if (version < 7)
    return
  // Two 6x3 areas
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      m.isFunction[i][m.size - 11 + j] = true
      m.isFunction[m.size - 11 + j][i] = true
    }
  }
}

export function buildFunctionPatterns(m: QRMatrix, version: number): void {
  // Finder patterns
  placeFinderPattern(m, 0, 0)
  placeFinderPattern(m, 0, m.size - 7)
  placeFinderPattern(m, m.size - 7, 0)

  // Alignment patterns
  if (version >= 2) {
    const positions = ALIGN_POS[version]
    for (const row of positions) {
      for (const col of positions) {
        // Skip if overlapping with finder patterns
        if (row <= 8 && col <= 8)
          continue // top-left
        if (row <= 8 && col >= m.size - 8)
          continue // top-right
        if (row >= m.size - 8 && col <= 8)
          continue // bottom-left
        placeAlignmentPattern(m, row, col)
      }
    }
  }

  // Timing patterns
  placeTimingPatterns(m)

  // Format info area
  reserveFormatArea(m)

  // Version info area
  reserveVersionArea(m, version)
}

// Data placement
function getDataBits(m: QRMatrix): [number, number][] {
  const positions: [number, number][] = []
  let upward = true

  for (let right = m.size - 1; right >= 1; right -= 2) {
    if (right === 6)
      right = 5

    for (let vert = 0; vert < m.size; vert++) {
      const row = upward ? (m.size - 1 - vert) : vert
      for (let j = 0; j < 2; j++) {
        const col = right - j
        if (col >= 0 && !m.isFunction[row][col]) {
          positions.push([row, col])
        }
      }
    }
    upward = !upward
  }

  return positions
}

export function placeDataBits(m: QRMatrix, data: number[]): void {
  const positions = getDataBits(m)

  // Convert data to bits
  const bits: boolean[] = []
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) bits.push(((byte >> i) & 1) === 1)
  }

  // Place bits
  for (let i = 0; i < positions.length; i++) {
    const [row, col] = positions[i]
    m.modules[row][col] = i < bits.length ? bits[i] : false
  }
}

// ===================== Masking =====================

export const MASK_FNS = [
  (r: number, c: number) => (r + c) % 2 === 0,
  (r: number, _c: number) => r % 2 === 0,
  (r: number, c: number) => c % 3 === 0,
  (r: number, c: number) => (r + c) % 3 === 0,
  (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) === 0,
  (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
  (r: number, c: number) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
]

export function applyMask(m: QRMatrix, maskIdx: number): void {
  const fn = MASK_FNS[maskIdx]
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (!m.isFunction[r][c] && fn(r, c)) {
        m.modules[r][c] = !m.modules[r][c]
      }
    }
  }
}

export function evaluatePenalty(m: QRMatrix): number {
  let penalty = 0
  const size = m.size

  // Rule 1: runs of same color
  for (let r = 0; r < size; r++) {
    let run = 1
    for (let c = 1; c < size; c++) {
      if (m.modules[r][c] === m.modules[r][c - 1]) {
        run++
      }
      else {
        if (run >= 5)
          penalty += run - 2
        run = 1
      }
    }
    if (run >= 5)
      penalty += run - 2
  }
  for (let c = 0; c < size; c++) {
    let run = 1
    for (let r = 1; r < size; r++) {
      if (m.modules[r][c] === m.modules[r - 1][c]) {
        run++
      }
      else {
        if (run >= 5)
          penalty += run - 2
        run = 1
      }
    }
    if (run >= 5)
      penalty += run - 2
  }

  // Rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m.modules[r][c]
      if (v === m.modules[r][c + 1] && v === m.modules[r + 1][c] && v === m.modules[r + 1][c + 1]) {
        penalty += 3
      }
    }
  }

  // Rule 3: finder-like patterns
  const pattern1 = [true, false, true, true, true, false, true, false, false, false, false]
  const pattern2 = [false, false, false, false, true, false, true, true, true, false, true]
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      let match1 = true
      let match2 = true
      for (let k = 0; k < 11; k++) {
        if (m.modules[r][c + k] !== pattern1[k])
          match1 = false
        if (m.modules[r][c + k] !== pattern2[k])
          match2 = false
      }
      if (match1 || match2)
        penalty += 40
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 11; r++) {
      let match1 = true
      let match2 = true
      for (let k = 0; k < 11; k++) {
        if (m.modules[r + k][c] !== pattern1[k])
          match1 = false
        if (m.modules[r + k][c] !== pattern2[k])
          match2 = false
      }
      if (match1 || match2)
        penalty += 40
    }
  }

  // Rule 4: proportion of dark modules
  let dark = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (m.modules[r][c])
        dark++
    }
  }
  const percent = dark * 100 / (size * size)
  const prev5 = Math.floor(percent / 5) * 5
  const next5 = prev5 + 5
  penalty += Math.min(Math.abs(prev5 - 50) / 5, Math.abs(next5 - 50) / 5) * 10

  return penalty
}

// ===================== Format & Version Info =====================

export function placeFormatInfo(m: QRMatrix, ecLevel: ECLevel, maskIdx: number): void {
  // 5-bit data: EC level (2 bits) + mask pattern (3 bits)
  const ecBits = [1, 0, 3, 2]
  const data = (ecBits[ecLevel] << 3) | maskIdx

  // BCH(15,5) encoding with generator 0x537
  let bits = data << 10
  for (let i = 14; i >= 10; i--) {
    if (bits & (1 << i))
      bits ^= (0x537 << (i - 10))
  }
  bits |= (data << 10)

  // XOR with mask pattern 0x5412
  bits ^= 0x5412

  // First copy (around top-left finder)
  const first: [number, number][] = [
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

  // Second copy (split across bottom-left and top-right)
  const s = m.size
  const second: [number, number][] = [
    [s - 1, 8],
    [s - 2, 8],
    [s - 3, 8],
    [s - 4, 8],
    [s - 5, 8],
    [s - 6, 8],
    [s - 7, 8],
    [8, s - 8],
    [8, s - 7],
    [8, s - 6],
    [8, s - 5],
    [8, s - 4],
    [8, s - 3],
    [8, s - 2],
    [8, s - 1],
  ]

  // ISO/IEC 18004: format bits are placed MSB (bit 14) first
  for (let i = 0; i < 15; i++) {
    const dark = ((bits >> (14 - i)) & 1) === 1
    const [r1, c1] = first[i]
    const [r2, c2] = second[i]
    m.modules[r1][c1] = dark
    m.modules[r2][c2] = dark
  }
}

export function placeVersionInfo(m: QRMatrix, version: number): void {
  if (version < 7)
    return

  // BCH(18,6) encoding with generator 0x1F25
  let bits = version << 12
  for (let i = 17; i >= 12; i--) {
    if (bits & (1 << i))
      bits ^= (0x1F25 << (i - 12))
  }
  bits |= (version << 12)

  // Place in two 6x3 areas (bottom-left and top-right)
  for (let i = 0; i < 18; i++) {
    const dark = ((bits >> i) & 1) === 1
    const row = Math.floor(i / 3)
    const col = i % 3
    // bottom-left area
    m.modules[row][m.size - 11 + col] = dark
    // top-right area
    m.modules[m.size - 11 + row][col] = dark
  }
}
