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
  it('should detect iOS device', async () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15')
    const env = await detectEnv()
    expect(env.os).toBe('ios')
    expect(env.os).not.toBe('android')
  })

  it('should detect Android device', async () => {
    mockUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36')
    const env = await detectEnv()
    expect(env.os).toBe('android')
    expect(env.os).not.toBe('ios')
  })

  it('should detect WeChat browser', async () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 MicroMessenger/8.0.48')
    const env = await detectEnv()
    expect(env.isWechat).toBe(true)
    expect(env.isBrowser).toBe(false)
  })

  it('should detect QQ App browser', async () => {
    mockUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 QQ/9.0')
    const env = await detectEnv()
    expect(env.isQQ).toBe(true)
    expect(env.isBrowser).toBe(false)
  })

  it('should detect QQ browser (mqqbrowser)', async () => {
    mockUA('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 MQQBrowser/12.0')
    const env = await detectEnv()
    expect(env.isQQ).toBe(true)
  })

  it('should detect in-app webview via custom appFlag', async () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 MyAppWebView/2.0.0')
    const env = await detectEnv('MyAppWebView')
    expect(env.isInApp).toBe(true)
    expect(env.isBrowser).toBe(false)
  })

  it('should use default appFlag when not specified', async () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 MyAppWebView')
    const env = await detectEnv()
    expect(env.isInApp).toBe(true)
  })

  it('should be case-insensitive for appFlag', async () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 myappwebview/1.0')
    const env = await detectEnv('MyAppWebView')
    expect(env.isInApp).toBe(true)
  })

  it('should set isBrowser true only when no shell detected', async () => {
    // Pure Chrome on desktop
    mockUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
    const env = await detectEnv()
    expect(env.isBrowser).toBe(true)
    expect(env.isWechat).toBe(false)
    expect(env.isQQ).toBe(false)
    expect(env.isInApp).toBe(false)
  })

  it('should return the original UA string', async () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 MicroMessenger/8.0.48'
    mockUA(ua)
    const env = await detectEnv()
    expect(env.ua).toBe(ua)
  })

  it('should handle empty UA gracefully', async () => {
    mockUA('')
    const env = await detectEnv()
    expect(env.os).not.toBe('ios')
    expect(env.os).not.toBe('android')
    expect(env.isWechat).toBe(false)
    expect(env.isQQ).toBe(false)
    expect(env.isInApp).toBe(false)
    expect(env.isBrowser).toBe(true)
  })

  it('should detect combined QQ + Android', async () => {
    mockUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 QQ/9.0.0')
    const env = await detectEnv()
    expect(env.isQQ).toBe(true)
    expect(env.os).toBe('android')
    expect(env.os).not.toBe('ios')
  })

  it('should detect combined WeChat + iOS', async () => {
    mockUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 MicroMessenger/8.0.48')
    const env = await detectEnv()
    expect(env.isWechat).toBe(true)
    expect(env.os).toBe('ios')
    expect(env.os).not.toBe('android')
  })
})
