<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const files = ref([])
let unbind = null

onMounted(async () => {
  const { onPasteFiles } = await import('@bilibaba/ts-lab/browser')
  unbind = onPasteFiles((items) => {
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

# File Paste · Cut · Events

## File Paste

::: warning Security Restriction
Browsers don't let page JS write arbitrary files to the system clipboard — only `text/plain`, `text/html`, and `image/png`. So "writing a file" is limited to images; getting files normally means listening to user paste.
:::

### Listen for file paste — onPasteFiles

The core of chat/upload flows: the user selects a couple of images and a PDF in the file manager, comes back to the page, presses Ctrl+V — the callback receives **all** files at once. Mixed images and documents are fine; `isImage` tells them apart:

```ts
import { onPasteFiles } from '@bilibaba/ts-lab/browser'
import type { PreparedFile } from '@bilibaba/ts-lab/browser'

const unbind = onPasteFiles((files: PreparedFile[]) => {
  for (const f of files) {
    console.log(f.name)           // 'photo.jpg' | 'report.pdf' | ...
    console.log(f.formattedSize)  // '2.1 MB'
    console.log(f.isImage)        // true | false

    if (f.previewUrl) {
      // Images have a preview URL, use directly: <img :src="f.previewUrl" />
    }
    f.dispose() // Release the preview URL when done, to avoid memory leaks
  }
})

unbind() // Unbind when the component unmounts
```

| Option | Default | Description |
|--------|---------|-------------|
| `processed` | `true` | Preprocess files (id, previewUrl, dispose); `false` receives raw `File[]` |
| `preventDefault` | `true` | Prevent the browser's default paste behavior |

```ts
// Need raw File[] (e.g., upload directly via FormData)
onPasteFiles((files: File[]) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  await upload(form)
}, { processed: false })
```

### Copy an image file — copyFileToBoard

Only image files can be written; anything else throws `UNSUPPORTED_MIME_TYPE`:

```ts
import { copyFileToBoard } from '@bilibaba/ts-lab/browser'

const file = new File(['...'], 'photo.png', { type: 'image/png' })
await copyFileToBoard(file)
```

### prepareFiles / formatFileSize

To turn `File[]` into structured `PreparedFile[]` (with preview and `dispose()`) yourself, use `prepareFiles`; `formatFileSize` formats byte counts:

```ts
import { formatFileSize, prepareFiles } from '@bilibaba/ts-lab/browser'

const prepared = prepareFiles(rawFiles)
prepared[0].previewUrl  // Images: use directly as <img src>
prepared[0].dispose()   // Release when done

formatFileSize(2 * 1024 * 1024) // '2.0 MB'
```

## Cut from an input

`cutFromInput` copies the selected text of an `input` / `textarea` to the clipboard, removes it from the element, and returns the cut text:

```ts
import { cutFromInput } from '@bilibaba/ts-lab/browser'

const el = document.querySelector('textarea')!
const selected = await cutFromInput(el)
console.log(selected) // The cut content, also removed from the input
```

## Event Listening

Listen to the low-level `copy` / `cut` / `paste` events; each returns an unbind function:

```ts
import { onCopy, onCut, onPaste } from '@bilibaba/ts-lab/browser'

const unbind = onPaste((payload) => {
  console.log(payload.text)   // Plain text from clipboardData
  console.log(payload.html)   // HTML from clipboardData (common in paste)
  console.log(payload.files)  // Files from clipboardData (common in paste)
  console.log(payload.originalEvent) // Native ClipboardEvent
})

unbind()
```

The second parameter specifies the listen target (defaults to `document`):

```ts
onCopy(handler, myElement)
```