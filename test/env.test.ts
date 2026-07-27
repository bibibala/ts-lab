import { describe, expect, it } from 'vitest'
import { detectEnv } from '../src/browser/env'

function mockUA(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    writable: true,
    configurable: true,
  })
}

describe('detectEnv', () => {
  it('should detect iOS device', () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15')
    const env = detectEnv()
    expect(env.isIOS).toBe(true)
    expect(env.isAndroid).toBe(false)
  })

  it('should detect Android device', () => {
    mockUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36')
    const env = detectEnv()
    expect(env.isAndroid).toBe(true)
    expect(env.isIOS).toBe(false)
  })

  it('should detect WeChat browser', () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 MicroMessenger/8.0.48')
    const env = detectEnv()
    expect(env.isWechat).toBe(true)
    expect(env.isBrowser).toBe(false)
  })

  it('should detect QQ App browser', () => {
    mockUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 QQ/9.0')
    const env = detectEnv()
    expect(env.isQQ).toBe(true)
    expect(env.isBrowser).toBe(false)
  })

  it('should detect QQ browser (mqqbrowser)', () => {
    mockUA('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 MQQBrowser/12.0')
    const env = detectEnv()
    expect(env.isQQ).toBe(true)
  })

  it('should detect in-app webview via custom appFlag', () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 MyAppWebView/2.0.0')
    const env = detectEnv('MyAppWebView')
    expect(env.isInApp).toBe(true)
    expect(env.isBrowser).toBe(false)
  })

  it('should use default appFlag when not specified', () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 MyAppWebView')
    const env = detectEnv()
    expect(env.isInApp).toBe(true)
  })

  it('should be case-insensitive for appFlag', () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 myappwebview/1.0')
    const env = detectEnv('MyAppWebView')
    expect(env.isInApp).toBe(true)
  })

  it('should set isBrowser true only when no shell detected', () => {
    // Pure Chrome on desktop
    mockUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
    const env = detectEnv()
    expect(env.isBrowser).toBe(true)
    expect(env.isWechat).toBe(false)
    expect(env.isQQ).toBe(false)
    expect(env.isInApp).toBe(false)
  })

  it('should return the original UA string', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 MicroMessenger/8.0.48'
    mockUA(ua)
    const env = detectEnv()
    expect(env.ua).toBe(ua)
  })

  it('should handle empty UA gracefully', () => {
    mockUA('')
    const env = detectEnv()
    expect(env.isIOS).toBe(false)
    expect(env.isAndroid).toBe(false)
    expect(env.isWechat).toBe(false)
    expect(env.isQQ).toBe(false)
    expect(env.isInApp).toBe(false)
    expect(env.isBrowser).toBe(true)
  })

  it('should detect combined QQ + Android', () => {
    mockUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 QQ/9.0.0')
    const env = detectEnv()
    expect(env.isQQ).toBe(true)
    expect(env.isAndroid).toBe(true)
    expect(env.isIOS).toBe(false)
  })

  it('should detect combined WeChat + iOS', () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 MicroMessenger/8.0.48')
    const env = detectEnv()
    expect(env.isWechat).toBe(true)
    expect(env.isIOS).toBe(true)
    expect(env.isAndroid).toBe(false)
  })
})
