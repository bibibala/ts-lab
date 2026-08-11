<script setup>
import { onMounted, ref } from 'vue'

const supported = ref(null)
const text = ref('Hello, ts-lab!')
const clipboardText = ref('')
const copied = ref(false)

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab/browser')
  supported.value = {
    secure: mod.isSecureContext(),
    api: mod.isClipboardApiSupported(),
    rich: mod.isRichClipboardSupported(),
    exec: mod.isExecCommandSupported(),
  }
})

async function doCopy() {
  const { writeText } = await import('@bilibaba/ts-lab/browser')
  await writeText(text.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

async function doRead() {
  const { readText } = await import('@bilibaba/ts-lab/browser')
  clipboardText.value = await readText()
}
</script>

<style>
.cb-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
}
.cb-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.cb-input {
  flex: 1; min-width: 160px; padding: 6px 10px;
  border: 1px solid var(--vp-c-divider); border-radius: 6px;
  background: var(--vp-c-bg); font-size: 13px;
}
.cb-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
.cb-btn:disabled { opacity: .5; cursor: default; }
.cb-info { font-size: 12px; color: var(--vp-c-text-3); margin-top: 8px; }
.cb-tag {
  display: inline-block; font-size: 11px; padding: 1px 8px; border-radius: 10px;
  margin-right: 4px; background: var(--vp-c-bg-alt); color: var(--vp-c-text-3);
}
.cb-tag.ok { background: #22c55e20; color: #22c55e; }
.cb-tag.fail { background: #ef444420; color: #ef4444; }
</style>

<ClientOnly>
  <div class="cb-demo">
    <div class="cb-row">
      <input v-model="text" class="cb-input" placeholder="输入要复制的文字" />
      <button class="cb-btn" @click="doCopy">{{ copied ? '✓ 已复制' : '复制到剪贴板' }}</button>
      <button class="cb-btn" @click="doRead">读取剪贴板</button>
    </div>
    <div v-if="clipboardText" class="cb-info">📋 剪贴板内容：{{ clipboardText }}</div>
    <div v-if="supported" class="cb-info">
      <span :class="['cb-tag', supported.secure ? 'ok' : 'fail']">安全上下文 {{ supported.secure ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.api ? 'ok' : 'fail']">Clipboard API {{ supported.api ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.rich ? 'ok' : 'fail']">富文本 {{ supported.rich ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.exec ? 'ok' : 'fail']">execCommand {{ supported.exec ? '✓' : '✗' }}</span>
    </div>
  </div>
</ClientOnly>

---

# 概览

基于 [Clipboard API](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API) + [Permissions API](https://developer.mozilla.org/zh-CN/docs/Web/API/Permissions_API)

浏览器剪贴板能力的完整封装：文本 / HTML / 图片读写、文件粘贴、剪切、事件监听，自带降级策略和统一错误类型。

## 快速开始

```ts
import { writeText, readText, writeImage, onFilePaste } from '@bilibaba/ts-lab/browser'

// 复制
await writeText('Hello, world!')

// 粘贴
const text = await readText()

// 图片
canvas.toBlob(async (blob) => { if (blob) await writeImage(blob) }, 'image/png')
```

## 特性检测

在调用 API 之前，可以先检测当前环境的支持情况：

```ts
import {
  isSecureContext,
  isClipboardApiSupported,
  isRichClipboardSupported,
  isExecCommandSupported,
  queryClipboardPermission,
} from '@bilibaba/ts-lab/browser'

isSecureContext()              // boolean — 是否 HTTPS / localhost
isClipboardApiSupported()      // boolean — 是否支持 Clipboard API
isRichClipboardSupported()     // boolean — 是否支持 ClipboardItem（图片 / HTML）
isExecCommandSupported()       // boolean — 是否支持 execCommand 降级

// 查询权限状态：'granted' | 'denied' | 'prompt' | 'unknown'
await queryClipboardPermission('clipboard-write')
await queryClipboardPermission('clipboard-read')
```

## 错误处理

所有 API 抛出统一的 `ClipboardError`：

```ts
import { ClipboardError } from '@bilibaba/ts-lab/browser'

try {
  await writeText('hello')
} catch (err) {
  if (err instanceof ClipboardError) {
    console.log(err.code) // 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | ...
    console.log(err.message)
  }
}
```

| 错误码 | 含义 |
|--------|------|
| `NOT_SUPPORTED` | 当前环境不支持该能力 |
| `PERMISSION_DENIED` | 用户 / 系统拒绝了剪贴板权限 |
| `NOT_FOCUSED` | 页面未处于焦点 |
| `EMPTY_CLIPBOARD` | 剪贴板为空或无匹配类型 |
| `INSECURE_CONTEXT` | 非 HTTPS / localhost |
| `UNSUPPORTED_MIME_TYPE` | 尝试写入不允许的 MIME 类型 |
| `UNKNOWN` | 其他未知错误 |

## 降级策略

| API | 降级行为 |
|-----|---------|
| `writeText` | Clipboard API → `execCommand('copy')` |
| `readText` | 无降级，不支持时抛出 `NOT_SUPPORTED` |
| `writeRich` / `readRich` | 无降级，需要 `ClipboardItem` 支持 |
| `cutText` | `execCommand('cut')` → `writeText` |

::: tip 安全上下文
`readText`、`readRich`、`readImage`、`writeRich` 需要 HTTPS / localhost。
本地开发时 `http://localhost` 被视为安全上下文。
:::
