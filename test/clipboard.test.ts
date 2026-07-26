import { beforeEach, describe, expect, it, vi } from 'vitest'
import { writeImgToClipboard } from '../src/clipboard'

describe('writeImgToClipboard', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>
  let resolveBlob: ((blob: Blob | null) => void) | null

  beforeEach(() => {
    resolveBlob = null
    clipboardWrite = vi.fn().mockResolvedValue(undefined)

    // Mock Image — setting src triggers onload via setTimeout
    vi.stubGlobal('Image', vi.fn(function (this: any) {
      this.crossOrigin = ''
      this.width = 100
      this.height = 100
      this.onload = null
      this.onerror = null
      let _src = ''
      Object.defineProperty(this, 'src', {
        get: () => _src,
        set: (val: string) => {
          _src = val
          setTimeout(() => this.onload?.(), 0)
        },
      })
    }))

    // Mock document — canvas.toBlob captures its callback for manual resolution
    vi.stubGlobal('document', {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: vi.fn(() => ({ drawImage: vi.fn() })),
            toBlob: vi.fn((cb: (blob: Blob | null) => void) => { resolveBlob = cb }),
          }
        }
        return { href: '', download: '', click: vi.fn() }
      }),
    })

    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
  })

  const flushAndResolveBlob = async (promise: Promise<void>) => {
    // Let the setTimeout(onload) + toBlob callback capture happen
    await vi.waitFor(() => expect(resolveBlob).not.toBeNull(), { timeout: 200 })
    resolveBlob!(new Blob(['test'], { type: 'image/png' }))
    await promise
  }

  describe('validation', () => {
    it('should throw if src is not a base64 image', async () => {
      await expect(writeImgToClipboard('not-an-image'))
        .rejects
        .toThrow('Source must be a base64-encoded image.')
    })

    it('should accept png base64', async () => {
      await flushAndResolveBlob(writeImgToClipboard('data:image/png;base64,abc'))
    })

    it('should accept jpeg base64', async () => {
      await flushAndResolveBlob(writeImgToClipboard('data:image/jpeg;base64,abc'))
    })
  })

  describe('clipboard API available', () => {
    it('should write image to clipboard', async () => {
      await flushAndResolveBlob(writeImgToClipboard('data:image/png;base64,abc'))
      expect(clipboardWrite).toHaveBeenCalledTimes(1)
    })
  })

  describe('clipboard API unavailable', () => {
    it('should fall back to download', async () => {
      const clickSpy = vi.fn()
      vi.stubGlobal('document', {
        createElement: vi.fn((tag: string) => {
          if (tag === 'canvas') {
            return {
              width: 0,
              height: 0,
              getContext: vi.fn(() => ({ drawImage: vi.fn() })),
              toBlob: vi.fn((cb: (blob: Blob | null) => void) => { cb(new Blob(['test'], { type: 'image/png' })) }),
            }
          }
          return { href: '', download: '', click: clickSpy }
        }),
      })
      vi.stubGlobal('navigator', { clipboard: undefined })

      await writeImgToClipboard('data:image/png;base64,abc')

      expect(clickSpy).toHaveBeenCalled()
    })
  })
})
