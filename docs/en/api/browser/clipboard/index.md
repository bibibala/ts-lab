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
      <input v-model="text" class="cb-input" placeholder="Enter text to copy" />
      <button class="cb-btn" @click="doCopy">{{ copied ? '✓ Copied' : 'Copy to clipboard' }}</button>
      <button class="cb-btn" @click="doRead">Read clipboard</button>
    </div>
    <div v-if="clipboardText" class="cb-info">📋 Clipboard: {{ clipboardText }}</div>
    <div v-if="supported" class="cb-info">
      <span :class="['cb-tag', supported.secure ? 'ok' : 'fail']">Secure Context {{ supported.secure ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.api ? 'ok' : 'fail']">Clipboard API {{ supported.api ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.rich ? 'ok' : 'fail']">Rich Text {{ supported.rich ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.exec ? 'ok' : 'fail']">execCommand {{ supported.exec ? '✓' : '✗' }}</span>
    </div>
  </div>
</ClientOnly>

---

# Overview

Based on [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) + [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)

A complete wrapper for browser clipboard: text / HTML / image read/write, file paste, cut, event listening — with built-in fallback strategies and a unified error type.

## Quick Start

```ts
import { writeText, readText, writeImage, onFilePaste } from '@bilibaba/ts-lab/browser'

// Copy
await writeText('Hello, world!')

// Paste
const text = await readText()

// Image
canvas.toBlob(async (blob) => { if (blob) await writeImage(blob) }, 'image/png')
```

## Feature Detection

Before calling APIs, you can check environment support:

```ts
import {
  isSecureContext,
  isClipboardApiSupported,
  isRichClipboardSupported,
  isExecCommandSupported,
  queryClipboardPermission,
} from '@bilibaba/ts-lab/browser'

isSecureContext()              // boolean — HTTPS / localhost
isClipboardApiSupported()      // boolean — Clipboard API supported
isRichClipboardSupported()     // boolean — ClipboardItem supported (image / HTML)
isExecCommandSupported()       // boolean — execCommand fallback supported

// Query permission status: 'granted' | 'denied' | 'prompt' | 'unknown'
await queryClipboardPermission('clipboard-write')
await queryClipboardPermission('clipboard-read')
```

## Error Handling

All APIs throw a unified `ClipboardError`:

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

| Error Code | Meaning |
|------------|---------|
| `NOT_SUPPORTED` | Current environment doesn't support this capability |
| `PERMISSION_DENIED` | User / system denied clipboard permission |
| `NOT_FOCUSED` | Page is not in focus |
| `EMPTY_CLIPBOARD` | Clipboard is empty or has no matching types |
| `INSECURE_CONTEXT` | Not HTTPS / localhost |
| `UNSUPPORTED_MIME_TYPE` | Attempted to write a disallowed MIME type |
| `UNKNOWN` | Other unknown error |

## Fallback Strategies

| API | Fallback Behavior |
|-----|-------------------|
| `writeText` | Clipboard API → `execCommand('copy')` |
| `readText` | No fallback; throws `NOT_SUPPORTED` if unsupported |
| `writeRich` / `readRich` | No fallback; requires `ClipboardItem` support |
| `cutText` | `execCommand('cut')` → `writeText` |

::: tip Secure Context
`readText`, `readRich`, `readImage`, `writeRich` require HTTPS / localhost.
In local development, `http://localhost` is treated as a secure context.
:::
