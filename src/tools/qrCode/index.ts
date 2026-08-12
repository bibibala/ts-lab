// ============================================================================
//  Pure TypeScript QR Code Generator & Reader
// ============================================================================

import type { QRCode } from './types'
import { addECAndInterleave, chooseVersion, encodeData } from './encoder'
import { applyMask, buildFunctionPatterns, createMatrix, evaluatePenalty, placeDataBits, placeFormatInfo, placeVersionInfo } from './matrix'
import { ECLevel } from './types'

export { readQRCode } from './reader'
export type { ImageInput, QRCode, RenderOptions } from './types'
export { ECLevel } from './types'

export function generateQRCode(
  text: string,
  ecLevel: ECLevel = ECLevel.M,
  version?: number,
): QRCode {
  const v = version ?? chooseVersion(text, ecLevel)

  // Encode data
  const dataBytes = encodeData(text, v, ecLevel)

  // Add EC and interleave
  const codewords = addECAndInterleave(dataBytes, v, ecLevel)

  // Build matrix with function patterns and data
  const m = createMatrix(v)
  buildFunctionPatterns(m, v)
  placeDataBits(m, codewords)

  // Save unmasked state, then test all masks
  const baseModules = m.modules.map(row => [...row])
  let bestPenalty = Infinity
  let bestMask = 0

  for (let mask = 0; mask < 8; mask++) {
    m.modules = baseModules.map(row => [...row])
    applyMask(m, mask)
    const penalty = evaluatePenalty(m)
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestMask = mask
    }
  }

  // Apply best mask and format/version info
  m.modules = baseModules.map(row => [...row])
  applyMask(m, bestMask)
  placeFormatInfo(m, ecLevel, bestMask)
  placeVersionInfo(m, v)

  return {
    modules: m.modules,
    version: v,
    size: m.size,
    ecLevel,
  }
}

// ===================== Canvas Rendering =====================

export function renderQRCodeToCanvas(
  qr: QRCode,
  canvas: HTMLCanvasElement,
  options: import('./types').RenderOptions = {},
): void {
  const {
    moduleSize = 4,
    margin = 4,
    darkColor = '#000000',
    lightColor = '#ffffff',
  } = options

  const totalSize = qr.size + 2 * margin
  canvas.width = totalSize * moduleSize
  canvas.height = totalSize * moduleSize

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = lightColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = darkColor

  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        ctx.fillRect(
          (c + margin) * moduleSize,
          (r + margin) * moduleSize,
          moduleSize,
          moduleSize,
        )
      }
    }
  }
}

export function renderQRCodeToDataURL(
  qr: QRCode,
  options: import('./types').RenderOptions = {},
): string {
  const canvas = document.createElement('canvas')
  renderQRCodeToCanvas(qr, canvas, options)
  return canvas.toDataURL()
}
