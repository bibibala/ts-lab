// ---------------------------------------------------------------------------
// DOM container + MutationObserver tamper protection
// Enhanced with CSS !important injection defense
// ---------------------------------------------------------------------------

export type ProtectedStyleKey = 'display' | 'visibility' | 'opacity' | 'backgroundImage' | 'zIndex' | 'pointerEvents'
export type ProtectedStyle = Partial<Record<ProtectedStyleKey, string>>

export interface ProtectorOptions {
  /** Interval for computed style checks in ms. Default 1000 */
  styleCheckInterval?: number
  /** Callback when tampering is detected */
  onTamperDetected?: () => void
  /** Enable shadow DOM for stronger isolation. Default false */
  useShadowDOM?: boolean
}

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
  options: ProtectorOptions = {},
): { start: () => void, stop: () => void, setExpected: (style: ProtectedStyle) => void } {
  let observer: MutationObserver | null = null
  let expected: ProtectedStyle = {}
  let styleCheckTimer: ReturnType<typeof setInterval> | null = null
  const { styleCheckInterval = 1000, onTamperDetected } = options

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

  function checkComputedStyles(): void {
    if (isHidden())
      return

    const computed = window.getComputedStyle(container)

    // Check if computed styles differ from expected inline styles
    for (const key of Object.keys(expected) as ProtectedStyleKey[]) {
      if (key === 'display' && isHidden())
        continue

      const expectedValue = expected[key]
      if (expectedValue === undefined)
        continue

      let computedValue: string
      if (key === 'backgroundImage') {
        // backgroundImage may return 'url("...")' or 'url(...)' format
        computedValue = computed.backgroundImage
        // Normalize for comparison
        const expectedNormalized = expectedValue.replace(/^url\(["']?/, 'url(').replace(/["']?\)$/, ')')
        const computedNormalized = computedValue.replace(/^url\(["']?/, 'url(').replace(/["']?\)$/, ')')

        if (computedNormalized !== expectedNormalized) {
          // CSS injection detected - restore and notify
          applyExpected()
          onTamperDetected?.()
          return
        }
      }
      else {
        computedValue = computed[key as keyof CSSStyleDeclaration] as string
        if (computedValue !== expectedValue) {
          // CSS injection detected - restore and notify
          applyExpected()
          onTamperDetected?.()
          return
        }
      }
    }
  }

  function restore(): void {
    observer?.disconnect()
    if (!document.body.contains(container)) {
      document.body.appendChild(container)
    }
    applyExpected()
    observer?.observe(document.body, { childList: true, subtree: true })
    observer?.observe(container, { attributes: true, attributeFilter: ['style'] })
  }

  function start(): void {
    // Main MutationObserver for DOM structure and attribute changes
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Check if water mark container was removed
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

          // Check for injected style/link elements that could affect watermark
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement) {
              const tag = node.tagName.toLowerCase()
              if (tag === 'style' || tag === 'link') {
                // A new style element was added - run a computed style check
                // Use setTimeout to ensure the browser has applied the new styles
                setTimeout(checkComputedStyles, 0)
              }
            }
          }
        }
        if (mutation.type === 'attributes') {
          applyExpected()
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    observer.observe(container, { attributes: true, attributeFilter: ['style'] })

    // Periodic computed style check to catch CSS !important injections
    // that MutationObserver cannot detect
    if (styleCheckInterval > 0) {
      styleCheckTimer = setInterval(checkComputedStyles, styleCheckInterval)
    }
  }

  function stop(): void {
    observer?.disconnect()
    observer = null
    if (styleCheckTimer !== null) {
      clearInterval(styleCheckTimer)
      styleCheckTimer = null
    }
  }

  return { start, stop, setExpected }
}
