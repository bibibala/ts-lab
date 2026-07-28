import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ClipboardError,
  cutText,
  formatFileSize,
  generateId,
  isClipboardApiSupported,
  isExecCommandSupported,
  isRichClipboardSupported,
  isSecureContext,
  isWritableMimeType,
  onClipboardEvent,
  onFilePaste,
  processPastedFiles,
  queryClipboardPermission,
  readImage,
  readRich,
  readText,
  revokePastedFilePreview,
  writeFile,
  writeHtml,
  writeImage,
  writeRich,
  writeText,
} from '../src/browser/clipboard'

/* ==================== 特性检测 ==================== */

describe('feature detection', () => {
  afterEach(() => vi.unstubAllGlobals())

  describe('isSecureContext', () => {
    it('should return boolean', () => {
      expect(typeof isSecureContext()).toBe('boolean')
    })
  })

  describe('isClipboardApiSupported', () => {
    it('should return boolean', () => {
      expect(typeof isClipboardApiSupported()).toBe('boolean')
    })
  })

  describe('isRichClipboardSupported', () => {
    it('should return boolean', () => {
      expect(typeof isRichClipboardSupported()).toBe('boolean')
    })
  })

  describe('isExecCommandSupported', () => {
    it('should return boolean', () => {
      expect(typeof isExecCommandSupported()).toBe('boolean')
    })
  })
})

/* ==================== 权限查询 ==================== */

describe('queryClipboardPermission', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should return unknown when Permissions API unavailable', async () => {
    vi.stubGlobal('navigator', { permissions: undefined })
    const result = await queryClipboardPermission('clipboard-write')
    expect(result).toBe('unknown')
  })

  it('should return unknown on error', async () => {
    vi.stubGlobal('navigator', {
      permissions: { query: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    const result = await queryClipboardPermission('clipboard-write')
    expect(result).toBe('unknown')
  })
})

/* ==================== MIME 白名单 ==================== */

describe('isWritableMimeType', () => {
  it('should accept text/plain', () => {
    expect(isWritableMimeType('text/plain')).toBe(true)
  })

  it('should accept text/html', () => {
    expect(isWritableMimeType('text/html')).toBe(true)
  })

  it('should accept image/png', () => {
    expect(isWritableMimeType('image/png')).toBe(true)
  })

  it('should reject unknown types', () => {
    expect(isWritableMimeType('application/pdf')).toBe(false)
  })
})

/* ==================== 文本读写 ==================== */

describe('writeText', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should call clipboard.writeText', async () => {
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: clipboardWriteText } })
    await writeText('hello')
    expect(clipboardWriteText).toHaveBeenCalledWith('hello')
  })

  it('should fallback to execCommand when clipboard API fails', async () => {
    const clipboardWriteText = vi.fn().mockRejectedValue(new Error('fail'))
    vi.stubGlobal('navigator', { clipboard: { writeText: clipboardWriteText } })
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
    await writeText('hello')
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
    await writeText('hello')
    expect(execSpy).toHaveBeenCalledWith('copy')
  })
})

describe('readText', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should call clipboard.readText', async () => {
    const readTextMock = vi.fn().mockResolvedValue('clipboard text')
    vi.stubGlobal('navigator', { clipboard: { readText: readTextMock } })
    const result = await readText()
    expect(readTextMock).toHaveBeenCalled()
    expect(result).toBe('clipboard text')
  })

  it('should throw NOT_SUPPORTED when clipboard API unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: undefined })
    await expect(readText()).rejects.toThrow(ClipboardError)
  })
})

/* ==================== 富内容读写 ==================== */

describe('writeRich', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('should throw if items is empty', async () => {
    await expect(writeRich([])).rejects.toThrow(ClipboardError)
  })

  it('should reject unsupported MIME types', async () => {
    await expect(writeRich([{ type: 'application/pdf', data: 'test' }]))
      .rejects
      .toThrow(ClipboardError)
  })

  it('should write text/plain item', async () => {
    await writeRich([{ type: 'text/plain', data: 'hello' }])
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })

  it('should write Blob data directly', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' })
    await writeRich([{ type: 'text/plain', data: blob }])
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

describe('readRich', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should throw NOT_SUPPORTED when unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: { read: undefined } })
    await expect(readRich()).rejects.toThrow(ClipboardError)
  })
})

/* ==================== 图片读写 ==================== */

describe('writeImage', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('should use blob.type as MIME type', async () => {
    const blob = new Blob(['img'], { type: 'image/png' })
    await writeImage(blob)
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })

  it('should fallback to image/png when blob.type is empty', async () => {
    const blob = new Blob(['img'])
    await writeImage(blob)
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })

  it('should use explicit type when provided', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' })
    await writeImage(blob, 'image/png')
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

/* ==================== HTML 写入 ==================== */

describe('writeHtml', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write: clipboardWrite } })
    vi.stubGlobal('ClipboardItem', vi.fn())
    vi.stubGlobal('window', { ClipboardItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('should write HTML with plaintext fallback', async () => {
    await writeHtml('<b>bold</b>', 'bold')
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })

  it('should write HTML without fallback', async () => {
    await writeHtml('<b>bold</b>')
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

/* ==================== readImage ==================== */

describe('readImage', () => {
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
    const result = await readImage()
    expect(result).toBeNull()
  })
})

/* ==================== 文件写入 ==================== */

describe('writeFile', () => {
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
    await expect(writeFile(file)).rejects.toThrow(ClipboardError)
  })

  it('should accept image files', async () => {
    const file = new File(['img'], 'pic.png', { type: 'image/png' })
    await writeFile(file)
    expect(clipboardWrite).toHaveBeenCalledTimes(1)
  })
})

/* ==================== 工具函数 ==================== */

describe('generateId', () => {
  it('should return a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('should return unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

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

describe('processPastedFiles', () => {
  it('should generate structured results from File[]', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' })
    const result = processPastedFiles([file])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('test.png')
    expect(result[0].isImage).toBe(true)
    expect(result[0].id).toBeDefined()
  })

  it('should set isImage false for non-image files', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const result = processPastedFiles([file])
    expect(result[0].isImage).toBe(false)
    expect(result[0].previewUrl).toBeNull()
  })
})

describe('revokePastedFilePreview', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should call revokeObjectURL for items with previewUrl', () => {
    const revokeSpy = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL: revokeSpy, createObjectURL: vi.fn(() => 'blob://x') })
    const item = processPastedFiles([new File(['x'], 'x.png', { type: 'image/png' })])[0]
    revokePastedFilePreview(item)
    expect(revokeSpy).toHaveBeenCalledWith('blob://x')
  })

  it('should not call revokeObjectURL when previewUrl is null', () => {
    const revokeSpy = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL: revokeSpy })
    revokePastedFilePreview({
      id: '1',
      file: new File([], 'x.pdf'),
      name: 'x.pdf',
      size: 0,
      formattedSize: '0 B',
      mimeType: 'application/pdf',
      isImage: false,
      previewUrl: null,
    })
    expect(revokeSpy).not.toHaveBeenCalled()
  })
})

/* ==================== 剪切 ==================== */

describe('cutText', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should write text via clipboard API when execCommand unavailable', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: writeTextMock } })
    // ensure execCommand path is skipped
    vi.stubGlobal('document', undefined)
    await cutText('hello')
    expect(writeTextMock).toHaveBeenCalledWith('hello')
  })

  it('should fallback to execCommand cut', async () => {
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
    await cutText('hello')
    expect(execSpy).toHaveBeenCalledWith('cut')
  })
})

/* ==================== 事件监听 ==================== */

describe('onClipboardEvent', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should return unbind function', () => {
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    vi.stubGlobal('document', { addEventListener: addSpy, removeEventListener: removeSpy })
    const unbind = onClipboardEvent('copy', vi.fn(), document as any)
    expect(addSpy).toHaveBeenCalledWith('copy', expect.any(Function))
    unbind()
    expect(removeSpy).toHaveBeenCalledWith('copy', expect.any(Function))
  })
})

describe('onFilePaste', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('should return unbind function', () => {
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    vi.stubGlobal('document', { addEventListener: addSpy, removeEventListener: removeSpy })
    const unbind = onFilePaste(vi.fn())
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
