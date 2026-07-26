import type { NetworkInfo } from './types'

export type { NetworkInfo } from './types'

interface NavigatorWithConnection extends Navigator {
  connection?: any
  mozConnection?: any
  webkitConnection?: any
}

function warnNonBrowser(): void {
  console.warn('[getNetworkInfo] The current environment is not a browser — returning default values.')
}

/**
 * Get current network environment info (browser only).
 * When called in a non-browser environment, a warning is printed and default values are returned.
 *
 * @returns Current network info
 *
 * @example
 * ```ts
 * const info = getNetworkInfo()
 * console.log(info.online, info.effectiveType)
 * ```
 */
export function getNetworkInfo(): NetworkInfo {
  if (typeof window === 'undefined') {
    warnNonBrowser()
    return {
      online: false,
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
      connectionType: 'unknown',
    }
  }

  const nav = navigator as NavigatorWithConnection
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection

  return {
    online: nav.onLine,
    effectiveType: connection?.effectiveType ?? 'unknown',
    downlink: connection?.downlink ?? 0,
    rtt: connection?.rtt ?? 0,
    saveData: connection?.saveData ?? false,
    connectionType: connection?.type ?? 'unknown',
  }
}
