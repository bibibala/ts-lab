<script setup>
import { onMounted, ref } from 'vue'
import { detectEnv } from '@bilibaba/ts-lab/browser'

const env = ref(null)

const osLabel = {
  macos: '💻 macOS', windows: '🪟 Windows', linux: '🐧 Linux',
  ios: '🍎 iOS', android: '🤖 Android', unknown: '❓ Unknown',
}
const archLabel = {
  arm64: 'ARM64', arm: 'ARM (32-bit)', x64: 'x64', x86: 'x86', unknown: 'Unknown',
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
        <span class="label">OS</span>
        <span class="value">{{ osLabel[env.os] ?? env.os }}</span>
      </div>
      <div class="env-item">
        <span class="label">CPU Architecture</span>
        <span class="value">{{ archLabel[env.arch] ?? env.arch }}</span>
      </div>
    </div>
    <div v-if="env" class="env-tags">
      <span :class="['env-tag', { on: env.isQQ }]">QQ</span>
      <span :class="['env-tag', { on: env.isWechat }]">WeChat</span>
      <span :class="['env-tag', { on: env.isInApp }]">App WebView</span>
      <span :class="['env-tag', { on: env.isBrowser }]">Browser</span>
    </div>
    <div v-if="env" class="env-ua">{{ env.ua }}</div>
    <div v-else style="color:var(--vp-c-text-3); font-size:13px;">Detecting…</div>
  </div>
</ClientOnly>

---

# Env · Environment Detection

Based on [Navigator.userAgent](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent) + [User-Agent Client Hints API](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API)

Detects the browser runtime environment: operating system, CPU architecture, and container (WeChat / QQ / App WebView / regular browser).

## detectEnv

```ts
function detectEnv(appFlag?: string): Promise<EnvInfo>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `appFlag` | `string` | Optional, custom App WebView identifier, defaults to `'MyAppWebView'` |

## EnvInfo

```ts
interface EnvInfo {
  os: OS                // Operating system type
  arch: Arch            // CPU architecture (prefers UACH API, falls back to UA inference)
  isQQ: boolean         // QQ built-in browser / QQ App
  isWechat: boolean     // WeChat built-in browser
  isInApp: boolean      // Custom App WebView matching appFlag
  isBrowser: boolean    // Regular browser (not in WeChat/QQ/custom App)
  ua: string            // Raw UA string for debugging
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

| Value | Description |
|-------|-------------|
| `arm64` | 64-bit ARM (Apple Silicon M1–M4, Snapdragon X, AWS Graviton, etc.) |
| `arm` | 32-bit ARM (ARMv7, older Android / Raspberry Pi) |
| `x64` | 64-bit Intel / AMD (x86-64, amd64) |
| `x86` | 32-bit Intel / AMD (i386–i686, very rare) |
| `unknown` | Unable to detect |

## Usage Example

```ts
import { detectEnv } from '@bilibaba/ts-lab/browser'

const env = await detectEnv('MyAppWebView')

// Operating system
console.log(env.os)        // 'macos' | 'windows' | 'ios' | ...
// CPU architecture
console.log(env.arch)      // 'arm64' | 'arm' | 'x64' | 'x86' | 'unknown'
// Runtime container
console.log(env.isWechat)   // In WeChat
console.log(env.isQQ)       // In QQ
console.log(env.isInApp)    // In custom App WebView
console.log(env.isBrowser)  // In regular browser
```

## Detection Logic

- **OS**: Determined via `navigator.userAgent` + `navigator.platform` combined analysis.
- **Architecture**: Prefers [User-Agent Client Hints](https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API) for precise async detection; falls back to UA keyword + OS context inference when unavailable. When UACH returns `"arm"`, it cross-references `arm64`/`aarch64` signals in the UA to distinguish 32/64-bit ARM.
- **Container**: `isBrowser` is `true` when not in WeChat, QQ, or a custom App WebView.
