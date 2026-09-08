/**
 * Global Loading mask utility.
 * Singleton — manages its own DOM nodes and styles, zero UI framework dependency.
 */

type SpinnerType = 'spin' | 'pulse' | 'wave' | 'dots' | 'dual-ring'

interface LoadingOptions {
  spinner?: SpinnerType
  size?: number
}

class Loading {
  private static instance: Loading

  private mask: HTMLDivElement | null = null
  private count = 0
  private styleEl: HTMLStyleElement | null = null

  private constructor() {
    this.injectStyle()
  }

  static getInstance(): Loading {
    if (!Loading.instance) {
      Loading.instance = new Loading()
    }
    return Loading.instance
  }

  /* ---------------- Style injection ---------------- */
  private injectStyle(): void {
    if (typeof document === 'undefined')
      return
    if (!this.styleEl) {
      this.styleEl = document.createElement('style')
      document.head.appendChild(this.styleEl)
    }
    this.styleEl.textContent = `
      .tsl-loading-mask {
        position: fixed;
        inset: 0;
        height: 100dvh;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
      }
      .tsl-loading-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        max-width: calc(100vw - 40px);
        box-sizing: border-box;
      }
      .tsl-loading-text {
        color: #fff;
        font-size: 14px;
        max-width: 260px;
        text-align: center;
        line-height: 1.4;
        word-break: break-word;
      }

      /* spin - 默认旋转动画 */
      .tsl-loading-spinner-spin {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255,255,255,0.2);
        border-top-color: #fff;
        border-radius: 50%;
        animation: tsl-spin 0.7s linear infinite;
      }

      /* pulse - 脉冲动画 */
      .tsl-loading-spinner-pulse {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.8);
        border-radius: 50%;
        animation: tsl-pulse 1.2s ease-in-out infinite;
      }

      /* wave - 波浪动画 */
      .tsl-loading-spinner-wave {
        display: flex;
        gap: 4px;
        align-items: center;
        height: 40px;
      }
      .tsl-loading-spinner-wave .tsl-wave-dot {
        width: 8px;
        height: 8px;
        background: rgba(255,255,255,0.8);
        border-radius: 50%;
        animation: tsl-wave 1.2s ease-in-out infinite;
      }
      .tsl-loading-spinner-wave .tsl-wave-dot:nth-child(2) {
        animation-delay: 0.1s;
      }
      .tsl-loading-spinner-wave .tsl-wave-dot:nth-child(3) {
        animation-delay: 0.2s;
      }

      /* dots - 闪烁点动画 */
      .tsl-loading-spinner-dots {
        display: flex;
        gap: 6px;
        align-items: center;
        height: 40px;
      }
      .tsl-loading-spinner-dots .tsl-dots-dot {
        width: 8px;
        height: 8px;
        background: rgba(255,255,255,0.8);
        border-radius: 50%;
        animation: tsl-dots 1.4s ease-in-out infinite;
      }
      .tsl-loading-spinner-dots .tsl-dots-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .tsl-loading-spinner-dots .tsl-dots-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      /* dual-ring - 双圈动画 */
      .tsl-loading-spinner-dual-ring {
        width: 40px;
        height: 40px;
        position: relative;
      }
      .tsl-loading-spinner-dual-ring::before,
      .tsl-loading-spinner-dual-ring::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        border: 3px solid transparent;
      }
      .tsl-loading-spinner-dual-ring::before {
        inset: 0;
        border-top-color: rgba(255,255,255,0.8);
        animation: tsl-dual-ring 1.2s linear infinite;
      }
      .tsl-loading-spinner-dual-ring::after {
        inset: 6px;
        border-bottom-color: rgba(255,255,255,0.6);
        animation: tsl-dual-ring 1.8s linear infinite reverse;
      }

      @keyframes tsl-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes tsl-pulse {
        0%, 100% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      @keyframes tsl-wave {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes tsl-dots {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }
      @keyframes tsl-dual-ring {
        to { transform: rotate(360deg); }
      }
    `
  }

  /* ---------------- Public API ---------------- */

  /**
   * Show a global loading mask. Supports nested calls via an internal counter.
   * The full-screen fixed mask with pointer-events:auto naturally blocks
   * all clicks from reaching elements underneath.
   * @param text Optional description text shown below the spinner.
   * @param options Optional configuration including spinner type.
   */
  show(text?: string, options?: LoadingOptions): void {
    if (typeof document === 'undefined')
      return
    this.count++

    if (!this.mask) {
      const spinnerType = options?.spinner || 'spin'

      this.mask = document.createElement('div')
      this.mask.className = 'tsl-loading-mask'

      const box = document.createElement('div')
      box.className = 'tsl-loading-box'

      const spinner = document.createElement('div')
      spinner.className = `tsl-loading-spinner tsl-loading-spinner-${spinnerType}`

      if (options?.size) {
        spinner.style.width = `${options.size}px`
        spinner.style.height = `${options.size}px`
      }

      // 为wave和dots类型添加内部元素
      if (spinnerType === 'wave' || spinnerType === 'dots') {
        const dotClass = spinnerType === 'wave' ? 'tsl-wave-dot' : 'tsl-dots-dot'
        const dotSize = options?.size ? Math.max(4, Math.round(options.size / 5)) : 8
        for (let i = 0; i < 3; i++) {
          const dot = document.createElement('div')
          dot.className = dotClass
          dot.style.width = `${dotSize}px`
          dot.style.height = `${dotSize}px`
          spinner.appendChild(dot)
        }
      }

      box.appendChild(spinner)

      if (text) {
        const textEl = document.createElement('div')
        textEl.className = 'tsl-loading-text'
        textEl.textContent = text
        box.appendChild(textEl)
      }

      this.mask.appendChild(box)
      document.body.appendChild(this.mask)
    }
  }

  /**
   * Hide the loading mask. The mask is only removed when the counter reaches 0.
   * Pass force=true to forcibly close (e.g. error recovery).
   */
  hide(force = false): void {
    if (force) {
      this.count = 0
    }
    else {
      this.count = Math.max(0, this.count - 1)
    }
    if (this.count === 0 && this.mask) {
      this.mask.remove()
      this.mask = null
    }
  }

  /** Exposed for testing */
  _reset(): void {
    this.count = 0
    if (this.mask) {
      this.mask.remove()
      this.mask = null
    }
    if (this.styleEl) {
      this.styleEl.remove()
      this.styleEl = null
    }
  }
}

export const loading = Loading.getInstance()
export type { LoadingOptions, SpinnerType }
