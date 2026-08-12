// ===================== Data Encoding (Byte Mode) =====================

import type { ECLevel } from './types'
import { EC_BLOCK } from './qrTables'
import { rsEncode } from './reedSolomon'

export function getDataCapacity(version: number, ecLevel: ECLevel): number {
  const info = EC_BLOCK[version][ecLevel]
  return info[1] * info[2] + info[3] * info[4]
}

export function chooseVersion(text: string, ecLevel: ECLevel): number {
  const byteLen = utf8Encode(text).length
  for (let v = 1; v <= 40; v++) {
    const capacity = getDataCapacity(v, ecLevel)
    const ccBits = v <= 9 ? 8 : 16
    // Account for terminator (up to 4 zero bits) and padding to byte boundary
    const totalBits = 4 + ccBits + byteLen * 8
    const neededBytes = Math.ceil(totalBits / 8)
    if (neededBytes <= capacity)
      return v
  }
  throw new Error('Data too long for QR code')
}

export function encodeData(text: string, version: number, ecLevel: ECLevel): number[] {
  const capacity = getDataCapacity(version, ecLevel)
  const ccBits = version <= 9 ? 8 : 16

  // Convert text to bytes (UTF-8)
  const bytes = utf8Encode(text)

  // Build bit stream
  const bits: number[] = []

  // Mode indicator (byte = 0100)
  bits.push(0, 1, 0, 0)

  // Character count
  for (let i = ccBits - 1; i >= 0; i--) {
    bits.push((bytes.length >> i) & 1)
  }

  // Data
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1)
    }
  }

  // Terminator (up to 4 zero bits)
  const terminatorLen = Math.min(4, capacity * 8 - bits.length)
  for (let i = 0; i < terminatorLen; i++) bits.push(0)

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0)

  // Convert to bytes
  const dataBytes: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0)
    dataBytes.push(byte)
  }

  // Pad with alternating 0xEC, 0x11
  const padBytes = [0xEC, 0x11]
  let padIdx = 0
  while (dataBytes.length < capacity) {
    dataBytes.push(padBytes[padIdx % 2])
    padIdx++
  }

  return dataBytes
}

export function utf8Encode(str: string): number[] {
  return Array.from(new TextEncoder().encode(str))
}

export function utf8Decode(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes))
}

// ===================== EC Encoding + Interleaving =====================

export function addECAndInterleave(dataBytes: number[], version: number, ecLevel: ECLevel): number[] {
  const info = EC_BLOCK[version][ecLevel]
  const [ecPerBlock, g1Blocks, g1DataCW, g2Blocks, g2DataCW] = info

  const blocks: number[][] = []
  let offset = 0
  for (let i = 0; i < g1Blocks; i++) {
    blocks.push(dataBytes.slice(offset, offset + g1DataCW))
    offset += g1DataCW
  }
  for (let i = 0; i < g2Blocks; i++) {
    blocks.push(dataBytes.slice(offset, offset + g2DataCW))
    offset += g2DataCW
  }

  // Generate EC for each block
  const ecBlocks: number[][] = blocks.map(block => rsEncode(block, ecPerBlock))

  // Interleave data codewords
  const result: number[] = []
  const maxDataCW = Math.max(g1DataCW, g2DataCW || 0)
  for (let j = 0; j < maxDataCW; j++) {
    for (const block of blocks) {
      if (j < block.length)
        result.push(block[j])
    }
  }

  // Interleave EC codewords
  for (let j = 0; j < ecPerBlock; j++) {
    for (const ec of ecBlocks) {
      result.push(ec[j])
    }
  }

  return result
}
