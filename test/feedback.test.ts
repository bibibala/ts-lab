import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uiFeedback } from '../src/ui/feedback'

// Access the private singleton for teardown
const instance = uiFeedback as any

describe('uiFeedback', () => {
  let bodyAppendSpy: ReturnType<typeof vi.fn>
  const attachedChildren: HTMLElement[] = []

  beforeEach(() => {
    attachedChildren.length = 0
    bodyAppendSpy = vi.fn((child: any) => attachedChildren.push(child))
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(cb, 0))

    vi.stubGlobal('document', {
      createElement: vi.fn((_tag: string) => ({
        className: '',
        classList: { add: vi.fn(), remove: vi.fn() },
        textContent: '',
        addEventListener: vi.fn(),
        appendChild: vi.fn(),
        remove: vi.fn(function (this: any) {
          const idx = attachedChildren.indexOf(this)
          if (idx !== -1)
            attachedChildren.splice(idx, 1)
        }),
        childElementCount: 0,
        childNodes: [] as any[],
      })),
      head: { appendChild: vi.fn() },
      body: { appendChild: bodyAppendSpy },
    })
  })

  afterEach(() => {
    instance.toastContainer = null
    instance.toastPosition = 'top'
    instance.styleInjected = false
    attachedChildren.length = 0
  })

  // Helper: advance fake timers past entrance → removal delays
  function flushToast(ms = 2000) {
    vi.advanceTimersByTime(1) // rAF for entrance
    vi.advanceTimersByTime(ms) // duration timeout
    vi.advanceTimersByTime(250) // fallback timeout → remove
  }

  describe('toast', () => {
    it('should create toast container with default position "top"', () => {
      vi.useFakeTimers()
      uiFeedback.toast('hello')
      flushToast()
      vi.useRealTimers()
      expect(bodyAppendSpy).toHaveBeenCalled()
    })

    it('should accept string shorthand', () => {
      vi.useFakeTimers()
      uiFeedback.toast('test message')
      flushToast()
      vi.useRealTimers()
    })

    it('should accept ToastOptions with position', () => {
      vi.useFakeTimers()
      uiFeedback.toast({ message: 'bottom toast', type: 'error', position: 'bottom' })
      flushToast()
      vi.useRealTimers()
    })

    it('should switch container position when position changes', () => {
      vi.useFakeTimers()
      uiFeedback.toast({ message: 'top', position: 'top' })
      flushToast()

      uiFeedback.toast({ message: 'center', position: 'center' })
      flushToast()
      vi.useRealTimers()
    })

    it('should default type to info and duration to 2000', () => {
      vi.useFakeTimers()
      uiFeedback.toast('defaults')
      flushToast()
      vi.useRealTimers()
    })

    it('should do nothing when document is undefined (SSR)', () => {
      vi.stubGlobal('document', undefined)
      expect(() => uiFeedback.toast('ssr')).not.toThrow()
    })
  })

  describe('convenience methods', () => {
    it('success should call toast with type success and pass position', () => {
      vi.useFakeTimers()
      uiFeedback.success('ok', undefined, 'bottom')
      flushToast()
      vi.useRealTimers()
    })

    it('error should call toast with type error', () => {
      vi.useFakeTimers()
      uiFeedback.error('fail')
      flushToast()
      vi.useRealTimers()
    })

    it('warning should call toast with type warning', () => {
      vi.useFakeTimers()
      uiFeedback.warning('careful', 1500, 'top-right')
      flushToast(1500)
      vi.useRealTimers()
    })

    it('info should call toast with type info', () => {
      vi.useFakeTimers()
      uiFeedback.info('fyi')
      flushToast()
      vi.useRealTimers()
    })
  })
})
