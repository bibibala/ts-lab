/**
 * Global Loading mask utility.
 * Singleton — manages its own DOM nodes and styles, zero UI framework dependency.
 */
class Loading {
  private static instance: Loading

  private mask: HTMLDivElement | null = null
  private count = 0
  private styleInjected = false

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
    if (this.styleInjected || typeof document === 'undefined')
      return
    const style = document.createElement('style')
    style.textContent = `
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
        padding: 32px 40px;
        max-width: calc(100vw - 40px);
        box-sizing: border-box;
        background: rgba(0,0,0,0.65);
        border-radius: 12px;
      }
      .tsl-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255,255,255,0.2);
        border-top-color: #fff;
        border-radius: 50%;
        animation: tsl-spin 0.7s linear infinite;
      }
      .tsl-loading-text {
        color: #fff;
        font-size: 14px;
        max-width: 260px;
        text-align: center;
        line-height: 1.4;
        word-break: break-word;
      }
      @keyframes tsl-spin {
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
    this.styleInjected = true
  }

  /* ---------------- Public API ---------------- */

  /**
   * Show a global loading mask. Supports nested calls via an internal counter.
   * The full-screen fixed mask with pointer-events:auto naturally blocks
   * all clicks from reaching elements underneath.
   * @param text Optional description text shown below the spinner.
   */
  show(text?: string): void {
    if (typeof document === 'undefined')
      return
    this.count++

    if (!this.mask) {
      this.mask = document.createElement('div')
      this.mask.className = 'tsl-loading-mask'

      const box = document.createElement('div')
      box.className = 'tsl-loading-box'

      const spinner = document.createElement('div')
      spinner.className = 'tsl-loading-spinner'
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
    this.styleInjected = false
  }
}

export const loading = Loading.getInstance()
