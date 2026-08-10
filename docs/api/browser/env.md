# Env · 环境检测

检测浏览器运行环境：操作系统、CPU 架构、以及所在容器（微信 / QQ / App WebView / 普通浏览器）。

## detectEnv

```ts
function detectEnv(appFlag?: string): Promise<EnvInfo>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `appFlag` | `string` | 可选，自定义 App WebView 标识，默认 `'MyAppWebView'` |

## EnvInfo

```ts
interface EnvInfo {
  os: OSType          // 操作系统类型
  arch: ArchType      // CPU 架构（优先走 UACH API，降级为 UA 推断）
  isQQ: boolean       // QQ 内置浏览器 / QQ App
  isWechat: boolean   // 微信内置浏览器
  isInApp: boolean    // 匹配 appFlag 的自定义 App WebView
  isBrowser: boolean  // 普通浏览器（不在微信/QQ/自定义App中）
  ua: string          // 原始 UA 字符串，便于调试
}
```

## OSType

```ts
type OSType = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown'
```

## ArchType

```ts
type ArchType = 'arm64' | 'x64' | 'x86' | 'unknown'
```

## 使用示例

```ts
import { detectEnv } from '@bilibaba/ts-lab'

const env = await detectEnv('MyAppWebView')

// 操作系统
console.log(env.os)          // 'macos' | 'windows' | 'ios' | ...
// CPU 架构
console.log(env.arch)        // 'arm64' | 'x64' | 'x86' | 'unknown'
// 运行时容器
console.log(env.isWechat)    // 在微信中
console.log(env.isQQ)        // 在 QQ 中
console.log(env.isInApp)     // 在自定义 App WebView 中
console.log(env.isBrowser)   // 在普通浏览器中
```

## 检测逻辑

- **OS**：通过 `navigator.userAgent` + `navigator.platform` 综合判断。
- **架构**：优先使用 [User-Agent Client Hints](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API) 异步获取精确架构；不可用时通过 UA 关键字 + OS 上下文推断。
- **容器**：`isBrowser` 为 `true` 时不在微信、QQ 或自定义 App WebView 中。
