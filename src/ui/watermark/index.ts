import type { WatermarkInstance, WatermarkOptions } from './types'
import { createContainer, createProtector } from './protector'
import { renderCanvas, resolveLines, resolveOptions } from './render'

export { decodeWatermark } from './stego'
export type { WatermarkInstance, WatermarkOptions } from './types'

// ---------------------------------------------------------------------------
// SSR / non-browser guard
// ---------------------------------------------------------------------------

const noop: WatermarkInstance = {
  update: () => {},
  destroy: () => {},
  show: () => {},
  hide: () => {},
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a tamper-resistant page watermark.
 *
 * @example
 * ```ts
 * const wm = createWatermark({
 *   text: ['内部资料', '张三'],
 *   opacity: 0.15,
 *   rotate: -30,
 *   gap: [200, 150],
 *   protect: true,
 * })
 *
 * wm.update({ text: '新的内容' })
 * wm.hide()
 * wm.show()
 * wm.destroy()
 * ```
 */
export function createWatermark(options: WatermarkOptions): WatermarkInstance {
  if (typeof window === 'undefined' || typeof document === 'undefined')
    return noop

  // ---- state -----------------------------------------------------------
  let opts = resolveOptions(options)
  let hidden = false
  let destroyed = false
  let container: HTMLDivElement | null = null
  let protector: ReturnType<typeof createProtector> | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let renderToken = 0

  // ---- render helpers --------------------------------------------------
  const applyDataUrl = (dataUrl: string): void => {
    if (!container || destroyed)
      return
    protector?.stop()
    container.style.backgroundImage = `url(${dataUrl})`
    protector?.setExpected({ backgroundImage: `url(${dataUrl})` })
    protector?.start()
  }

  const renderAndApply = (lines: string[], stegoCode: number | null): void => {
    if (destroyed)
      return
    const dataUrl = renderCanvas(opts, lines, stegoCode)
    applyDataUrl(dataUrl)
  }

  const refresh = (): void => {
    if (destroyed)
      return
    const token = ++renderToken
    resolveLines(opts).then(({ lines, code }) => {
      if (destroyed || token !== renderToken)
        return
      renderAndApply(lines, code)
    })
  }

  const syncProtector = (): void => {
    if (!container)
      return
    if (opts.protect && !protector) {
      protector = createProtector(container, () => hidden)
      protector.setExpected({
        display: hidden ? 'none' : '',
        visibility: 'visible',
        opacity: String(opts.opacity),
        pointerEvents: 'none',
        zIndex: String(opts.zIndex),
        backgroundImage: container.style.backgroundImage,
      })
      protector.start()
    }
    else if (!opts.protect && protector) {
      protector.stop()
      protector = null
    }
  }

  const syncTimer = (): void => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    if (opts.dynamic && !hidden) {
      timer = setInterval(refresh, opts.interval)
    }
  }

  // ---- initial render --------------------------------------------------
  const initialDataUrl = renderCanvas(opts, opts.text)
  container = createContainer(initialDataUrl, opts.zIndex, opts.opacity)
  document.body.appendChild(container)

  syncProtector()
  syncTimer()

  if (opts.userId)
    refresh()

  // ---- instance API ----------------------------------------------------
  return {
    update(newOptions: Partial<WatermarkOptions>): void {
      if (destroyed)
        return

      const mergedText = newOptions.text !== undefined
        ? (Array.isArray(newOptions.text) ? [...newOptions.text] : [newOptions.text])
        : opts.text

      opts = { ...opts, ...newOptions, text: mergedText }

      if (container) {
        container.style.zIndex = String(opts.zIndex)
        protector?.setExpected({ zIndex: String(opts.zIndex) })
      }

      syncProtector()
      syncTimer()
      refresh()
    },

    destroy(): void {
      if (destroyed)
        return
      destroyed = true
      protector?.stop()
      protector = null
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
      container = null
    },

    show(): void {
      if (destroyed || !container)
        return
      hidden = false
      container.style.display = ''
      protector?.setExpected({ display: '' })
      syncTimer()
    },

    hide(): void {
      if (destroyed || !container)
        return
      hidden = true
      container.style.display = 'none'
      protector?.setExpected({ display: 'none' })
      syncTimer()
    },
  }
}
