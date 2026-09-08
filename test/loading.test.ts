import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loading } from '../src/ui/loading'

// Access the private singleton for teardown
const instance = loading as any

describe('loading', () => {
  let bodyAppendSpy: ReturnType<typeof vi.fn>
  const attachedChildren: HTMLElement[] = []

  beforeEach(() => {
    attachedChildren.length = 0
    bodyAppendSpy = vi.fn((child: any) => attachedChildren.push(child))

    function createMockElement(): any {
      const children: any[] = []
      const el: any = {
        className: '',
        classList: { add: vi.fn(), remove: vi.fn() },
        textContent: '',
        style: {} as Record<string, string>,
        addEventListener: vi.fn(),
        childElementCount: 0,
        childNodes: children,
        querySelector(selector: string): any {
          for (const child of children) {
            if (child.className && child.className.includes?.(selector.replace('.', '')))
              return child
            const found = child.querySelector?.(selector)
            if (found)
              return found
          }
          return null
        },
        querySelectorAll(selector: string): any[] {
          const results: any[] = []
          for (const child of children) {
            if (child.className && child.className.includes?.(selector.replace('.', '')))
              results.push(child)
            results.push(...(child.querySelectorAll?.(selector) || []))
          }
          return results
        },
        appendChild(child: any) {
          children.push(child)
          el.childElementCount = children.length
        },
        remove: vi.fn(function (this: any) {
          const idx = attachedChildren.indexOf(this)
          if (idx !== -1)
            attachedChildren.splice(idx, 1)
        }),
      }
      return el
    }

    vi.stubGlobal('document', {
      createElement: vi.fn((_tag: string) => createMockElement()),
      head: { appendChild: vi.fn() },
      body: { appendChild: bodyAppendSpy },
    })
  })

  afterEach(() => {
    instance._reset()
    attachedChildren.length = 0
  })

  it('show should create a mask', () => {
    loading.show('Loading...')
    expect(bodyAppendSpy).toHaveBeenCalled()
  })

  it('should not create duplicate masks for nested calls', () => {
    loading.show()
    const callCount = bodyAppendSpy.mock.calls.length
    loading.show()
    expect(bodyAppendSpy).toHaveBeenCalledTimes(callCount)
  })

  it('hide should only remove after counter reaches 0', () => {
    loading.show()
    loading.show()
    loading.hide()
    expect(instance.mask).not.toBeNull()
    loading.hide()
    expect(instance.mask).toBeNull()
  })

  it('force hide should reset counter and remove mask immediately', () => {
    loading.show()
    loading.show()
    loading.hide(true)
    expect(instance.count).toBe(0)
    expect(instance.mask).toBeNull()
  })

  it('hide should not go below zero', () => {
    loading.hide()
    expect(instance.count).toBe(0)
  })

  it('should do nothing when document is undefined (SSR)', () => {
    vi.stubGlobal('document', undefined)
    expect(() => loading.show()).not.toThrow()
    expect(() => loading.hide()).not.toThrow()
  })

  it('should use default spin spinner when no option provided', () => {
    loading.show('Loading...')
    const mask = bodyAppendSpy.mock.calls[0][0]
    const spinner = mask.querySelector('.tsl-loading-spinner')
    expect(spinner.className).toContain('tsl-loading-spinner-spin')
  })

  it('should use specified spinner type', () => {
    loading.show('Loading...', { spinner: 'pulse' })
    const mask = bodyAppendSpy.mock.calls[0][0]
    const spinner = mask.querySelector('.tsl-loading-spinner')
    expect(spinner.className).toContain('tsl-loading-spinner-pulse')
  })

  it('should create wave dots for wave spinner', () => {
    loading.show('Loading...', { spinner: 'wave' })
    const mask = bodyAppendSpy.mock.calls[0][0]
    const spinner = mask.querySelector('.tsl-loading-spinner')
    expect(spinner.className).toContain('tsl-loading-spinner-wave')
    const dots = spinner.querySelectorAll('.tsl-wave-dot')
    expect(dots.length).toBe(3)
  })

  it('should create dots for dots spinner', () => {
    loading.show('Loading...', { spinner: 'dots' })
    const mask = bodyAppendSpy.mock.calls[0][0]
    const spinner = mask.querySelector('.tsl-loading-spinner')
    expect(spinner.className).toContain('tsl-loading-spinner-dots')
    const dots = spinner.querySelectorAll('.tsl-dots-dot')
    expect(dots.length).toBe(3)
  })

  it('should support all spinner types', () => {
    const spinnerTypes = ['spin', 'pulse', 'wave', 'dots', 'dual-ring']
    spinnerTypes.forEach((type) => {
      instance._reset()
      loading.show('Loading...', { spinner: type as any })
      const mask = bodyAppendSpy.mock.calls[bodyAppendSpy.mock.calls.length - 1][0]
      const spinner = mask.querySelector('.tsl-loading-spinner')
      expect(spinner.className).toContain(`tsl-loading-spinner-${type}`)
    })
  })
})
