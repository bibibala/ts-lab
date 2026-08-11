// ---------------------------------------------------------------------------
// DOM container + MutationObserver tamper protection
// ---------------------------------------------------------------------------

export type ProtectedStyleKey = 'display' | 'visibility' | 'opacity' | 'backgroundImage' | 'zIndex' | 'pointerEvents'
export type ProtectedStyle = Partial<Record<ProtectedStyleKey, string>>

export function createContainer(dataUrl: string, zIndex: number, opacity: number): HTMLDivElement {
  const div = document.createElement('div')
  div.setAttribute('data-watermark-root', '')
  Object.assign(div.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    userSelect: 'none',
    visibility: 'visible',
    opacity: String(opacity),
    zIndex: String(zIndex),
    backgroundImage: `url(${dataUrl})`,
    backgroundRepeat: 'repeat',
  })
  return div
}

export function createProtector(
  container: HTMLDivElement,
  isHidden: () => boolean,
): { start: () => void, stop: () => void, setExpected: (style: ProtectedStyle) => void } {
  let observer: MutationObserver | null = null
  let expected: ProtectedStyle = {}

  function setExpected(style: ProtectedStyle): void {
    expected = { ...expected, ...style }
  }

  function applyExpected(): void {
    for (const key of Object.keys(expected) as ProtectedStyleKey[]) {
      if (key === 'display' && isHidden())
        continue
      const value = expected[key]
      if (value !== undefined && container.style[key] !== value) {
        container.style[key] = value
      }
    }
  }

  function restore(): void {
    observer?.disconnect()
    if (!document.body.contains(container)) {
      document.body.appendChild(container)
    }
    applyExpected()
    observer?.observe(document.body, { childList: true })
    observer?.observe(container, { attributes: true, attributeFilter: ['style'] })
  }

  function start(): void {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.removedNodes) {
            if (node === container) {
              restore()
              return
            }
          }
          if (!document.body.contains(container)) {
            restore()
            return
          }
        }
        if (mutation.type === 'attributes') {
          applyExpected()
        }
      }
    })
    observer.observe(document.body, { childList: true })
    observer.observe(container, { attributes: true, attributeFilter: ['style'] })
  }

  function stop(): void {
    observer?.disconnect()
    observer = null
  }

  return { start, stop, setExpected }
}
