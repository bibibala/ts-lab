export { loading } from '../loading'

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

const ICON_MAP: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
}

/**
 * Global Toast utility class.
 * Singleton — manages its own DOM nodes and styles, zero UI framework dependency.
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
      /* ---- Toast container positions ---- */
      .uif-toast-container {
        position: fixed;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      }
      .uif-toast-pos-top {
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
      }
      .uif-toast-pos-bottom {
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        flex-direction: column-reverse;
      }
      .uif-toast-pos-top-left {
        top: 24px;
        left: 24px;
        align-items: flex-start;
      }
      .uif-toast-pos-top-right {
        top: 24px;
        right: 24px;
        align-items: flex-end;
      }
      .uif-toast-pos-bottom-left {
        bottom: 24px;
        left: 24px;
        align-items: flex-start;
        flex-direction: column-reverse;
      }
      .uif-toast-pos-bottom-right {
        bottom: 24px;
        right: 24px;
        align-items: flex-end;
        flex-direction: column-reverse;
      }
      .uif-toast-pos-center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      /* ---- Toast item ---- */
      .uif-toast-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        line-height: 1.4;
        max-width: 360px;
        word-break: break-word;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08);
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        pointer-events: auto;
      }
      .uif-toast-item.uif-show {
        opacity: 1;
        transform: translate(0, 0);
      }

      /* entry animation per position */
      .uif-toast-pos-top .uif-toast-item,
      .uif-toast-pos-top-left .uif-toast-item,
      .uif-toast-pos-top-right .uif-toast-item {
        transform: translateY(-12px);
      }
      .uif-toast-pos-bottom .uif-toast-item,
      .uif-toast-pos-bottom-left .uif-toast-item,
      .uif-toast-pos-bottom-right .uif-toast-item {
        transform: translateY(12px);
      }
      .uif-toast-pos-center .uif-toast-item {
        transform: scale(0.9);
      }

      .uif-toast-item .uif-toast-icon {
        flex-shrink: 0;
        font-size: 16px;
        line-height: 1;
      }

      .uif-toast-info    { background: #323233; }
      .uif-toast-success { background: #168a50; }
      .uif-toast-error   { background: #d93025; }
      .uif-toast-warning { background: #e37400; }

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

    const icon = document.createElement('span')
    icon.className = 'uif-toast-icon'
    icon.textContent = ICON_MAP[type]
    item.appendChild(icon)

    const text = document.createElement('span')
    text.textContent = message
    item.appendChild(text)

    this.toastContainer.appendChild(item)

    // Trigger enter animation
    requestAnimationFrame(() => {
      item.classList.add('uif-show')
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
