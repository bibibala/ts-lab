/**
 * Environment detection result
 */
export interface EnvResult {
  isQQ: boolean // QQ built-in browser / QQ App
  isWechat: boolean // WeChat built-in browser
  isIOS: boolean // iOS device
  isAndroid: boolean // Android device
  isInApp: boolean // Inside own app's webview
  isBrowser: boolean // Plain external browser (not in any of the above shells)
  ua: string // Raw UA string for debugging
}

/**
 * Detect the current runtime environment from the browser's User-Agent.
 * @param appFlag Custom identifier injected by your own app in the User-Agent,
 *                e.g. the native side appends "MyApp/1.0.0" or "MyAppWebView"
 *                to the UA. Agree on this string with the client team.
 *                Defaults to a common example value.
 */
export function detectEnv(appFlag: string = 'MyAppWebView'): EnvResult {
  const ua = navigator.userAgent || ''
  const lowerUA = ua.toLowerCase()

  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isAndroid = /android/i.test(ua)

  const isWechat = /micromessenger/i.test(lowerUA)
  // QQ browser or QQ App built-in (note: qq/ usually QQ App, mqqbrowser is QQ Browser)
  const isQQ = /\sqq\//i.test(ua) || /mqqbrowser/i.test(lowerUA) || /qqtheme/i.test(lowerUA)

  // In-app webview detection, relies on the client-injected appFlag
  const isInApp = appFlag ? lowerUA.includes(appFlag.toLowerCase()) : false

  // Only treat as "plain browser" when WeChat / QQ / in-app are all absent
  const isBrowser = !isWechat && !isQQ && !isInApp

  return {
    isQQ,
    isWechat,
    isIOS,
    isAndroid,
    isInApp,
    isBrowser,
    ua,
  }
}
