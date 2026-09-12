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
      <input v-model="text" class="cb-input" placeholder="Enter text to copy" />
      <button class="cb-btn" @click="doCopy">{{ copied ? '✓ Copied' : 'Copy to clipboard' }}</button>
      <button class="cb-btn" @click="doPaste">Paste</button>
    </div>
    <div v-if="clipboardText" class="cb-info">📋 Clipboard: {{ clipboardText }}</div>
    <div v-if="supported" class="cb-info">
      <span :class="['cb-tag', supported.api ? 'ok' : 'fail']">Clipboard API {{ supported.api ? '✓' : '✗' }}</span>
      <span :class="['cb-tag', supported.rich ? 'ok' : 'fail']">Rich Text / Images {{ supported.rich ? '✓' : '✗' }}</span>
    </div>
  </div>
</ClientOnly>

---

# Clipboard

A straightforward wrapper around the [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API): **copy** writes to the board, **paste** reads from it. The names say it all — `copyTextToBoard` / `pasteTextFromBoard`.

## Quick Start

```ts
import { copyTextToBoard, pasteTextFromBoard } from '@bilibaba/ts-lab/browser'

// Copy text
await copyTextToBoard('Hello, world!')

// Paste text
const text = await pasteTextFromBoard()
```

`copyTextToBoard` degrades gracefully: modern browsers use `navigator.clipboard`, older ones fall back to `execCommand('copy')` — both work. Pasting has no fallback; it needs the modern Clipboard API plus a secure context (HTTPS / localhost).

## API at a Glance

| What | Function |
|------|----------|
| Copy text | `copyTextToBoard(text)` |
| Copy HTML (keep formatting in email/docs) | `copyHtmlToBoard(html, plainFallback?)` |
| Copy an image | `copyImageToBoard(blob)` |
| Copy an image file (images only) | `copyFileToBoard(file)` |
| Low-level multi-format write | `copyItemsToBoard(items)` |
| Cut selected text from an input | `cutFromInput(el)` |
| Paste text | `pasteTextFromBoard()` |
| Paste the first image | `pasteImageFromBoard()` |
| Paste everything | `pasteAllFromBoard()` |
| Listen for copy/cut/paste | `onCopy(fn)` / `onCut(fn)` / `onPaste(fn)` |
| Listen for file paste | `onPasteFiles(fn)` |
| Feature detection | `isSupported()` / `isRichSupported()` |
| Query read/write permission | `await queryPermission('read'\|'write')` |

## Feature Detection

Check the environment before calling APIs:

```ts
import { isSupported, isRichSupported, queryPermission } from '@bilibaba/ts-lab/browser'

isSupported()       // boolean — modern Clipboard API available (also implies a secure context)
isRichSupported()   // boolean — ClipboardItem supported (HTML / images / pasteAll)

// Permission state: 'granted' | 'denied' | 'prompt' | 'unknown'
await queryPermission('read')
await queryPermission('write')
```

## Error Handling

Every failed operation throws a unified `ClipboardError`; distinguish causes via `err.code`:

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

| Error Code | Meaning |
|------------|---------|
| `NOT_SUPPORTED` | The environment doesn't support this capability |
| `PERMISSION_DENIED` | User / system denied clipboard permission |
| `EMPTY_CLIPBOARD` | Clipboard is empty or has no matching types |
| `UNSUPPORTED_MIME_TYPE` | Attempted to write a MIME type the browser forbids |
| `UNKNOWN` | Other unknown error |