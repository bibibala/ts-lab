<script setup>
import { ref } from 'vue'
import { writeText, readText } from '@bilibaba/ts-lab/browser'

const text = ref('Hello, world!')
const result = ref('')
const copied = ref(false)

async function copy() {
  await writeText(text.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
async function read() { result.value = await readText() }
</script>

<style>
.tx-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
}
.tx-row { display: flex; gap: 8px; align-items: center; }
.tx-input {
  flex: 1; padding: 6px 10px; border: 1px solid var(--vp-c-divider);
  border-radius: 6px; font-size: 13px;
}
.tx-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
.tx-result { margin-top: 8px; font-size: 13px; color: var(--vp-c-text-2); }
</style>

<ClientOnly>
  <div class="tx-demo">
    <div class="tx-row">
      <input v-model="text" class="tx-input" />
      <button class="tx-btn" @click="copy">{{ copied ? '✓ Copied' : 'Copy' }}</button>
      <button class="tx-btn" @click="read">Read</button>
    </div>
    <div v-if="result" class="tx-result">📋 {{ result }}</div>
  </div>
</ClientOnly>

---

# Text Read/Write

Plain text copy and paste — the two most common operations.

## writeText

Write plain text to the clipboard. Prefers Clipboard API; falls back to `execCommand('copy')` on failure or when unsupported.

```ts
import { writeText } from '@bilibaba/ts-lab/browser'

await writeText('Hello, world!')
```

Even works in older browsers that don't support the Clipboard API — internally creates a hidden `<textarea>`, selects it, and executes `execCommand('copy')`.

## readText

Read plain text from the clipboard. Only supports Clipboard API; requires the user to grant clipboard read permission.

```ts
import { readText } from '@bilibaba/ts-lab/browser'

const text = await readText()
console.log(text) // 'Hello, world!'
```

::: warning
`readText` has no `execCommand` fallback. In environments that don't support the Clipboard API, it throws `NOT_SUPPORTED`.
:::
