import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { progress } from '../src/browser/progress'

const instance = progress as any

describe('progress', () => {
  let bodyAppendSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    bodyAppendSpy = vi.fn()
    vi.stubGlobal('document', {
      createElement: vi.fn((_tag: string) => {
        const el = {
          className: '',
          style: {} as Record<string, string>,
          innerHTML: '',
          firstElementChild: null as any,
          appendChild: vi.fn(function (this: any, child: any) {
            this.firstElementChild = child
          }),
          remove: vi.fn(),
        }
        return el
      }),
      head: { appendChild: vi.fn() },
      body: { appendChild: bodyAppendSpy },
    })
  })

  afterEach(() => {
    instance._reset()
  })

  describe('start', () => {
    it('should create the bar element and append to body', () => {
      progress.start()
      expect(bodyAppendSpy).toHaveBeenCalled()
      expect(instance.status).toBe('running')
      expect(instance.bar).not.toBeNull()
    })

    it('should not create duplicate bar on second start', () => {
      progress.start()
      const callCount = bodyAppendSpy.mock.calls.length
      progress.start()
      expect(bodyAppendSpy).toHaveBeenCalledTimes(callCount)
    })

    it('should set percent to minimum after start', () => {
      progress.start()
      expect(instance.percent).toBeGreaterThan(0)
    })

    it('should apply solid color as background', () => {
      progress.configure({ color: '#f00' })
      progress.start()
      const barEl = instance.bar.firstElementChild
      expect(barEl.style.background).toBe('#f00')
    })

    it('should apply gradient for color array', () => {
      progress.configure({ color: ['#f00', '#0f0', '#00f'] })
      progress.start()
      const barEl = instance.bar.firstElementChild
      expect(barEl.style.background).toBe('linear-gradient(to right, #f00, #0f0, #00f)')
    })
  })

  describe('done', () => {
    it('should set percent to 100', () => {
      progress.start()
      progress.done()
      expect(instance.percent).toBe(100)
    })

    it('should reset bar after transition delay', () => {
      vi.useFakeTimers()
      progress.start()
      progress.done()
      expect(instance.bar).not.toBeNull()
      vi.advanceTimersByTime(250)
      expect(instance.status).toBe('idle')
      vi.useRealTimers()
    })

    it('should do nothing when not running', () => {
      progress.done()
      expect(instance.status).toBe('idle')
    })
  })

  describe('set', () => {
    it('should clamp values to [0, 100]', () => {
      progress.start()
      progress.set(-10)
      expect(instance.percent).toBe(0)
      progress.set(150)
      expect(instance.percent).toBe(100)
      progress.set(50)
      expect(instance.percent).toBe(50)
    })

    it('should do nothing when not running', () => {
      progress.set(50)
      expect(instance.percent).toBe(0)
    })
  })

  describe('inc', () => {
    it('should increment by given amount', () => {
      progress.start()
      const prev = instance.percent
      progress.inc(10)
      expect(instance.percent).toBeCloseTo(prev + 10, 0)
    })

    it('should use random increment when no argument given', () => {
      progress.start()
      const prev = instance.percent
      progress.inc()
      expect(instance.percent).toBeGreaterThan(prev)
    })

    it('should slow down above 95%', () => {
      progress.start()
      progress.set(96)
      progress.inc(10)
      expect(instance.percent).toBeLessThan(97)
    })
  })

  describe('configure', () => {
    it('should update color', () => {
      progress.configure({ color: '#f00' })
      expect(instance.options.color).toBe('#f00')
    })

    it('should accept color array', () => {
      progress.configure({ color: ['#f00', '#00f'] })
      expect(instance.options.color).toEqual(['#f00', '#00f'])
    })

    it('should update height', () => {
      progress.configure({ height: 5 })
      expect(instance.options.height).toBe(5)
    })

    it('should allow disabling trickle', () => {
      progress.configure({ trickle: false })
      progress.start()
      expect(instance.trickleTimer).toBeNull()
    })
  })

  describe('sSR safety', () => {
    it('should not throw when document is undefined', () => {
      vi.stubGlobal('document', undefined)
      expect(() => progress.start()).not.toThrow()
      expect(() => progress.done()).not.toThrow()
      expect(() => progress.inc()).not.toThrow()
      expect(() => progress.set(50)).not.toThrow()
    })
  })
})
