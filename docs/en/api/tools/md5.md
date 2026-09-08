<script setup lang="ts">
import { ref } from 'vue'
import { md5 } from '@bilibaba/ts-lab/tools'

const input = ref('Hello, ts-lab!')
const hash = ref('')

async function compute() {
  hash.value = input.value ? await md5(input.value) : ''
}

// compute on mount and on input change
import { watch } from 'vue'
watch(input, compute, { immediate: true })
</script>

<style>
.md5-demo {
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  padding: 20px 24px; margin: 16px 0 24px; background: var(--vp-c-bg-soft);
  display: flex; flex-direction: column; gap: 16px;
}
.md5-input {
  width: 100%; padding: 8px 12px; border: 1px solid var(--vp-c-divider);
  border-radius: 6px; font-size: 14px; background: var(--vp-c-bg);
  color: var(--vp-c-text-1); outline: none; box-sizing: border-box;
  font-family: monospace;
}
.md5-input:focus { border-color: var(--vp-c-brand-1); }
.md5-field label {
  display: block; font-size: 12px; font-weight: 500; margin-bottom: 2px;
  color: var(--vp-c-text-2); font-family: monospace;
}
.md5-value {
  padding: 6px 10px; border: 1px solid var(--vp-c-divider); border-radius: 4px;
  background: var(--vp-c-bg); font-family: monospace; font-size: 13px;
  color: var(--vp-c-text-1); word-break: break-all; user-select: all;
}
</style>

<ClientOnly>
  <div class="md5-demo">
    <input
      v-model="input"
      class="md5-input"
      placeholder="Enter text to hash…"
    />
    <div class="md5-field">
      <label>md5</label>
      <div class="md5-value">{{ hash || '-' }}</div>
    </div>
  </div>
</ClientOnly>

---

# MD5

A pure TypeScript MD5 hash implementing [RFC 1321](https://www.ietf.org/rfc/rfc1321.txt). Zero dependencies, **fully async**, supports string (UTF-8), `ArrayBuffer`, and `Uint8Array` input.

## md5

```ts
function md5(input: string | ArrayBuffer | Uint8Array): Promise<string>
```

Returns a 32-character lowercase hex string.

```ts
import { md5 } from '@bilibaba/ts-lab/tools'

await md5('hello')
// '5d41402abc4b2a76b9719d911017c592'

await md5('')
// 'd41d8cd98f00b204e9800998ecf8427e'

await md5('你好')
// '7eca689f0d3389d9dea66ae112e5cfd7'
```

## Large Files Won't Block the UI

Internally yields to the event loop every ~256 KB of raw data, so the browser stays responsive:

```ts
const fileHash = await md5(await file.arrayBuffer())
```
