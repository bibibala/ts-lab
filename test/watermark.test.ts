/**
 * Watermark module tests.
 *
 * Because the default vitest environment is Node, we stub the minimum set of
 * browser globals that createWatermark needs.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWatermark, decodeWatermark } from '../src/ui/watermark'

// ---------------------------------------------------------------------------
// Helpers – build a minimal fake DOM
// ---------------------------------------------------------------------------

interface FakeElement {
  tagName: string
  style: Record<string, string>
  _attrs: Map<string, string>
  parentNode: FakeElement | null
  setAttribute: (name: string, value: string) => void
  getAttribute: (name: string) => string | null
  appendChild: (child: FakeElement) => void
  removeChild: (child: FakeElement) => void
  contains: (child: FakeElement) => boolean
  children: FakeElement[]
}

function fakeElement(tag: string): FakeElement {
  return {
    tagName: tag.toUpperCase(),
    style: {},
    _attrs: new Map(),
    parentNode: null,
    children: [],
    setAttribute(name: string, value: string) {
      this._attrs.set(name, value)
    },
    getAttribute(name: string) {
      return this._attrs.get(name) ?? null
    },
    appendChild(child: FakeElement) {
      child.parentNode = this
      this.children.push(child)
    },
    removeChild(child: FakeElement) {
      child.parentNode = null
      this.children = this.children.filter(c => c !== child)
    },
    contains(child: FakeElement) {
      return this.children.includes(child)
    },
  }
}

function setupDOM() {
  const mockCtx = {
    font: '',
    fillStyle: '',
    globalAlpha: 1,
    textAlign: '',
    textBaseline: '',
    measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
  }

  const body = fakeElement('body')

  const doc = {
    body,
    createElement(tag: string) {
      if (tag === 'canvas') {
        return {
          ...fakeElement('canvas'),
          width: 0,
          height: 0,
          getContext: vi.fn(() => mockCtx),
          toDataURL: vi.fn(() => 'data:image/png;base64,abcd'),
        }
      }
      return fakeElement(tag)
    },
  }

  vi.stubGlobal('window', {})
  vi.stubGlobal('document', doc)
  vi.stubGlobal(
    'MutationObserver',
    vi.fn(function (this: any, _callback: (...args: any[]) => void) {
      this.observe = vi.fn()
      this.disconnect = vi.fn()
    }),
  )
}

function teardownDOM() {
  vi.unstubAllGlobals()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('watermark', () => {
  describe('non-browser environment', () => {
    it('should return no-op instance when window is undefined', () => {
      const wm = createWatermark({ text: 'test' })

      expect(wm.update).toBeDefined()
      expect(wm.destroy).toBeDefined()
      expect(wm.show).toBeDefined()
      expect(wm.hide).toBeDefined()

      // No-ops should not throw
      expect(() => wm.update({ text: 'changed' })).not.toThrow()
      expect(() => wm.destroy()).not.toThrow()
      expect(() => wm.show()).not.toThrow()
      expect(() => wm.hide()).not.toThrow()
    })
  })

  describe('browser environment', () => {
    beforeEach(() => {
      setupDOM()
    })

    afterEach(() => {
      teardownDOM()
    })

    it('should append a watermark container to body', () => {
      const wm = createWatermark({ text: '内部资料', protect: false })

      const body = document.body as unknown as FakeElement
      const container = body.children.find(c =>
        c.getAttribute('data-watermark-root') === '',
      )
      expect(container).toBeDefined()
      expect(container!.style.position).toBe('fixed')
      expect(container!.style.pointerEvents).toBe('none')
      expect(container!.style.backgroundRepeat).toBe('repeat')

      wm.destroy()
    })

    it('should handle string[] text', () => {
      const wm = createWatermark({ text: ['第一行', '第二行'], protect: false })

      const body = document.body as unknown as FakeElement
      const container = body.children.find(c =>
        c.getAttribute('data-watermark-root') === '',
      )
      expect(container).toBeDefined()

      wm.destroy()
    })

    it('hide() should set display:none', () => {
      const wm = createWatermark({ text: 'test', protect: false })

      const body = document.body as unknown as FakeElement
      const container = body.children.find(c =>
        c.getAttribute('data-watermark-root') === '',
      )!

      wm.hide()
      expect(container.style.display).toBe('none')

      wm.destroy()
    })

    it('show() should restore display', () => {
      const wm = createWatermark({ text: 'test', protect: false })

      const body = document.body as unknown as FakeElement
      const container = body.children.find(c =>
        c.getAttribute('data-watermark-root') === '',
      )!

      wm.hide()
      expect(container.style.display).toBe('none')

      wm.show()
      expect(container.style.display).toBe('')

      wm.destroy()
    })

    it('destroy() should remove container from body', () => {
      const wm = createWatermark({ text: 'test', protect: false })

      const body = document.body as unknown as FakeElement
      const container = body.children.find(c =>
        c.getAttribute('data-watermark-root') === '',
      )
      expect(container).toBeDefined()

      wm.destroy()

      expect(body.children).toHaveLength(0)
    })

    it('destroy() twice should not throw', () => {
      const wm = createWatermark({ text: 'test', protect: false })

      wm.destroy()
      expect(() => wm.destroy()).not.toThrow()
    })

    it('update() should merge new options', () => {
      const wm = createWatermark({ text: '旧文字', protect: false })

      // update should not throw
      expect(() => wm.update({ text: '新文字', opacity: 0.2 })).not.toThrow()

      wm.destroy()
    })

    it('update() on destroyed instance should be no-op', () => {
      const wm = createWatermark({ text: 'test', protect: false })
      wm.destroy()

      expect(() => wm.update({ text: 'changed' })).not.toThrow()
    })

    it('should accept empty string text', () => {
      const wm = createWatermark({ text: '', protect: false })

      const body = document.body as unknown as FakeElement
      const container = body.children.find(c =>
        c.getAttribute('data-watermark-root') === '',
      )
      expect(container).toBeDefined()

      wm.destroy()
    })
  })

  describe('decodeWatermark', () => {
    it('should return null in non-browser environment', () => {
      const result = decodeWatermark({} as any)
      expect(result).toBeNull()
    })

    it('should return null for canvas smaller than a block', () => {
      setupDOM()
      const canvas = document.createElement('canvas') as any
      canvas.width = 8
      canvas.height = 8
      const result = decodeWatermark(canvas)
      expect(result).toBeNull()
      teardownDOM()
    })
  })
})
