/**
 * Operating system type
 */
export type OS = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown'

/**
 * CPU architecture detected in the browser.
 *
 * Common values:
 * - `arm64` — Apple Silicon (M1–M4), Snapdragon X, AWS Graviton, etc.
 * - `arm`   — 32-bit ARM (ARMv7, legacy Android / Raspberry Pi)
 * - `x64`   — 64-bit Intel / AMD (x86-64, amd64)
 * - `x86`   — 32-bit Intel / AMD (i386–i686, legacy)
 *
 * Falls back to `"unknown"` when no UA / UACH signal is available.
 */
export type Arch = 'arm64' | 'arm' | 'x64' | 'x86' | 'unknown'

/**
 * Unified environment detection result — OS, CPU architecture, and runtime
 * container (WeChat / QQ / app webview / browser).
 */
export interface EnvInfo {
  /** Detected operating system */
  os: OS
  /** CPU architecture — resolved via UACH API when available, otherwise best-effort from UA */
  arch: Arch
  /** QQ built-in browser / QQ App */
  isQQ: boolean
  /** WeChat built-in browser */
  isWechat: boolean
  /** Inside own app's webview (via UA-injected appFlag) */
  isInApp: boolean
  /** Plain external browser (not in any of the above shells) */
  isBrowser: boolean
  /** Raw UA string for debugging */
  ua: string
}

/**
 * Detect the full runtime environment: OS, CPU architecture, and which
 * container (WeChat / QQ / app webview / plain browser) the code runs in.
 *
 * Architecture detection tries the User-Agent Client Hints API first; when
 * unavailable it falls back to UA / platform heuristics.
 *
 * @param appFlag Custom string your native app injects into the User-Agent,
 *                e.g. `"MyAppWebView"`. Used to detect in-app webview.
 */
export async function detectEnv(appFlag: string = 'MyAppWebView'): Promise<EnvInfo> {
  const ua = navigator.userAgent || ''
  const lowerUA = ua.toLowerCase()
  const platform = navigator.platform || ''
  const uaData = (navigator as any).userAgentData

  const appFlagLower = appFlag.toLowerCase()

  // ---- OS ----------------------------------------------------------------
  let os: OS

  if (/iphone|ipad|ipod/i.test(ua) || /iphone|ipad|ipod/i.test(platform)) {
    os = 'ios'
  }
  else if (/android/i.test(ua) || /android/i.test(platform)) {
    os = 'android'
  }
  else if (/mac\sos\sx|macintosh/i.test(ua) || platform === 'MacIntel' || platform === 'MacPPC') {
    os = 'macos'
  }
  else if (/windows\snt|win(?:dows|32|64)/i.test(ua) || platform === 'Win32' || platform === 'Win64') {
    os = 'windows'
  }
  else if (/linux/i.test(ua) || /linux/i.test(platform)) {
    os = 'linux'
  }
  else {
    os = 'unknown'
  }

  // ---- Architecture (UACH first, UA fallback) ----------------------------
  let arch: Arch = 'unknown'

  if (uaData?.getHighEntropyValues) {
    try {
      const { architecture } = await uaData.getHighEntropyValues(['architecture'])
      if (architecture) {
        arch = normalizeArch(architecture, ua)
      }
    }
    catch {
      // API failed — fall through to UA heuristics
    }
  }

  // 2. Fallback: parse arch from UA
  if (arch === 'unknown') {
    if (/arm64|aarch64/i.test(ua)) {
      arch = 'arm64'
    }
    else if (/\barm\b/i.test(ua)) {
      arch = 'arm'
    }
    else if (/x86_64|amd64|x64|win64|wow64/i.test(ua)) {
      arch = 'x64'
    }
    else if (/i[3-6]86/i.test(ua)) {
      arch = 'x86'
    }
  }

  // 3. Still unknown — infer from OS context
  if (arch === 'unknown') {
    if (os === 'macos') {
      arch = uaData?.platform === 'macOS' ? 'arm64' : 'x64'
    }
    else if (os === 'ios' || os === 'android') {
      arch = 'arm64'
    }
    else {
      arch = 'x64'
    }
  }

  // ---- Container ---------------------------------------------------------
  const isQQ = /\sqq\//i.test(ua) || /mqqbrowser/i.test(lowerUA) || /qqtheme/i.test(lowerUA)
  const isWechat = /micromessenger/i.test(lowerUA)
  const isInApp = lowerUA.includes(appFlagLower)
  const isBrowser = !isWechat && !isQQ && !isInApp

  return { os, arch, isQQ, isWechat, isInApp, isBrowser, ua }
}

/**
 * Normalize the free-form architecture string from UACH into a canonical
 * {@link Arch} value, cross-referencing the UA for ARM bit-width disambiguation.
 */
function normalizeArch(raw: string, ua: string): Arch {
  const a = raw.toLowerCase()

  if (a === 'arm') {
    // UACH often reports "arm" for both 32-bit and 64-bit ARM.
    // Use UA signals (arm64/aarch64 vs standalone ARM) to decide bit-width.
    return /arm64|aarch64/i.test(ua) ? 'arm64' : 'arm'
  }
  if (a.includes('arm'))
    return 'arm64' // arm64, aarch64, etc.
  if (a === 'x86')
    return 'x86'
  if (a === 'ia64')
    return 'x64' // Itanium → treated as x64-compatible
  return 'x64' // x86_64, amd64, x64, etc.
}
