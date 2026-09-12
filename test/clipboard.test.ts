import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ClipboardError,
  copyFileToBoard,
  copyHtmlToBoard,
  copyImageToBoard,
  copyItemsToBoard,
  copyTextToBoard,
  cutFromInput,
  formatFileSize,
  isRichSupported,
  isSupported,
  onCopy,
  onCut,
  onPaste,
  onPasteFiles,
  pasteAllFromBoard,
  pasteImageFromBoard,
  pasteTextFromBoard,
  prepareFiles,
  queryPermission,
} from '../src/browser/clipboard'

/* ==================== 特性检测 ==================== */

describe('feature detection', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('isSupported should return boolean', () => {
    expect(typeof isSupported()).toBe('boolean')
  })

  it('isRichSupported should return boolean', () => {
    expect(typeof isRichSupported()).toBe('boolean')
  })
})

/* ==================== 权限查询 ==================== */

describe('queryPermission', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should return unknown when Permissions API unavailable', async () => {
    vi.stubGlobal('navigator', { permissions: undefined })
    expect(await queryPermission('write')).toBe('unknown')
  })

  it('should return unknown on error', async () => {
    vi.stubGlobal('navigator', {
      permissions: { query: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    expect(await queryPermission('write')).toBe('unknown')
  })

  it('should map the action to the clipboard permission name', async () => {
    const query = vi.fn().mockResolvedValue({ state: 'granted' })
    vi.stubGlobal('navigator', { permissions: { query } })
    await queryPermission('read')
    expect(query).toHaveBeenCalledWith({ name: 'clipboard-read' })
  })
})

/* ==================== 复制文本 ==================== */

describe('copyTextToBoard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should call clipboard.writeText', async () => {
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: clipboardWriteText } })
    await copyTextToBoard('hello')
    expect(clipboardWriteText).toHaveBeenCalledWith('hello')
  })

  it('should fallback to execCommand when clipboard API fails', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('fail')) } })
    const execSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('document', {
      execCommand: execSpy,
      createElement: vi.fn(() => ({
        value: '',
        style: {},
        setAttribute: vi.fn(),
        select: vi.fn(),
        setSelectionRange: vi.fn(),
      })),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    })
    await copyTextToBoard('hello')
    expect(execSpy).toHaveBeenCalledWith('copy')
  })

  it('should fallback to execCommand when clipboard API unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined })
    const execSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('document', {
      execCommand: execSpy,
      createElement: vi.fn(() => ({
        value: '',
        style: {},
        setAttribute: vi.fn(),
        select: vi.fn(),
        setSelectionRange: vi.fn(),
      })),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    })
    await copyTextToBoard('hello')
    expect(execSpy).toHaveBeenCalledWith('copy')
  })
})

/* ==================== 粘贴文本 ==================== */

describe('pasteTextFromBoard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should call clipboard.readText', async () => {
    const readTextMock = vi.fn().mockResolvedValue('clipboard text')
    vi.stubGlobal('navigator', { clipboard: { readText: readTextMock } })
    expect(await pasteTextFromBoard()).toBe('clipboard text')
    expect(readTextMock).toHaveBeenCalled()
  })

  it('should throw NOT_SUPPORTED when clipboard API unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined })
    await expect(pasteTextFromBoard()).rejects.toThrow(ClipboardError)
  })
})

/* ==================== 批量复制 ==================== */

describe('copyItemsToBoard', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('should throw if items is empty', async () => {
    await expect(copyItemsToBoard([])).rejects.toThrow(ClipboardError)
  })

  it('should reject unsupported MIME types', async () => {
    await expect(copyItemsToBoard([{ type: 'application/pdf', data: 'test' }]))
      .rejects
      .toThrow(ClipboardError)
  })

  it('should write text/plain item', async () => {
    await copyItemsToBoard([{ type: 'text/plain', data: 'hello' }])
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })

  it('should write Blob data directly', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' })
    await copyItemsToBoard([{ type: 'text/plain', data: blob }])
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

/* ==================== 批量粘贴 ==================== */

describe('pasteAllFromBoard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should throw NOT_SUPPORTED when unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: { read: undefined } })
    await expect(pasteAllFromBoard()).rejects.toThrow(ClipboardError)
  })
})

/* ==================== 复制图片 ==================== */

describe('copyImageToBoard', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('should use blob.type as MIME type', async () => {
    await copyImageToBoard(new Blob(['img'], { type: 'image/png' }))
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })

  it('should fallback to image/png when blob.type is empty', async () => {
    await copyImageToBoard(new Blob(['img']))
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

/* ==================== 复制 HTML ==================== */

describe('copyHtmlToBoard', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('should write HTML with plaintext fallback', async () => {
    await copyHtmlToBoard('<b>bold</b>', 'bold')
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })

  it('should write HTML without fallback', async () => {
    await copyHtmlToBoard('<b>bold</b>')
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

/* ==================== 粘贴图片 ==================== */

describe('pasteImageFromBoard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should return null when no image in clipboard', async () => {
    const mockGetType = vi.fn().mockResolvedValue(new Blob(['text'], { type: 'text/plain' }))
    vi.stubGlobal('navigator', {
      clipboard: {
        read: vi.fn().mockResolvedValue([
          { types: ['text/plain'], getType: mockGetType },
        ]),
        write: vi.fn(),
      },
    })
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
    expect(await pasteImageFromBoard()).toBeNull()
  })

  it('should return the first image blob', async () => {
    const mockGetType = vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/png' }))
    vi.stubGlobal('navigator', {
      clipboard: {
        read: vi.fn().mockResolvedValue([
          { types: ['image/png'], getType: mockGetType },
        ]),
        write: vi.fn(),
      },
    })
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
    const blob = await pasteImageFromBoard()
    expect(blob).not.toBeNull()
    expect(blob!.type).toBe('image/png')
  })
})

/* ==================== 复制文件 ==================== */

describe('copyFileToBoard', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('should reject non-image files', async () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    await expect(copyFileToBoard(file)).rejects.toThrow(ClipboardError)
  })

  it('should accept image files', async () => {
    const file = new File(['img'], 'pic.png', { type: 'image/png' })
    await copyFileToBoard(file)
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

/* ==================== 剪切 ==================== */

describe('cutFromInput', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should copy the selection and remove it from the input', async () => {
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: clipboardWriteText } })

    const el = {
      value: 'hello world',
      selectionStart: 0,
      selectionEnd: 5,
      dispatchEvent: vi.fn(),
    } as unknown as HTMLInputElement

    const cut = await cutFromInput(el)
    expect(cut).toBe('hello')
    expect(clipboardWriteText).toHaveBeenCalledWith('hello')
    expect(el.value).toBe(' world')
  })

  it('should throw when nothing is selected', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } })
    const el = { value: 'abc', selectionStart: 0, selectionEnd: 0 } as unknown as HTMLInputElement
    await expect(cutFromInput(el)).rejects.toThrow(ClipboardError)
  })
})

/* ==================== 辅助函数 ==================== */

describe('formatFileSize', () => {
  it('should return 0 B for 0', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('should return 0 B for negative', () => {
    expect(formatFileSize(-1)).toBe('0 B')
  })

  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('should format KB', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('should format MB', () => {
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})

describe('prepareFiles', () => {
  it('should generate structured results from File[]', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' })
    const result = prepareFiles([file])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('test.png')
    expect(result[0].isImage).toBe(true)
    expect(result[0].id).toBeDefined()
    expect(typeof result[0].dispose).toBe('function')
  })

  it('should set isImage false for non-image files', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const result = prepareFiles([file])
    expect(result[0].isImage).toBe(false)
    expect(result[0].previewUrl).toBeNull()
  })

  it('dispose should revoke the previewUrl', () => {
    const revokeSpy = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL: revokeSpy, createObjectURL: vi.fn(() => 'blob://x') })
    const item = prepareFiles([new File(['x'], 'x.png', { type: 'image/png' })])[0]
    item.dispose()
    expect(revokeSpy).toHaveBeenCalledWith('blob://x')
    vi.unstubAllGlobals()
  })
})

/* ==================== 事件监听 ==================== */

describe('onCopy / onCut / onPaste', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should return unbind function', () => {
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    vi.stubGlobal('document', { addEventListener: addSpy, removeEventListener: removeSpy })
    const unbind = onCopy(vi.fn(), document as any)
    expect(addSpy).toHaveBeenCalledWith('copy', expect.any(Function))
    unbind()
    expect(removeSpy).toHaveBeenCalledWith('copy', expect.any(Function))
  })

  it('should listen to the right event name for each helper', () => {
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    vi.stubGlobal('document', { addEventListener: addSpy, removeEventListener: removeSpy })
    onCut(vi.fn())
    expect(addSpy).toHaveBeenCalledWith('cut', expect.any(Function))
    onPaste(vi.fn())
    expect(addSpy).toHaveBeenCalledWith('paste', expect.any(Function))
  })
})

describe('onPasteFiles', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should return unbind function', () => {
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    vi.stubGlobal('document', { addEventListener: addSpy, removeEventListener: removeSpy })
    const unbind = onPasteFiles(vi.fn())
    expect(addSpy).toHaveBeenCalledWith('paste', expect.any(Function))
    unbind()
    expect(removeSpy).toHaveBeenCalledWith('paste', expect.any(Function))
  })
})

/* ==================== ClipboardError ==================== */

describe('clipboardError', () => {
  it('should create error with code', () => {
    const err = new ClipboardError('NOT_SUPPORTED', 'not supported')
    expect(err.name).toBe('ClipboardError')
    expect(err.code).toBe('NOT_SUPPORTED')
    expect(err.message).toBe('not supported')
  })
})
