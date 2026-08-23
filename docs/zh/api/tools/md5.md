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
      placeholder="输入要计算哈希的文本…"
    />
    <div class="md5-field">
      <label>md5</label>
      <div class="md5-value">{{ hash || '-' }}</div>
    </div>
  </div>
</ClientOnly>

---

# MD5

根据 [RFC 1321](https://www.ietf.org/rfc/rfc1321.txt) 实现的纯 TypeScript MD5 哈希工具。零依赖，**纯异步**，支持字符串（UTF-8）、`ArrayBuffer`、`Uint8Array` 输入。

## md5

```ts
function md5(input: string | ArrayBuffer | Uint8Array): Promise<string>
```

返回 32 字符小写 hex 字符串。

```ts
import { md5 } from '@bilibaba/ts-lab/tools'

await md5('hello')
// '5d41402abc4b2a76b9719d911017c592'

await md5('')
// 'd41d8cd98f00b204e9800998ecf8427e'

await md5('你好')
// '7eca689f0d3389d9dea66ae112e5cfd7'
```

## 大文件不卡 UI

内部每处理 ~256 KB 原始数据就 `yield` 给事件循环，浏览器可以正常渲染和响应：

```ts
const fileHash = await md5(await file.arrayBuffer())
```
