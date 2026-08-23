<script setup>
import { ref, onMounted } from 'vue'

const progress = ref(null)
const running = ref(false)
const mode = ref('Default')

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab/ui')
  progress.value = mod.progress
})

function show(m, color) {
  mode.value = m
  running.value = true
  progress.value?.configure({ color })
  progress.value?.start()
  const delay = 1500 + Math.random() * 2000
  setTimeout(() => { running.value = false; progress.value?.done() }, delay)
}
</script>

<style>
.progress-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}
.progress-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: #fff;
}
.progress-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
.progress-hint { font-size: 12px; color: var(--vp-c-text-2); margin-left: 4px; }
</style>

<ClientOnly>
  <div class="progress-demo">
    <button v-if="progress" class="progress-btn" style="background:#29d" :disabled="running" @click="show('Default', '#29d')">Default Blue</button>
    <button v-if="progress" class="progress-btn" style="background:linear-gradient(to right,#f00,#f0f)" :disabled="running" @click="show('Rainbow', ['#f00','#ff0','#0f0','#0ff','#00f','#f0f'])">Rainbow</button>
    <button v-if="progress" class="progress-btn" style="background:linear-gradient(to right,#f97316,#ef4444)" :disabled="running" @click="show('Flame', ['#f97316','#ef4444','#dc2626'])">Flame</button>
    <button v-if="progress" class="progress-btn" style="background:linear-gradient(to right,#667eea,#764ba2)" :disabled="running" @click="show('Purple', ['#667eea','#764ba2'])">Purple</button>
    <span v-if="running" class="progress-hint">{{ mode }} loading...</span>
  </div>
</ClientOnly>

---

# Progress · Top Progress Bar

An NProgress-style page top progress bar. Zero UI framework dependency — manages its own DOM and styles.

## progress

Global singleton, call directly:

```ts
import { progress } from '@bilibaba/ts-lab/ui'
```

## start

Show the progress bar and start auto-increment (trickle).

```ts
progress.start()
```

The progress bar automatically advances in small random increments, simulating a loading process.

## done

Complete progress and hide the progress bar. The bar disappears after the transition animation finishes.

```ts
progress.done()
```

## set

Manually set the progress percentage (0–100).

```ts
progress.set(40)  // Set to 40%
progress.set(80)  // Set to 80%
```

## inc

Manually increment progress; without arguments, uses a random small increment (0.5–3%).

```ts
progress.start()    // Start + auto trickle
progress.inc(10)    // Manually push 10%
progress.inc()      // Random increment
progress.done()     // Complete
```

## configure

Update configuration at runtime; takes effect on next `start()`.

```ts
// Single color
progress.configure({ color: '#e91e63' })

// Two-color gradient — left to right, gradually darker
progress.configure({ color: ['#667eea', '#764ba2'] })

// Rainbow gradient — many colors
progress.configure({ color: ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f'] })
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `color` | `string \| string[]` | `'#29d'` | Bar color. `string` for solid, `string[]` for left-to-right gradient |
| `height` | `number` | `3` | Height (px) |
| `speed` | `number` | `200` | CSS transition speed (ms) |
| `trickle` | `boolean` | `true` | Auto-increment enabled |
| `trickleSpeed` | `number` | `200` | Auto-increment interval (ms) |
| `minimum` | `number` | `0.08` | Starting percentage (0–1) |
| `easing` | `string` | `'ease'` | CSS easing function |

## Typical Usage

```ts
import { progress } from '@bilibaba/ts-lab/ui'

// Route transition — default blue
progress.start()
// ... async loading
progress.done()

// Configure gradient before loading — flame style
progress.configure({ color: ['#f97316', '#ef4444', '#dc2626'] })
progress.start()
// ... done
progress.done()
```
