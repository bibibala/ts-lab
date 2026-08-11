/**
 * Watermark configuration options.
 */
export interface WatermarkOptions {
  /** Watermark text, supports multi-line via string array */
  text: string | string[]
  /** Canvas tile width, auto-calculated when omitted */
  width?: number
  /** Canvas tile height, auto-calculated when omitted */
  height?: number
  /** Rotation angle in degrees, default -30 */
  rotate?: number
  /** Text opacity (0–1), default 0.15 */
  opacity?: number
  /** Font size in px, default 16 */
  fontSize?: number
  /** Text color, default '#000' */
  color?: string
  /**
   * Manual shorthand for text color: 'light' → white text (use on dark
   * backgrounds), 'dark' → black text (use on light backgrounds).
   * Overrides `color` when set. Default 'dark'.
   */
  colorScheme?: 'light' | 'dark'
  /** Font family, default 'sans-serif' */
  fontFamily?: string
  /** Tile gap [horizontal, vertical] in px, default [200, 150] */
  gap?: [number, number]
  /** Enable MutationObserver tamper protection, default true */
  protect?: boolean
  /** User ID for invisible watermark payload */
  userId?: string
  /** Auto-refresh at interval, default false */
  dynamic?: boolean
  /** Refresh interval in ms, default 30000 */
  interval?: number
  /** z-index of the watermark layer, default 9999 */
  zIndex?: number
  /**
   * EXPERIMENTAL — also embed the `userId` hash as an invisible pixel-domain
   * watermark (in addition to the visible text). Requires `userId`. No
   * decoder ships yet — this only proves the embedding step works. Not
   * robust against aggressive recompression, resizing, or adversarial
   * removal. Default false.
   */
  invisibleId?: boolean
  /**
   * DEBUG ONLY — renders the invisible pattern at a far higher amplitude so
   * the block grid becomes visible to the naked eye, to let you confirm the
   * embedding logic is producing a sane pattern. Never enable in
   * production — it defeats the purpose of being invisible. Default false.
   */
  stegoDebug?: boolean
}

/**
 * Watermark instance returned by createWatermark.
 */
export interface WatermarkInstance {
  /** Update watermark with partial options (merged with current) */
  update: (options: Partial<WatermarkOptions>) => void
  /** Destroy watermark and release all resources */
  destroy: () => void
  /** Show the watermark layer */
  show: () => void
  /** Hide the watermark layer */
  hide: () => void
}

/** Resolved options with all defaults filled */
export interface ResolvedOptions {
  text: string[]
  width?: number
  height?: number
  rotate: number
  opacity: number
  fontSize: number
  color: string
  colorScheme?: 'light' | 'dark'
  fontFamily: string
  gap: [number, number]
  protect: boolean
  userId?: string
  dynamic: boolean
  interval: number
  zIndex: number
  invisibleId: boolean
  stegoDebug: boolean
}

export const DEFAULTS = {
  rotate: -30,
  opacity: 0.15,
  fontSize: 16,
  color: '#000',
  colorScheme: 'light' as 'light' | 'dark',
  fontFamily: 'sans-serif',
  gap: [200, 150] as [number, number],
  protect: true,
  dynamic: false,
  interval: 30000,
  zIndex: 9999,
  invisibleId: false,
  stegoDebug: false,
} as const
