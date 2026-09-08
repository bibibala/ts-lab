<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const files = ref([])
let unbind = null

onMounted(async () => {
  const { onFilePaste } = await import('@bilibaba/ts-lab/browser')
  unbind = onFilePaste((items) => {
    files.value = items.map(f => ({
      name: f.name,
      size: f.formattedSize,
      type: f.mimeType,
      isImg: f.isImage,
      preview: f.previewUrl,
    }))
  })
})
onUnmounted(() => { unbind?.() })
</script>

<style>
.file-demo {
  border: 2px dashed var(--vp-c-divider);
  border-radius: 8px; padding: 40px 20px; text-align: center;
  margin: 16px 0 24px; background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3); font-size: 14px;
}
.file-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; justify-content: center; }
.file-card {
  background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider);
  border-radius: 6px; padding: 8px 12px; font-size: 12px; max-width: 200px;
}
.file-card img { max-width: 100%; max-height: 100px; border-radius: 4px; margin-bottom: 4px; }
</style>

<ClientOnly>
  <div class="file-demo">
    <div>📁 Copy files in your file manager, then come back here and press Ctrl+V to paste</div>
    <div v-if="files.length" class="file-list">
      <div v-for="(f, i) in files" :key="i" class="file-card">
        <img v-if="f.isImg && f.preview" :src="f.preview" />
        <div>{{ f.name }}</div>
        <div style="color:var(--vp-c-text-3)">{{ f.size }} · {{ f.type }}</div>
      </div>
    </div>
  </div>
</ClientOnly>

---

# Files · Cut · Events

File paste, cut operations, low-level event listening, and utility functions.

## File Paste

::: warning Security Restriction
Browsers do not allow page JS to write arbitrary files to the system clipboard — only `text/plain`, `text/html`, and `image/png` are supported. File pasting can only be obtained by listening to the `paste` event from user actions.
:::

### writeFile

Can only write when the file is an image (MIME is in the allowlist); otherwise throws `UNSUPPORTED_MIME_TYPE`:

```ts
import { writeFile } from '@bilibaba/ts-lab/browser'

const file = new File(['...'], 'photo.png', { type: 'image/png' })
await writeFile(file)
```

### onFilePaste

Listen for user file paste. When a user selects several images and a PDF in the file manager and returns to the page to Ctrl+V — the callback receives **all** files at once. Mixed images and documents are fine; `isImage` helps you distinguish them:

```ts
import { onFilePaste } from '@bilibaba/ts-lab/browser'
import type { ProcessedPastedFile } from '@bilibaba/ts-lab/browser'

const unbind = onFilePaste((files: ProcessedPastedFile[]) => {
  for (const f of files) {
    console.log(f.name)           // 'photo.jpg' | 'report.pdf' | ...
    console.log(f.formattedSize)  // '2.1 MB'
    console.log(f.mimeType)       // 'image/jpeg' | 'application/pdf'
    console.log(f.isImage)        // true | false

    if (f.previewUrl) {
      // Images have a preview URL, use directly: <img :src="f.previewUrl" />
    }
  }
})

// Unbind when no longer needed
unbind()
```

Each paste callback receives a `files` array — whether the user copied multiple files or multi-selected in a folder, all are returned at once. Image files auto-generate `previewUrl`; non-images (PDF, documents, etc.) have `previewUrl` as `null` and `isImage` as `false`, so callers can choose icons based on MIME type.

| Option | Default | Description |
|--------|---------|-------------|
| `processed` | `true` | Whether to preprocess files (generate id, previewUrl, etc.); `false` receives raw `File[]` |
| `preventDefault` | `true` | Whether to prevent the browser's default paste behavior |

```ts
// Need raw File[] (e.g., directly upload via FormData)
onFilePaste((files: File[]) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  await upload(form)
}, { processed: false })
```

### processPastedFiles / revokePastedFilePreview

Manually process pasted files or release preview URLs:

```ts
import { processPastedFiles, revokePastedFilePreview } from '@bilibaba/ts-lab/browser'

const processed = processPastedFiles(rawFiles)
// Release when done
for (const item of processed) {
  revokePastedFilePreview(item)
}
```

## Cut

### cutText

Cut text to the clipboard (equivalent to copy; does not clear the source):

```ts
import { cutText } from '@bilibaba/ts-lab/browser'

await cutText('Selected text')
```

### cutFromInput

Cut selected content from an `input` / `textarea`:

```ts
import { cutFromInput } from '@bilibaba/ts-lab/browser'

const el = document.querySelector('textarea')!
const selected = await cutFromInput(el)
console.log(selected) // The cut content, also removed from the input
```

## Event Listening

### onClipboardEvent

Listen for `copy` / `cut` / `paste` events; returns an unsubscribe function:

```ts
import { onClipboardEvent } from '@bilibaba/ts-lab/browser'

const unbind = onClipboardEvent('paste', (payload) => {
  console.log(payload.text)   // Plain text from clipboardData
  console.log(payload.html)   // HTML from clipboardData (common in paste)
  console.log(payload.files)  // File list (common in paste)
  console.log(payload.originalEvent) // Native ClipboardEvent
})

// When no longer needed
unbind()
```

The third parameter specifies the listen target (defaults to `document`):

```ts
onClipboardEvent('copy', handler, myElement)
```

## Utility Functions

| Function | Description |
|----------|-------------|
| `formatFileSize(bytes)` | Bytes → `'1.2 MB'` |
| `generateId()` | Generate unique ID (`crypto.randomUUID` or fallback) |
| `isWritableMimeType(type)` | Check if a MIME type can be written to the system clipboard |
