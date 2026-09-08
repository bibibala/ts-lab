<script setup>
import { onMounted, ref } from 'vue'

const uiFeedback = ref(null)

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab/ui')
  uiFeedback.value = mod.uiFeedback
})
</script>

<style>
.toast-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
  display: flex; gap: 8px; flex-wrap: wrap;
}
.toast-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: #fff;
}
.toast-btn.s { background: #22c55e; }
.toast-btn.e { background: #ef4444; }
.toast-btn.w { background: #f59e0b; }
.toast-btn.i { background: #3b82f6; }
</style>

<ClientOnly>
  <div class="toast-demo">
    <button v-if="uiFeedback" class="toast-btn s" @click="uiFeedback.success('Operation succeeded')">Success</button>
    <button v-if="uiFeedback" class="toast-btn e" @click="uiFeedback.error('Operation failed')">Error</button>
    <button v-if="uiFeedback" class="toast-btn w" @click="uiFeedback.warning('Please note')">Warning</button>
    <button v-if="uiFeedback" class="toast-btn i" @click="uiFeedback.info('Information')">Info</button>
  </div>
</ClientOnly>

---

# Toast

Toast notification with six preset types and custom options.

## Preset Types

```ts
uiFeedback.success('Saved successfully!')
uiFeedback.error('Operation failed')
uiFeedback.warning('Please check input')
uiFeedback.info('Information')

// Custom display duration (ms) and position
uiFeedback.success('Disappears in 3s', 3000)
uiFeedback.error('Bottom notification', 2000, 'bottom')
```

Six positions available: `'top'` (default), `'bottom'`, `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`, `'center'`.

## Custom Toast

```ts
uiFeedback.toast({ message: 'Custom', type: 'success', duration: 3000 })
// String shorthand → equivalent to info type
uiFeedback.toast('A line of text')
```
