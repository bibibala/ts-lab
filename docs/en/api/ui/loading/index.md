<script setup>
import { onMounted, ref } from 'vue'

const loadingMod = ref(null)
const isLoading = ref(false)

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab/ui')
  loadingMod.value = mod.loading
})

function trigger() {
  isLoading.value = true
  loadingMod.value?.show('Loading…')
  setTimeout(() => {
    loadingMod.value?.hide()
    isLoading.value = false
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
    <button v-if="loadingMod" class="load-btn" :disabled="isLoading" @click="trigger">
      {{ isLoading ? 'Loading…' : 'Show Loading (2s)' }}
    </button>
  </div>
</ClientOnly>

---

# Loading

A full-screen loading overlay that **supports nested calls** — internally maintains a counter to ensure multiple calls are correctly matched.

## Basic Usage

```ts
import { loading } from '@bilibaba/ts-lab/ui'

loading.show('Loading...')
await someAsyncTask()
loading.hide()
```

## Nested Scenarios

```ts
async function fetchA() {
  loading.show('Loading A...')
  await delay(1000)
  loading.hide() // Counter not zero, won't close
}

async function fetchB() {
  loading.show('Loading B...')
  await delay(2000)
  loading.hide() // Counter reaches zero, actually closes
}

await Promise.all([fetchA(), fetchB()])
```

## force Parameter

```ts
loading.hide(true) // Force close, resets counter
```
