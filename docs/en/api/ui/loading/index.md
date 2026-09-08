<script setup>
import { onMounted, ref } from 'vue'

const loadingMod = ref(null)
const isLoading = ref(false)
const selectedSpinner = ref('spin')
const selectedSize = ref(40)

const spinnerOptions = [
  { value: 'spin', label: 'spin (default)' },
  { value: 'pulse', label: 'pulse' },
  { value: 'wave', label: 'wave' },
  { value: 'dots', label: 'dots' },
  { value: 'dual-ring', label: 'dual-ring' },
]

const sizeOptions = [
  { value: 24, label: '24px' },
  { value: 32, label: '32px' },
  { value: 40, label: '40px (default)' },
  { value: 56, label: '56px' },
  { value: 72, label: '72px' },
]

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab/ui')
  loadingMod.value = mod.loading
})

function trigger() {
  isLoading.value = true
  loadingMod.value?.show('Loading…', { spinner: selectedSpinner.value, size: selectedSize.value })
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
  display: flex;
  align-items: center;
  gap: 12px;
}
.load-btn {
  padding: 8px 20px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
.load-select {
  padding: 8px 12px; border: 1px solid var(--vp-c-divider); border-radius: 6px;
  font-size: 13px; background: var(--vp-c-bg); color: var(--vp-c-text-1);
}
</style>

<ClientOnly>
  <div class="load-demo">
    <select v-if="loadingMod" v-model="selectedSpinner" class="load-select">
      <option v-for="opt in spinnerOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <select v-if="loadingMod" v-model="selectedSize" class="load-select">
      <option v-for="opt in sizeOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <button v-if="loadingMod" class="load-btn" :disabled="isLoading" @click="trigger">
      {{ isLoading ? 'Loading…' : 'Show Loading (2s)' }}
    </button>
  </div>
</ClientOnly>

---

# Loading

A full-screen loading overlay that **supports nested calls** — internally maintains a counter to match multiple calls correctly.

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

## Spinner Types

Supports 5 loading animation styles:

| Type | Description | Effect |
|------|-------------|--------|
| `spin` | Spinning ring (default) | Classic rotation animation |
| `pulse` | Pulse | Size and opacity changes |
| `wave` | Wave | Three dots moving up and down sequentially |
| `dots` | Blinking dots | Three dots blinking sequentially |
| `dual-ring` | Dual ring | Two concentric rings rotating at different speeds |

### Usage Examples

```ts
// Default spin animation
loading.show('Loading...')

// Pulse animation
loading.show('Loading...', { spinner: 'pulse' })

// Wave animation
loading.show('Loading...', { spinner: 'wave' })

// Dots animation
loading.show('Loading...', { spinner: 'dots' })

// Dual ring animation
loading.show('Loading...', { spinner: 'dual-ring' })

// Custom size (pixels)
loading.show('Loading...', { size: 60 })

// Combined usage
loading.show('Loading...', { spinner: 'pulse', size: 48 })
```

### Animation Descriptions

| Style | Animation Description |
|-------|----------------------|
| spin | Classic rotation, 0.7s per revolution |
| pulse | 0.8-1.2x scale, opacity 0.5-1 |
| wave | Three dots moving up and down sequentially, 0.1s interval |
| dots | Three dots blinking sequentially, 0.2s interval |
| dual-ring | Outer ring 1.2s, inner ring 1.8s reverse rotation |
