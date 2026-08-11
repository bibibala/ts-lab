export type ProgressColor = string | string[]

interface ProgressOptions {
  /**
   * Bar color.
   * - `string` — solid color, default `'#29d'`
   * - `string[]` — left-to-right gradient, e.g. `['#29d', '#06f']` or rainbow `['#f00','#ff0','#0f0','#0ff','#00f','#f0f']`
   */
  color?: ProgressColor
  /** Bar height in px, default 3 */
  height?: number
  /** CSS transition speed in ms, default 200 */
  speed?: number
  /** Auto increment with trickle, default true */
  trickle?: boolean
  /** Trickle interval in ms, default 200 */
  trickleSpeed?: number
  /** Minimum starting percentage, default 0.08 */
  minimum?: number
  /** CSS easing function, default 'ease' */
  easing?: string
}

type ProgressStatus = 'idle' | 'running'

function resolveBackground(color: ProgressColor): string {
  if (Array.isArray(color)) {
    return `linear-gradient(to right, ${color.join(', ')})`
  }
  return color
}

function resolveGlow(color: ProgressColor): string {
  const c = Array.isArray(color) ? color[color.length - 1] : color
  return c
}

/**
 * NProgress-style top-of-page progress bar.
 * Singleton — manages its own DOM and CSS, zero UI framework dependency.
 */
class ProgressBar {
  private static instance: ProgressBar

  private bar: HTMLDivElement | null = null
  private percent = 0
  private status: ProgressStatus = 'idle'
  private trickleTimer: ReturnType<typeof setTimeout> | null = null
  private styleInjected = false

  private options: Required<Omit<ProgressOptions, 'color'>> & { color: ProgressColor } = {
    color: '#29d',
    height: 3,
    speed: 200,
    trickle: true,
    trickleSpeed: 200,
    minimum: 0.08,
    easing: 'ease',
  }

  private constructor() {
    if (typeof document !== 'undefined') {
      this.injectBaseStyle()
    }
  }

  static getInstance(): ProgressBar {
    if (!ProgressBar.instance) {
      ProgressBar.instance = new ProgressBar()
    }
    return ProgressBar.instance
  }

  /* ---------------- Base style (layout only, no colors) ---------------- */
  private injectBaseStyle(): void {
    if (this.styleInjected || typeof document === 'undefined')
      return
    const style = document.createElement('style')
    style.textContent = `
      .tsl-progress {
        pointer-events: none;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 99999;
        width: 100%;
        height: ${this.options.height}px;
      }
      .tsl-progress-bar {
        width: 0%;
        height: 100%;
        transition: width ${this.options.speed}ms ${this.options.easing};
      }
    `
    document.head.appendChild(style)
    this.styleInjected = true
  }

  /* ---------------- Public API ---------------- */

  /**
   * Start the progress. Resets any previous state and begins trickle.
   */
  start(): void {
    if (typeof document === 'undefined')
      return

    this.stopTrickle()

    if (!this.bar) {
      this.bar = document.createElement('div')
      this.bar.className = 'tsl-progress'
      const inner = document.createElement('div')
      inner.className = 'tsl-progress-bar'
      const bg = resolveBackground(this.options.color)
      const glow = resolveGlow(this.options.color)
      inner.style.background = bg
      inner.style.boxShadow = `0 0 10px ${glow}, 0 0 5px ${glow}`
      this.bar.appendChild(inner)
      document.body.appendChild(this.bar)
    }

    this.status = 'running'
    this.set(this.options.minimum * 100)

    if (this.options.trickle) {
      this.trickle()
    }
  }

  /**
   * Complete the progress and hide the bar.
   */
  done(): void {
    if (this.status !== 'running')
      return

    this.stopTrickle()
    this.set(100)

    // Hide bar after transition completes
    setTimeout(() => {
      this.resetBar()
    }, this.options.speed + 50)
  }

  /**
   * Set progress to a specific percentage (0–100).
   * Values outside [0, 100] are clamped.
   */
  set(n: number): void {
    if (this.status !== 'running')
      return
    this.percent = Math.max(0, Math.min(100, n))
    this.render()
  }

  /**
   * Increment the progress by a given amount.
   * If no amount is given, a small random increment is used.
   */
  inc(amount?: number): void {
    if (this.status !== 'running')
      return

    const increment = amount ?? this.randomInc()
    let n = this.percent + increment
    // Slow down as we approach 100
    if (n > 95) {
      n = this.percent + (100 - this.percent) * 0.1
    }
    this.set(n)
  }

  /**
   * Update runtime options. Takes effect on the next `start()` call.
   */
  configure(opts: Partial<ProgressOptions>): void {
    if (opts.color !== undefined) {
      this.options.color = opts.color
    }
    if (opts.height !== undefined)
      this.options.height = opts.height
    if (opts.speed !== undefined)
      this.options.speed = opts.speed
    if (opts.trickle !== undefined)
      this.options.trickle = opts.trickle
    if (opts.trickleSpeed !== undefined)
      this.options.trickleSpeed = opts.trickleSpeed
    if (opts.minimum !== undefined)
      this.options.minimum = opts.minimum
    if (opts.easing !== undefined)
      this.options.easing = opts.easing
  }

  /* ---------------- Internal ---------------- */

  private render(): void {
    if (!this.bar)
      return
    const barEl = this.bar.firstElementChild as HTMLElement | null
    if (barEl) {
      barEl.style.width = `${this.percent}%`
    }
  }

  private resetBar(): void {
    this.status = 'idle'
    this.percent = 0
    if (this.bar) {
      this.bar.remove()
      this.bar = null
    }
  }

  private stopTrickle(): void {
    if (this.trickleTimer !== null) {
      clearTimeout(this.trickleTimer)
      this.trickleTimer = null
    }
  }

  private trickle(): void {
    if (this.status !== 'running')
      return
    this.inc()
    this.trickleTimer = setTimeout(() => this.trickle(), this.options.trickleSpeed)
  }

  private randomInc(): number {
    // Returns a random increment between 0.5 and 3
    return Math.random() * 2.5 + 0.5
  }

  /** Exposed for testing */
  _reset(): void {
    this.stopTrickle()
    this.resetBar()
    this.styleInjected = false
  }
}

export const progress = ProgressBar.getInstance()
export type { ProgressOptions }
