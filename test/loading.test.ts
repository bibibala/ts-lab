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
})
