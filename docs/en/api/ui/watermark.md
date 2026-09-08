<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

let wm: any = null
const wmModule = ref<any>(null)
const active = ref(false)
const text = ref('Confidential · Internal')
const opacity = ref(0.1)
const rotate = ref(-25)
const stegoDebug = ref(false)
const decodeResult = ref('')
const decoding = ref(false)

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab/ui')
  wmModule.value = mod
})

onUnmounted(() => {
  wm?.destroy()
})

function toggle() {
  if (wm) {
    wm.destroy()
    wm = null
    active.value = false
    decodeResult.value = ''
    return
  }
  wm = wmModule.value?.createWatermark({
    text: text.value,
    opacity: opacity.value,
    rotate: rotate.value,
    colorScheme: 'light',
    gap: [220, 160],
    protect: false,
    userId: '999999',
    invisibleId: true,
    stegoDebug: stegoDebug.value,
  })
  active.value = true
}

function updateParams() {
  if (!wm) return
  wm.update({
    text: text.value,
    opacity: opacity.value,
    rotate: rotate.value,
    stegoDebug: stegoDebug.value,
  })
  decodeResult.value = ''
}

async function decodeFromFile(e: Event) {
  if (!wmModule.value) return
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  decoding.value = true
  decodeResult.value = 'Decoding…'

  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const code = wmModule.value.decodeWatermark(img)
    if (code !== null) {
      decodeResult.value = `0x${code.toString(16).toUpperCase().padStart(4, '0')}`
    } else {
      decodeResult.value = 'Decoding failed (image too small or no watermark)'
    }
    decoding.value = false
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    decodeResult.value = 'Image load failed'
    decoding.value = false
  }
  img.src = url
}
</script>

<style>
.wm-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}
.wm-field { display: flex; flex-direction: column; gap: 4px; }
.wm-field label { font-size: 12px; color: var(--vp-c-text-2); }
.wm-field input {
  padding: 6px 10px; border: 1px solid var(--vp-c-divider);
  border-radius: 6px; font-size: 13px; background: var(--vp-c-bg);
  color: var(--vp-c-text-1); width: 160px;
}
.wm-check { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.wm-btn {
  padding: 8px 24px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: #fff;
}
</style>

<ClientOnly>
  <div class="wm-demo">
    <div class="wm-field">
      <label>Watermark Text</label>
      <input v-model="text" @change="updateParams" placeholder="Watermark text" />
    </div>
    <div class="wm-field">
      <label>Opacity (0–1)</label>
      <input v-model.number="opacity" type="range" min="0.02" max="0.3" step="0.01" @input="updateParams" />
      <span style="font-size:12px;color:var(--vp-c-text-2)">{{ opacity }}</span>
    </div>
    <div class="wm-field">
      <label>Rotation Angle</label>
      <input v-model.number="rotate" type="range" min="-60" max="0" step="1" @input="updateParams" />
      <span style="font-size:12px;color:var(--vp-c-text-2)">{{ rotate }}°</span>
    </div>
    <div class="wm-check">
      <input type="checkbox" id="wm-stego" v-model="stegoDebug" @change="updateParams" />
      <label for="wm-stego">Show invisible watermark (debug)</label>
    </div>
    <button
      v-if="wmModule"
      class="wm-btn"
      :style="{ background: active ? '#dc2626' : 'var(--vp-c-brand-1)' }"
      @click="toggle"
    >
      {{ active ? 'Remove Watermark' : 'Show Watermark' }}
    </button>
    <label
      v-if="wmModule && active"
      class="wm-btn"
      style="background:#6d28d9;cursor:pointer;display:inline-flex;align-items:center;"
    >
      {{ decoding ? 'Decoding…' : 'Upload Screenshot to Decode' }}
      <input type="file" accept="image/*" style="display:none" :disabled="decoding" @change="decodeFromFile" />
    </label>
    <span v-if="decodeResult" style="font-family:monospace;font-size:13px;color:var(--vp-c-brand-1);margin-left:4px;">{{ decodeResult }}</span>
  </div>
</ClientOnly>

---

# Watermark · Page Watermark

A zero-dependency page watermark component. Canvas-generated background + MutationObserver tamper protection. Supports multi-line text, light/dark themes, identity tracking, pixel-domain steganographic watermark, and dynamic refresh.

> **Note:** The default watermark text is white (suited for this page's dark theme). For light-themed pages, change `colorScheme` to `'dark'` (black text).

## Quick Start

```ts
import { createWatermark } from '@bilibaba/ts-lab/ui'

const wm = createWatermark({
  text: 'Confidential',
  opacity: 0.1,
  rotate: -25,
  colorScheme: 'light',  // White text (dark theme). Use 'dark' for light pages
})
```

The page immediately gets a semi-transparent watermark overlay (`pointer-events: none`, no impact on interactions). Defaults to white text (`colorScheme: 'light'`); for light-themed pages, use `'dark'`.

---

## API

### createWatermark(options)

Create a watermark instance and mount it to `<body>`.

```ts
const wm = createWatermark({
  // ===== Basic =====
  text: ['Confidential', 'John Doe'],   // Watermark text, string | string[]
  opacity: 0.15,                // Opacity 0–1, default 0.15
  rotate: -30,                  // Rotation angle (°), default -30
  fontSize: 16,                 // Font size px, default 16
  fontFamily: 'sans-serif',     // Font family
  color: '#000',                // Text color, default '#000'
  colorScheme: 'light',          // Theme: 'light' white text | 'dark' black text, default 'light'
  gap: [200, 150],              // [horizontal gap, vertical gap] px, default [200, 150]
  width: 300,                   // Canvas width (auto-calculated by default)
  height: 200,                  // Canvas height (auto-calculated by default)
  zIndex: 9999,                 // z-index, default 9999

  // ===== Protection =====
  protect: true,                // MutationObserver tamper protection, default true

  // ===== Identity Tracking (invisible only) =====
  userId: '10001',              // User ID, used as invisible watermark payload (no visible text appended)

  // ===== Invisible Watermark (experimental) =====
  invisibleId: false,           // Embed userId hash into pixel domain (spread-spectrum noise) for screenshot forensics
  stegoDebug: false,            // DEBUG: Amplify invisible watermark amplitude to be visible, for verifying embedding logic

  // ===== Dynamic Refresh =====
  dynamic: false,               // Periodically refresh watermark (date auto-updates)
  interval: 30000,              // Refresh interval ms, default 30s
})
```

**Return value** `WatermarkInstance`:

```ts
interface WatermarkInstance {
  update: (options: Partial<WatermarkOptions>) => void
  destroy: () => void
  show: () => void
  hide: () => void
}
```

---

### wm.update(options)

Update the watermark at runtime. Pass partial config; unspecified fields remain unchanged:

```ts
wm.update({ text: 'New watermark text' })
wm.update({ opacity: 0.2, rotate: -45 })
wm.update({ colorScheme: 'light' })
```

`protect`, `dynamic`, `interval`, etc. can also be modified via `update`; the protector and timers are automatically synced internally.

---

### wm.destroy()

Destroy the watermark: disconnect MutationObserver, clear timers, remove DOM nodes. The instance cannot be reused after calling.

---

### wm.show() / wm.hide()

Temporarily show / hide the watermark layer. `hide()` also pauses the dynamic refresh timer (to avoid invalid canvas redraws while invisible); `show()` restores the timer.

```ts
wm.hide()
// ... watermark-free period
wm.show()   // Timer auto-restored
```

---

## Light/Dark Themes

Control watermark text color via `colorScheme` to match the page background. Default is `'light'` (white text, suited for dark themes):

```ts
// Dark background → light text (default)
createWatermark({ text: 'Confidential' })
// Equivalent to
createWatermark({ text: 'Confidential', colorScheme: 'light' })

// Light background → dark text
createWatermark({ text: 'Confidential', colorScheme: 'dark' })
```

| `colorScheme` | Text Color | Use Case |
|---------------|-----------|----------|
| `'light'` (default) | White `#fff` | Dark page backgrounds |
| `'dark'` | Black `#000` | Light page backgrounds |

`colorScheme` takes priority over `color` — once `colorScheme` is set, custom `color` values are ignored.

---

## Tamper Protection

With `protect: true` (default), MutationObserver monitors and restores the following protected styles:

| Scenario | Behavior |
|----------|----------|
| Watermark DOM `remove()`-ed | Auto re-mount to `body` |
| `style.display` set to `none` | Reset to visible (except legitimate `hide()`) |
| `visibility` / `opacity` / `zIndex` / `pointerEvents` tampered | Restore to expected values |
| `backgroundImage` replaced | Restore |
| Ancestor nodes cleared | Re-mount |

> This is a front-end defense that raises the tampering bar — it's not absolutely secure. In a browser environment where DevTools has full control, 100% deletion prevention is not possible.

---

## Identity Tracking

`userId` is only used as the invisible watermark payload — **no visible text is appended to the watermark**. For visible tracking info, write it directly in `text`:

```ts
createWatermark({
  text: ['Confidential', 'John Doe', 'ID:6B8A2F'],  // Manually write tracking text
  userId: '10001',                                    // Only for invisible watermark
  invisibleId: true,
})
```

---

## Invisible Watermark (Experimental)

`invisibleId: true` embeds the low 16 bits of the `userId` hash into canvas blocks via pixel-domain spread-spectrum. How it works:

- Divides the canvas into 16×16 px blocks
- Each block applies deterministic pseudo-random ±1 noise (mulberry32 PRNG) to RGB channels
- Amplitude is only 3/255 — invisible to the naked eye
- Production-grade JPEG recompression may destroy this pattern

**Debug**: `stegoDebug: true` amplifies the amplitude to 60/255, making the block grid visible for verifying the embedding logic. **Never enable in production**.

```ts
createWatermark({
  text: 'Confidential',
  userId: '10001',
  invisibleId: true,
  stegoDebug: true,     // ← Debug only
})
```

### Decoding

`decodeWatermark` extracts the embedded 16-bit code from screenshots or images:

```ts
import { decodeWatermark } from '@bilibaba/ts-lab/ui'

const img = document.querySelector('img.wm-screenshot') as HTMLImageElement
const code = decodeWatermark(img)
if (code !== null) {
  console.log('Extracted code:', code.toString(16).toUpperCase())
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | `HTMLImageElement \| HTMLCanvasElement \| ImageData` | Screenshot or image source |
| Returns | `number \| null` | Decoded 16-bit code; returns `null` if image is too small or in non-browser environment |

**Limitations**: Requires 1:1 original resolution screenshots; scaling, crop offset, or heavy JPEG compression may cause decoding to fail.

---

## Dynamic Watermark

With `dynamic: true`, the watermark auto-refreshes at the `interval` period. `hide()` pauses the timer, `show()` restores it:

```ts
const wm = createWatermark({
  text: 'Confidential',
  userId: '10001',
  dynamic: true,
  interval: 15000,  // Refresh every 15 seconds
})

wm.hide()  // Also pauses timer
wm.show()  // Restores timer
```

---

## SSR Safe

In non-browser environments (`window` or `document` unavailable), returns a no-op instance — all method calls are safe no-ops:

```ts
// Safe to call in Node / SSR
const wm = createWatermark({ text: 'test' })
wm.update({ text: 'changed' })  // no-op
wm.destroy()                     // no-op
```
