<script setup>
import { onMounted, ref } from 'vue'

const supported = ref(null)
const text = ref('Hello, ts-lab!')
const clipboardText = ref('')
const copied = ref(false)

onMounted(async () => {
  const { isSupported, isRichSupported } = await import('@bilibaba/ts-lab/browser')
  supported.value = {
    api: isSupported(),
    rich: isRichSupported(),
  }
})

async function doCopy() {
  const { copyTextToBoard } = await import('@bilibaba/ts-lab/browser')
  await copyTextToBoard(text.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

async function doPaste() {
  const { pasteTextFromBoard } = await import('@bilibaba/ts-lab/browser')
  clipboardText.value = await pasteTextFromBoard()
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
      <button class="cb-btn" @click="doPaste">粘贴</button>
    </div>
    <div v-if="clipboardText" class="cb-info">📋 剪贴板内容：{{ clipboardText }}</div>
    <div v-if="supported" class="cb-info">
      <span :class="['cb-tag', supported.api ? 'ok' : 'fail']">Clipboard API {{ supported.api ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.rich ? 'ok' : 'fail']">富文本 / 图片 {{ supported.rich ? '✓' : '✗' }}</span>
    </div>
  </div>
</ClientOnly>

---

# 剪贴板

基于 [Clipboard API](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API)。

一套直接了当的浏览器剪贴板封装：**复制**（copy）是往剪贴板写，**粘贴**（paste）是从剪贴板读。函数名一目了然——`copyTextToBoard` / `pasteTextFromBoard`，看到名字就知道做什么。

## 快速开始

```ts
import { copyTextToBoard, pasteTextFromBoard } from '@bilibaba/ts-lab/browser'

// 复制文本
await copyTextToBoard('Hello, world!')

// 粘贴文本
const text = await pasteTextFromBoard()
```

`copyTextToBoard` 会自动降级：现代浏览器走 `navigator.clipboard`，旧浏览器退回 `execCommand('copy')`，两种环境都能工作。粘贴侧没有降级方案，需要现代浏览器 + HTTPS / localhost。

## API 一览

| 目的 | 函数 |
|------|------|
| 复制文本 | `copyTextToBoard(text)` |
| 复制 HTML（邮件/文档保留格式） | `copyHtmlToBoard(html, plainFallback?)` |
| 复制图片 | `copyImageToBoard(blob)` |
| 复制图片文件（仅图片） | `copyFileToBoard(file)` |
| 底层多格式写入 | `copyItemsToBoard(items)` |
| 从输入框剪切选中文字 | `cutFromInput(el)` |
| 粘贴文本 | `pasteTextFromBoard()` |
| 粘贴第一张图片 | `pasteImageFromBoard()` |
| 粘贴全部内容 | `pasteAllFromBoard()` |
| 监听复制/剪切/粘贴 | `onCopy(fn)` / `onCut(fn)` / `onPaste(fn)` |
| 监听文件粘贴 | `onPasteFiles(fn)` |
| 检测支持情况 | `isSupported()` / `isRichSupported()` |
| 查询读/写权限 | `await queryPermission('read'\|'write')` |

## 特性检测

调用前先看环境支不支持：

```ts
import { isSupported, isRichSupported, queryPermission } from '@bilibaba/ts-lab/browser'

isSupported()       // boolean — 现代 Clipboard API 可用（含 HTTPS/low localhost 环境）
isRichSupported()   // boolean — 支持 ClipboardItem（HTML / 图片 / pasteAll）

// 查询读/写权限状态：'granted' | 'denied' | 'prompt' | 'unknown'
await queryPermission('read')
await queryPermission('write')
```

## 错误处理

所有操作失败时都会抛出统一的 `ClipboardError`，用 `err.code` 区分原因：

```ts
import { ClipboardError } from '@bilibaba/ts-lab/browser'

try {
  await pasteTextFromBoard()
} catch (err) {
  if (err instanceof ClipboardError) {
    console.log(err.code) // 'PERMISSION_DENIED' | 'NOT_SUPPORTED' | ...
  }
}
```

| 错误码 | 含义 |
|--------|------|
| `NOT_SUPPORTED` | 当前环境不支持该能力 |
| `PERMISSION_DENIED` | 用户 / 系统拒绝了剪贴板权限 |
| `EMPTY_CLIPBOARD` | 剪贴板为空或无匹配类型 |
| `UNSUPPORTED_MIME_TYPE` | 尝试写入浏览器不允许的 MIME 类型 |
| `UNKNOWN` | 其他未知错误 |