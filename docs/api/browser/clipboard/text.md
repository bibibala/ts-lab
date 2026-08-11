<script setup>
import { ref } from 'vue'
import { writeText, readText } from '@bilibaba/ts-lab'

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
      <button class="tx-btn" @click="copy">{{ copied ? '✓ 已复制' : '复制' }}</button>
      <button class="tx-btn" @click="read">读取</button>
    </div>
    <div v-if="result" class="tx-result">📋 {{ result }}</div>
  </div>
</ClientOnly>

---

# 文本读写

纯文本的复制和粘贴，最常用的两个操作。

## writeText

写入纯文本到剪贴板。优先使用 Clipboard API，失败或不支持时自动降级为 `execCommand('copy')`。

```ts
import { writeText } from '@bilibaba/ts-lab'

await writeText('Hello, world!')
```

即使在不支持 Clipboard API 的旧浏览器中也能正常工作——内部会创建一个隐藏的 `<textarea>`，选中后执行 `execCommand('copy')`。

## readText

从剪贴板读取纯文本。仅支持 Clipboard API，需要用户授予剪贴板读取权限。

```ts
import { readText } from '@bilibaba/ts-lab'

const text = await readText()
console.log(text) // 'Hello, world!'
```

::: warning
`readText` 没有 `execCommand` 降级方案。在不支持 Clipboard API 的环境下会抛出 `NOT_SUPPORTED`。
:::
