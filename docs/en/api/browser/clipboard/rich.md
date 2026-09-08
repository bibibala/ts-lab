<script setup>
import { ref } from 'vue'
import { writeHtml, readRich } from '@bilibaba/ts-lab/browser'

const htmlText = ref('')
const plainText = ref('')
const result = ref('')

async function copyRich() {
  await writeHtml(
    `<p style="color:#1967d2;font-size:16px"><b>${htmlText.value || 'Rich text content'}</b></p>`,
    plainText.value || htmlText.value || ('Plain text fallback: ' + (htmlText.value || 'Rich text content')),
  )
}
async function read() {
  const items = await readRich()
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
      <button class="rich-btn" @click="copyRich">Write to clipboard</button>
      <button class="rich-btn" @click="read">Read clipboard</button>
    </div>
    <div v-if="result" class="rich-info">📋 Clipboard: {{ result }}</div>
    <div class="rich-info">⚠️ Paste into email / Lark / document to see formatting; Firefox does not support readRich</div>
  </div>
</ClientOnly>

---

# Rich Text & Images

The clipboard doesn't just store text — when you select a formatted table on a web page and press Ctrl+C, pasting into Lark preserves the table because the clipboard stores both `text/html` and `text/plain` simultaneously. The APIs below handle this kind of rich content and require `ClipboardItem` support (`isRichClipboardSupported()` returns `true`).

## Copy formatted content to email / Lark

Say you want a "Share Quotation" button: user clicks it, an HTML table goes into the clipboard, and pasting into email or Lark preserves formatting; pasting into a plain text input automatically shows the plain text version.

Use `writeHtml` — it writes both HTML and a plain text fallback simultaneously:

```ts
import { writeHtml } from '@bilibaba/ts-lab/browser'

await writeHtml(
  `<table style="border-collapse:collapse">
     <tr><th>Q1</th><th>Q2</th></tr>
     <tr><td>$12,000</td><td>$18,500</td></tr>
   </table>`,
  'Q1: $12,000  Q2: $18,500'  // Plain text fallback
)
```

Under the hood, it writes two MIME types to the clipboard at once. If you want finer control — say, adding a `text/csv` — use the lower-level `writeRich`:

```ts
import { writeRich } from '@bilibaba/ts-lab/browser'

await writeRich([
  { type: 'text/html', data: '<table>...</table>' },
  { type: 'text/csv',  data: 'Q1,12\nQ2,18' },
  { type: 'text/plain', data: 'Q1: 12  Q2: 18' },
])
```

The reverse also works — `readRich` returns all formats from the clipboard. When a user copies text on a web page, the clipboard typically contains both `text/plain` and `text/html`:

```ts
import { readRich } from '@bilibaba/ts-lab/browser'

const items = await readRich()
// items[0] — { type: 'text/plain', blob: ... }
// items[1] — { type: 'text/html',  blob: ... }
```

## Image to clipboard: one-click paste from canvas chart

After rendering a canvas chart, the user wants to Ctrl+V it directly into Lark or PPT. No need to download first — `writeImage` puts the Blob straight into the clipboard:

```ts
import { writeImage } from '@bilibaba/ts-lab/browser'

// canvas export → directly into clipboard
canvas.toBlob(async (blob) => {
  if (blob) await writeImage(blob)
}, 'image/png')

// Or copy a network image directly
const blob = await fetch('/qrcode.png').then(r => r.blob())
await writeImage(blob)
```

`writeImage` defaults to using `blob.type` as the MIME type; empty Blobs automatically fall back to `image/png`.

## User pasted a screenshot

When a user Ctrl+V's a screenshot in a chat box — use `readImage` to get the Blob for preview or upload:

```ts
import { readImage } from '@bilibaba/ts-lab/browser'

const blob = await readImage()
if (blob) {
  // Preview
  img.src = URL.createObjectURL(blob)
  // Or upload
  await upload(blob)
}
```

`readImage` returns `null` when there's no image in the clipboard.
