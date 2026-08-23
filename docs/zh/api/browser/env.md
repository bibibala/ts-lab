<script setup>
import { onMounted, ref } from 'vue'
import { detectEnv } from '@bilibaba/ts-lab/browser'

const env = ref(null)

const osLabel = {
  macos: '💻 macOS', windows: '🪟 Windows', linux: '🐧 Linux',
  ios: '🍎 iOS', android: '🤖 Android', unknown: '❓ 未知',
}
const archLabel = {
  arm64: 'ARM64', arm: 'ARM (32-bit)', x64: 'x64', x86: 'x86', unknown: '未知',
}

onMounted(async () => { env.value = await detectEnv() })
</script>

<style>
.env-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
}
.env-grid { display: flex; gap: 24px; flex-wrap: wrap; }
.env-item { display: flex; flex-direction: column; }
.env-item .label { font-size: 12px; color: var(--vp-c-text-3); }
.env-item .value { font-size: 18px; font-weight: 600; }
.env-tags { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.env-tag {
  font-size: 12px; padding: 2px 10px; border-radius: 12px;
  background: var(--vp-c-bg-alt); color: var(--vp-c-text-3);
}
.env-tag.on { background: var(--vp-c-brand-1); color: #fff; }
.env-ua { margin-top: 12px; font-size: 11px; color: var(--vp-c-text-3); word-break: break-all; }
</style>

<ClientOnly>
  <div class="env-demo">
    <div v-if="env" class="env-grid">
      <div class="env-item">
        <span class="label">操作系统</span>
        <span class="value">{{ osLabel[env.os] ?? env.os }}</span>
      </div>
      <div class="env-item">
        <span class="label">CPU 架构</span>
        <span class="value">{{ archLabel[env.arch] ?? env.arch }}</span>
      </div>
    </div>
    <div v-if="env" class="env-tags">
      <span :class="['env-tag', { on: env.isQQ }]">QQ</span>
      <span :class="['env-tag', { on: env.isWechat }]">微信</span>
      <span :class="['env-tag', { on: env.isInApp }]">App WebView</span>
      <span :class="['env-tag', { on: env.isBrowser }]">浏览器</span>
    </div>
    <div v-if="env" class="env-ua">{{ env.ua }}</div>
    <div v-else style="color:var(--vp-c-text-3); font-size:13px;">检测中…</div>
  </div>
</ClientOnly>

---

# Env · 环境检测

基于 [Navigator.userAgent](https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/userAgent) + [User-Agent Client Hints API](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API)

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
import { detectEnv } from '@bilibaba/ts-lab/browser'

const env = await detectEnv('MyAppWebView')

// 操作系统
console.log(env.os)        // 'macos' | 'windows' | 'ios' | ...
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
- **容器**：`isBrowser` 为 `true` 时不在微信、QQ 或自定义 App WebView 中。
