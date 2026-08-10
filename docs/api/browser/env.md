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
  os: OS                // 操作系统类型
  arch: Arch            // CPU 架构（优先走 UACH API，降级为 UA 推断）
  osVersion: string | null  // OS 版本号，Linux 上通常为 null
  isQQ: boolean         // QQ 内置浏览器 / QQ App
  isWechat: boolean     // 微信内置浏览器
  isInApp: boolean      // 匹配 appFlag 的自定义 App WebView
  isBrowser: boolean    // 普通浏览器（不在微信/QQ/自定义App中）
  ua: string            // 原始 UA 字符串，便于调试
}
```

## OS

```ts
type OS = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown'
```

## Arch

```ts
type Arch = 'arm64' | 'arm' | 'x64' | 'x86' | 'unknown'
```

| 值 | 说明 |
|----|------|
| `arm64` | 64-bit ARM（Apple Silicon M1–M4、Snapdragon X、AWS Graviton 等） |
| `arm` | 32-bit ARM（ARMv7、旧版 Android / 树莓派） |
| `x64` | 64-bit Intel / AMD（x86-64、amd64） |
| `x86` | 32-bit Intel / AMD（i386–i686，极少见） |
| `unknown` | 无法检测 |

## 使用示例

```ts
import { detectEnv } from '@bilibaba/ts-lab'

const env = await detectEnv('MyAppWebView')

// 操作系统
console.log(env.os)        // 'macos' | 'windows' | 'ios' | ...
console.log(env.osVersion) // "15.3" / "10.0.22631" / "17.5" / null
// CPU 架构
console.log(env.arch)      // 'arm64' | 'arm' | 'x64' | 'x86' | 'unknown'
// 运行时容器
console.log(env.isWechat)   // 在微信中
console.log(env.isQQ)       // 在 QQ 中
console.log(env.isInApp)    // 在自定义 App WebView 中
console.log(env.isBrowser)  // 在普通浏览器中
```

## 检测逻辑

- **OS**：通过 `navigator.userAgent` + `navigator.platform` 综合判断。
- **架构**：优先使用 [User-Agent Client Hints](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API) 异步获取精确架构；不可用时通过 UA 关键字 + OS 上下文推断。UACH 返回 `"arm"` 时会交叉比对 UA 中的 `arm64`/`aarch64` 信号来区分 32/64 位 ARM。
- **版本**：通过 UACH `platformVersion` 获取；不可用时解析 UA（macOS / iOS / Android / Windows NT）。
- **容器**：`isBrowser` 为 `true` 时不在微信、QQ 或自定义 App WebView 中。
