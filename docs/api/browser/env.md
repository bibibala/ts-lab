# Env · 环境检测

通过浏览器 `User-Agent` 字符串检测当前运行环境。

## detectEnv

```ts
function detectEnv(appFlag?: string): EnvResult
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `appFlag` | `string` | 可选，自定义 App WebView 标识 |

## EnvResult

```ts
interface EnvResult {
  isQQ: boolean       // QQ 内置浏览器 / QQ App
  isWechat: boolean   // 微信内置浏览器
  isIOS: boolean      // iOS 设备
  isAndroid: boolean  // Android 设备
  isInApp: boolean    // 匹配 appFlag 的自定义 App WebView
  isBrowser: boolean  // 仅在普通浏览器中为 true（不在微信/QQ/自定义App中）
  ua: string          // 原始 UA 字符串，便于调试
}
```

```ts
import { detectEnv } from '@bilibaba/ts-lab'

const env = detectEnv('MyAppWebView')

console.log(env.isWechat)   // 在微信中
console.log(env.isQQ)       // 在 QQ 中
console.log(env.isIOS)      // iOS 设备
console.log(env.isAndroid)  // Android 设备
console.log(env.isInApp)    // 匹配自定义 App 标识
console.log(env.isBrowser)  // 纯浏览器环境
```

## 检测逻辑

`isBrowser` 为 `true` 意味着不在微信、QQ 或自定义 App WebView 中，仅在系统浏览器中打开。
