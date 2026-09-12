<script setup>
import { ref } from 'vue'
import { copyHtmlToBoard, pasteAllFromBoard } from '@bilibaba/ts-lab/browser'

const htmlText = ref('')
const plainText = ref('')
const result = ref('')

async function copyRich() {
  await copyHtmlToBoard(
    `<p style="color:#1967d2;font-size:16px"><b>${htmlText.value || 'Rich text content'}</b></p>`,
    plainText.value || htmlText.value || 'Plain text fallback content',
  )
}
async function read() {
  const items = await pasteAllFromBoard()
  result.value = items.map(i => `${i.type} (${(i.blob.size / 1024).toFixed(1)} KB)`).join(', ')
}
</script>

<style>
.rich-demo {
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  padding: 16px 20px; margin: 16px 0 24px; background: var(--vp-c-bg-soft);
  display: flex; flex-direction: column; gap: 8px;
}
.rich-demo input {
  padding: 6px 10px; border: 1px solid var(--vp-c-divider);
  border-radius: 6px; font-size: 13px;
}
.rich-row { display: flex; gap: 8px; }
.rich-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
.rich-info { font-size: 12px; color: var(--vp-c-text-3); }
</style>

<ClientOnly>
  <div class="rich-demo">
    <input v-model="htmlText" placeholder="HTML content (paste into email/Lark to see formatting)" />
    <input v-model="plainText" placeholder="Plain text fallback (optional)" />
    <div class="rich-row">
      <button class="rich-btn" @click="copyRich">Copy to clipboard</button>
      <button class="rich-btn" @click="read">Read clipboard</button>
    </div>
    <div v-if="result" class="rich-info">📋 Clipboard: {{ result }}</div>
    <div class="rich-info">⚠️ Paste into email / Lark / document to see formatting; requires ClipboardItem support</div>
  </div>
</ClientOnly>

---

# HTML & Images

Before anything else, one rule: **pages can only write text and image types to the system clipboard** — a browser security policy that can't be bypassed. Everything below relies on `ClipboardItem` (only available when `isRichSupported()` returns `true`).

## Copy formatted content to email / Lark

A "Share Quote" button: the user clicks it, an HTML table goes into the clipboard. Pasting into email or Lark keeps the formatting; pasting into a plain-text input automatically shows text. `copyHtmlToBoard` writes HTML + plain text in one call:

```ts
import { copyHtmlToBoard } from '@bilibaba/ts-lab/browser'

await copyHtmlToBoard(
  `<table><tr><th>Q1</th><th>Q2</th></tr><tr><td>$12,000</td><td>$18,500</td></tr></table>`,
  'Q1: $12,000  Q2: $18,500', // Plain text fallback
)
```

For full control over the formats — say, adding a `text/csv` — use the low-level `copyItemsToBoard`:

```ts
import { copyItemsToBoard } from '@bilibaba/ts-lab/browser'

await copyItemsToBoard([
  { type: 'text/html', data: '<table>...</table>' },
  { type: 'text/csv',  data: 'Q1,12\nQ2,18' },
  { type: 'text/plain', data: 'Q1: 12  Q2: 18' },
])
```

The reverse also works — `pasteAllFromBoard` returns every format on the clipboard at once:

```ts
import { pasteAllFromBoard } from '@bilibaba/ts-lab/browser'

const items = await pasteAllFromBoard()
// items[0] — { type: 'text/plain', blob: ... }
// items[1] — { type: 'text/html',  blob: ... }
```

## Copy a canvas chart, paste straight into PPT

Rendered a canvas chart and want it Ctrl+V-able into Lark or PPT without downloading first? `copyImageToBoard` puts the Blob straight onto the clipboard:

```ts
import { copyImageToBoard } from '@bilibaba/ts-lab/browser'

// canvas export → straight to clipboard
canvas.toBlob(async (blob) => {
  if (blob) await copyImageToBoard(blob)
}, 'image/png')

// Or copy a network image directly
const blob = await fetch('/qrcode.png').then(r => r.blob())
await copyImageToBoard(blob)
```

`copyImageToBoard` uses `blob.type` as the MIME type; empty Blobs automatically fall back to `image/png`.

## User pasted a screenshot

A user Ctrl+V's a screenshot into the chat input — `pasteImageFromBoard` gets the Blob for preview or upload:

```ts
import { pasteImageFromBoard } from '@bilibaba/ts-lab/browser'

const blob = await pasteImageFromBoard()
if (blob) {
  img.src = URL.createObjectURL(blob) // Preview
  await upload(blob)                    // Or upload
}
```

Returns `null` when there's no image on the clipboard.