<script setup>
import { onMounted, ref } from 'vue'

const uiFeedback = ref(null)
const loading = ref(false)

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab')
  uiFeedback.value = mod.uiFeedback
})

function trigger() {
  loading.value = true
  uiFeedback.value?.showLoading('加载中…')
  setTimeout(() => {
    uiFeedback.value?.hideLoading()
    loading.value = false
  }, 2000)
}
</script>

<style>
.load-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
}
.load-btn {
  padding: 8px 20px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
</style>

<ClientOnly>
  <div class="load-demo">
    <button v-if="uiFeedback" class="load-btn" :disabled="loading" @click="trigger">
      {{ loading ? '加载中…' : '显示 Loading (2s)' }}
    </button>
  </div>
</ClientOnly>

---

# Loading

全屏 Loading 遮罩，**支持嵌套调用**——内部维护计数器，确保多层调用正确匹配。

## 基本用法

```ts
uiFeedback.showLoading('加载中...')
await someAsyncTask()
uiFeedback.hideLoading()
```

## 嵌套场景

```ts
async function fetchA() {
  uiFeedback.showLoading('加载 A...')
  await delay(1000)
  uiFeedback.hideLoading() // 计数器未归零，不会关闭
}

async function fetchB() {
  uiFeedback.showLoading('加载 B...')
  await delay(2000)
  uiFeedback.hideLoading() // 计数器归零，真正关闭
}

await Promise.all([fetchA(), fetchB()])
```

## force 参数

```ts
uiFeedback.hideLoading(true) // 强制关闭，重置计数器
```
