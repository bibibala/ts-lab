type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition
  = | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center'

interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number // ms, default 2000
  position?: ToastPosition
}

const ICON_SVG: Record<ToastType, string> = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5 5.5-5.5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2 21h20L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="16.5" r="0.5" fill="currentColor"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r="0.5" fill="currentColor"/></svg>',
}

const TYPE_COLOR: Record<ToastType, string> = {
  info: '#2196F3',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
}

/**
 * Global Toast utility class.
 * Singleton — manages its own DOM nodes and styles, zero UI framework dependency.
 * Design inspired by Vuetify 3 VSnackbar.
 */
class UIFeedback {
  private static instance: UIFeedback

  private toastContainer: HTMLDivElement | null = null
  private toastPosition: ToastPosition = 'top'
  private styleInjected = false

  private constructor() {
    this.injectStyle()
  }

  static getInstance(): UIFeedback {
    if (!UIFeedback.instance) {
      UIFeedback.instance = new UIFeedback()
    }
    return UIFeedback.instance
  }

  /* ---------------- Style injection ---------------- */
  private injectStyle(): void {
    if (this.styleInjected || typeof document === 'undefined')
      return
    const style = document.createElement('style')
    style.textContent = `
      /* ---- Toast container (overlay layer) ---- */
      .uif-toast-container {
        position: fixed;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        padding: 8px;
      }
      .uif-toast-pos-top {
        top: 0;
        left: 0;
        right: 0;
        align-items: center;
      }
      .uif-toast-pos-bottom {
        bottom: 0;
        left: 0;
        right: 0;
        align-items: center;
        flex-direction: column-reverse;
      }
      .uif-toast-pos-top-left {
        top: 0;
        left: 0;
        align-items: flex-start;
      }
      .uif-toast-pos-top-right {
        top: 0;
        right: 0;
        align-items: flex-end;
      }
      .uif-toast-pos-bottom-left {
        bottom: 0;
        left: 0;
        align-items: flex-start;
        flex-direction: column-reverse;
      }
      .uif-toast-pos-bottom-right {
        bottom: 0;
        right: 0;
        align-items: flex-end;
        flex-direction: column-reverse;
      }
      .uif-toast-pos-center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      /* ---- Toast wrapper (Vuetify .v-snackbar__wrapper) ---- */
      .uif-toast-item {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        max-width: 672px;
        min-height: 48px;
        min-width: 344px;
        overflow: hidden;
        position: relative;
        pointer-events: auto;

        /* Surface variant background */
        background: #333333;
        color: #fff;

        /* Elevation 2 */
        box-shadow:
          0px 3px 1px -2px rgba(0, 0, 0, 0.2),
          0px 2px 2px 0px rgba(0, 0, 0, 0.14),
          0px 1px 5px 0px rgba(0, 0, 0, 0.12);

        /* Border radius — Material default */
        border-radius: 4px;

        /* Typography — body-medium */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        font-weight: 400;
        letter-spacing: 0.0178571429em;
        line-height: 1.4285714286;

        /* Transition — Vuetify decelerated easing, scale enter */
        opacity: 0;
        transform: scale(0.8);
        transition:
          opacity 0.15s cubic-bezier(0, 0, 0.2, 1),
          transform 0.15s cubic-bezier(0, 0, 0.2, 1);
      }
      .uif-toast-item.uif-show {
        opacity: 1;
        transform: scale(1);
      }
      .uif-toast-pos-top .uif-toast-item,
      .uif-toast-pos-top-left .uif-toast-item,
      .uif-toast-pos-top-right .uif-toast-item {
        transform-origin: center top;
      }
      .uif-toast-pos-bottom .uif-toast-item,
      .uif-toast-pos-bottom-left .uif-toast-item,
      .uif-toast-pos-bottom-right .uif-toast-item {
        transform-origin: center bottom;
      }

      /* ---- Content area ---- */
      .uif-toast-content {
        flex: 1 1;
        padding: 14px 16px;
        min-width: 0;
        word-break: break-word;
      }

      /* ---- Prepend icon ---- */
      .uif-toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        margin-inline: 16px 12px;
        flex-shrink: 0;
      }
      .uif-toast-icon svg {
        width: 24px;
        height: 24px;
      }

      /* ---- Timer — VProgressLinear style ---- */
      .uif-toast-timer {
        width: 100%;
        position: absolute;
      }
      .uif-toast-timer--top {
        top: 0;
      }
      .uif-toast-timer--bottom {
        bottom: 0;
      }
      .uif-toast-timer-bar {
        width: 100%;
        height: 100%;
        transform-origin: left;
        transition: transform linear;
      }

      /* ---- Type color variants (icon + timer bar color) ---- */
      .uif-toast-info .uif-toast-icon { color: #2196F3; }
      .uif-toast-success .uif-toast-icon { color: #4CAF50; }
      .uif-toast-error .uif-toast-icon { color: #F44336; }
      .uif-toast-warning .uif-toast-icon { color: #FF9800; }
    `
    document.head.appendChild(style)
    this.styleInjected = true
  }

  /* ---------------- Toast ---------------- */
  toast(options: ToastOptions | string): void {
    if (typeof document === 'undefined')
      return

    const opts: ToastOptions
      = typeof options === 'string' ? { message: options } : options
    const { message, type = 'info', duration = 2000, position = 'top' } = opts

    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div')
      this.toastPosition = position
      this.toastContainer.className = `uif-toast-container uif-toast-pos-${this.toastPosition}`
      document.body.appendChild(this.toastContainer)
    }
    else if (position !== this.toastPosition) {
      this.toastPosition = position
      this.toastContainer.className = `uif-toast-container uif-toast-pos-${position}`
    }

    const item = document.createElement('div')
    item.className = `uif-toast-item uif-toast-${type}`

    // Timer bar (top)
    const timerWrap = document.createElement('div')
    timerWrap.className = 'uif-toast-timer uif-toast-timer--top'
    const timerBar = document.createElement('div')
    timerBar.className = 'uif-toast-timer-bar'
    timerBar.style.background = TYPE_COLOR[type]
    timerBar.style.transform = 'scaleX(1)'
    timerBar.style.transitionDuration = `${duration}ms`
    timerWrap.appendChild(timerBar)
    item.appendChild(timerWrap)

    // Prepend icon
    const icon = document.createElement('span')
    icon.className = 'uif-toast-icon'
    icon.innerHTML = ICON_SVG[type]
    item.appendChild(icon)

    // Content
    const content = document.createElement('div')
    content.className = 'uif-toast-content'
    content.textContent = message
    item.appendChild(content)

    this.toastContainer.appendChild(item)

    // Trigger enter animation
    requestAnimationFrame(() => {
      item.classList.add('uif-show')
      // Start timer bar
      requestAnimationFrame(() => {
        timerBar.style.transform = 'scaleX(0)'
      })
    })

    // Remove after duration
    setTimeout(() => {
      let done = false
      const remove = (): void => {
        if (done)
          return
        done = true
        item.remove()
        if (this.toastContainer && this.toastContainer.childElementCount === 0) {
          this.toastContainer.remove()
          this.toastContainer = null
        }
      }
      item.addEventListener('transitionend', remove, { once: true })
      // fallback in case transitionend doesn't fire (e.g. jsdom)
      setTimeout(remove, 250)
      item.classList.remove('uif-show')
    }, duration)
  }

  success(message: string, duration?: number, position?: ToastPosition): void {
    this.toast({ message, type: 'success', duration, position })
  }

  error(message: string, duration?: number, position?: ToastPosition): void {
    this.toast({ message, type: 'error', duration, position })
  }

  warning(message: string, duration?: number, position?: ToastPosition): void {
    this.toast({ message, type: 'warning', duration, position })
  }

  info(message: string, duration?: number, position?: ToastPosition): void {
    this.toast({ message, type: 'info', duration, position })
  }
}

export const uiFeedback = UIFeedback.getInstance()
