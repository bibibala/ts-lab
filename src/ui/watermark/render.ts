import type { ResolvedOptions, WatermarkOptions } from './types'
import { embedInvisibleCode } from './stego'
import { DEFAULTS } from './types'

// ---------------------------------------------------------------------------
// Options resolution
// ---------------------------------------------------------------------------

export function resolveOptions(raw: WatermarkOptions): ResolvedOptions {
  const text = Array.isArray(raw.text) ? [...raw.text] : [raw.text]
  return {
    text,
    width: raw.width,
    height: raw.height,
    rotate: raw.rotate ?? DEFAULTS.rotate,
    opacity: raw.opacity ?? DEFAULTS.opacity,
    fontSize: raw.fontSize ?? DEFAULTS.fontSize,
    color: raw.color ?? DEFAULTS.color,
    colorScheme: raw.colorScheme ?? DEFAULTS.colorScheme,
    fontFamily: raw.fontFamily ?? DEFAULTS.fontFamily,
    gap: raw.gap ?? DEFAULTS.gap,
    protect: raw.protect ?? DEFAULTS.protect,
    userId: raw.userId,
    dynamic: raw.dynamic ?? DEFAULTS.dynamic,
    interval: raw.interval ?? DEFAULTS.interval,
    zIndex: raw.zIndex ?? DEFAULTS.zIndex,
    invisibleId: raw.invisibleId ?? DEFAULTS.invisibleId,
    stegoDebug: raw.stegoDebug ?? DEFAULTS.stegoDebug,
  }
}

// ---------------------------------------------------------------------------
// Identity hash
// ---------------------------------------------------------------------------

function djb2Hash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

export async function computeIdentityCode(userId: string): Promise<number> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(userId)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return Number.parseInt(fullHash.slice(0, 4), 16)
  }
  catch {
    return djb2Hash(userId) & 0xFFFF
  }
}

export async function resolveLines(options: ResolvedOptions): Promise<{ lines: string[], code: number | null }> {
  if (!options.userId)
    return { lines: [...options.text], code: null }
  const code = await computeIdentityCode(options.userId)
  return { lines: [...options.text], code }
}

// ---------------------------------------------------------------------------
// Canvas rendering
// ---------------------------------------------------------------------------

export function renderCanvas(options: ResolvedOptions, lines: string[], stegoCode: number | null = null): string {
  const { width, height, rotate, fontSize, color, fontFamily, gap } = options

  if (lines.length === 0)
    return ''

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const font = `${fontSize}px ${fontFamily}`
  ctx.font = font

  let maxWidth = 0
  for (const line of lines) {
    const m = ctx.measureText(line)
    if (m.width > maxWidth)
      maxWidth = m.width
  }

  const lineHeight = fontSize * 1.5
  const padding = fontSize * 2
  const canvasWidth = width ?? Math.max(maxWidth + padding, gap[0])
  const canvasHeight = height ?? Math.max(lines.length * lineHeight + padding, gap[1])

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  ctx.font = font

  // Opaque background: every pixel α=255 so watermark survives pre-multiplied
  // alpha in screenshots. Background must contrast with text color.
  const bgColor = options.colorScheme === 'light' ? '#000000' : '#ffffff'
  const textColor = options.colorScheme === 'light' ? '#ffffff' : color
  ctx.globalAlpha = 1
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Text at full alpha; visual opacity via CSS on the container
  ctx.fillStyle = textColor
  ctx.globalAlpha = 1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.translate(canvasWidth / 2, canvasHeight / 2)
  ctx.rotate((rotate * Math.PI) / 180)

  const totalHeight = lines.length * lineHeight
  const startY = -totalHeight / 2 + lineHeight / 2

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 0, startY + i * lineHeight)
  }

  if (options.invisibleId && stegoCode !== null) {
    embedInvisibleCode(canvas, stegoCode, options.stegoDebug)
  }

  return canvas.toDataURL('image/png')
}
