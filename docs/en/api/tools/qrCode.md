<script setup lang="ts">
import { ref, computed } from 'vue'
import { generateQRCode, renderQRCodeToDataURL, readQRCode, ECLevel } from '@bilibaba/ts-lab/tools'

const text = ref('https://ts-lab.netlify.app')
const ecLevel = ref(ECLevel.M)

const ecOptions = [
  { value: ECLevel.L, label: 'L (≈7%)' },
  { value: ECLevel.M, label: 'M (≈15%)' },
  { value: ECLevel.Q, label: 'Q (≈25%)' },
  { value: ECLevel.H, label: 'H (≈30%)' },
]

const qr = computed(() => {
  try {
    return generateQRCode(text.value || 'ts-lab', ecLevel.value)
  } catch (_e) {
    return null
  }
})

const dataUrl = computed(() => {
  if (!qr.value) return ''
  return renderQRCodeToDataURL(qr.value, { moduleSize: 5, margin: 4 })
})

// ---- Decode ----
const readerImg = ref('')
const decodeResult = ref('')
const decodeError = ref('')

function handleDecodeFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  decodeResult.value = ''
  decodeError.value = ''

  const url = URL.createObjectURL(file)
  readerImg.value = url

  const img = new Image()
  img.onload = () => {
    URL.revokeObjectURL(url)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = readQRCode({ data: imageData.data, width: canvas.width, height: canvas.height })
      if (result) {
        decodeResult.value = result
      } else {
        decodeError.value = 'No valid QR code detected'
      }
    } catch (_e) {
      decodeError.value = 'Decoding failed'
    }
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    decodeError.value = 'Image load failed'
  }
  img.src = url
}

</script>

<style>
.qr-demo {
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  padding: 20px 24px; margin: 16px 0 24px; background: var(--vp-c-bg-soft);
  display: flex; gap: 32px; align-items: flex-start;
}
.qr-controls {
  display: flex; flex-direction: column; gap: 12px; flex: 1; min-width: 180px;
}
.qr-field { }
.qr-field label {
  display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: var(--vp-c-text-2);
}
.qr-input, .qr-select {
  width: 100%; padding: 8px 12px; border: 1px solid var(--vp-c-divider);
  border-radius: 6px; font-size: 14px; background: var(--vp-c-bg);
  color: var(--vp-c-text-1); outline: none; box-sizing: border-box;
}
.qr-input:focus { border-color: var(--vp-c-brand-1); }
.qr-select { cursor: pointer; }
.qr-output {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.qr-output img {
  border: 1px solid var(--vp-c-divider); border-radius: 4px;
  background: #fff; image-rendering: pixelated;
}
.qr-meta { font-size: 12px; color: var(--vp-c-text-3); }

@media (max-width: 640px) {
  .qr-demo { flex-direction: column; gap: 16px; }
  .qr-controls { flex-direction: column; }
}

/* Decode */
.qr-reader-preview {
  width: 100%; max-width: 160px; border: 1px solid var(--vp-c-divider);
  border-radius: 4px; background: #fff; image-rendering: pixelated;
}
.qr-reader-result {
  word-break: break-all; font-size: 14px; color: var(--vp-c-text-1);
  background: var(--vp-c-bg); padding: 8px 12px; border-radius: 6px;
  border: 1px solid var(--vp-c-divider); min-height: 20px;
}
.qr-reader-error { font-size: 13px; color: var(--vp-c-danger-1); }
.qr-file-btn {
  display: inline-block; cursor: pointer; font-size: 13px; padding: 6px 14px;
  border: 1px solid var(--vp-c-brand-1); border-radius: 6px;
  color: var(--vp-c-brand-1); background: transparent;
  transition: background .2s, color .2s;
}
.qr-file-btn:hover { background: var(--vp-c-brand-1); color: #fff; }
.qr-file-btn input { display: none; }

</style>

<ClientOnly>
  <div class="qr-demo">
    <div class="qr-controls">
      <div class="qr-field">
        <label for="qr-text">Text Content</label>
        <input id="qr-text" v-model="text" class="qr-input" placeholder="Enter text to encode…" maxlength="200" />
      </div>
      <div class="qr-field">
        <label for="qr-ec">Error Correction Level</label>
        <select id="qr-ec" v-model.number="ecLevel" class="qr-select">
          <option v-for="opt in ecOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
    <div class="qr-output">
      <img v-if="dataUrl" :src="dataUrl" alt="QR Code" />
      <div v-if="qr" class="qr-meta">
        Version {{ qr.version }} · {{ qr.size }}×{{ qr.size }} modules
      </div>
    </div>
  </div>
</ClientOnly>

<ClientOnly>
  <div class="qr-demo">
    <div class="qr-controls">
      <div class="qr-field">
        <label>Decode QR Code</label>
        <label class="qr-file-btn">
          Select Image<input type="file" accept="image/*" @change="handleDecodeFile" />
        </label>
        <img v-if="readerImg" :src="readerImg" class="qr-reader-preview" alt="preview" style="margin-top:8px" />
      </div>
    </div>
    <div class="qr-output" style="flex:1; align-items:flex-start;">
      <div v-if="decodeResult" class="qr-reader-result">{{ decodeResult }}</div>
      <div v-if="decodeError" class="qr-reader-error">{{ decodeError }}</div>
      <div v-if="!decodeResult && !decodeError" class="qr-meta">Select an image containing a QR code to decode</div>
    </div>
  </div>
</ClientOnly>

---

# QR Code · Generation & Decoding

A pure TypeScript QR code generator and decoder. Zero dependencies, supports generating QR codes from text, Canvas rendering output, and reverse-decoding from pixel data.

## Type Exports

```ts
export enum ECLevel { L = 0, M = 1, Q = 2, H = 3 }

export interface QRCode {
  modules: boolean[][]   // Module matrix, true = dark
  version: number        // QR version number (1-40)
  size: number           // Matrix side length (version × 4 + 17)
  ecLevel: ECLevel       // Error correction level
}

export interface ImageInput {
  data: Uint8ClampedArray | Uint8Array | number[]  // RGBA pixel data
  width: number
  height: number
}

export interface RenderOptions {
  moduleSize?: number    // Pixel size per module, default 4
  margin?: number        // Quiet zone (in modules), default 4
  darkColor?: string     // Dark module color, default '#000000'
  lightColor?: string    // Light module color, default '#ffffff'
}
```

## generateQRCode

Generate a QR code matrix from text. Automatically selects the appropriate version and mask.

```ts
function generateQRCode(
  text: string,
  ecLevel?: ECLevel,
  version?: number,
): QRCode
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | — | Text to encode, supports UTF-8 |
| `ecLevel` | `ECLevel` | `ECLevel.M` | Error correction level: L / M / Q / H |
| `version` | `number` | Auto | QR version number (1-40); auto-selects based on data length if omitted |

### Basic Usage

```ts
import { generateQRCode, ECLevel } from '@bilibaba/ts-lab/tools'

// Generate with default error correction level (M)
const qr = generateQRCode('https://ts-lab.netlify.app')

// Specify high error correction level
const qrH = generateQRCode('hello world', ECLevel.H)

// Fixed version
const qrV10 = generateQRCode('some data', ECLevel.M, 10)
```

### Error Correction Level Reference

| Level | Recoverable | Use Case |
|-------|:-----------:|----------|
| `L` | ≈7% | Clean environment, code won't be obscured |
| `M` | ≈15% | General use (default) |
| `Q` | ≈25% | Possibly partially damaged |
| `H` | ≈30% | Needs logo overlay or high fault tolerance |

## renderQRCodeToCanvas

Render a QR code to a specified `<canvas>`.

```ts
function renderQRCodeToCanvas(
  qr: QRCode,
  canvas: HTMLCanvasElement,
  options?: RenderOptions,
): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `qr` | `QRCode` | Return value of `generateQRCode` |
| `canvas` | `HTMLCanvasElement` | Target canvas element |
| `options` | `RenderOptions` | Rendering options |

```ts
import { generateQRCode, renderQRCodeToCanvas } from '@bilibaba/ts-lab/tools'

const qr = generateQRCode('hello')
const canvas = document.querySelector('canvas')!

renderQRCodeToCanvas(qr, canvas, {
  moduleSize: 8,
  margin: 2,
  darkColor: '#1a1a2e',
  lightColor: '#ffffff',
})
```

## renderQRCodeToDataURL

Render a QR code as a Data URL string, suitable for direct use as `<img>` `src` or download.

```ts
function renderQRCodeToDataURL(
  qr: QRCode,
  options?: RenderOptions,
): string
```

```ts
const qr = generateQRCode('https://example.com')
const dataUrl = renderQRCodeToDataURL(qr, { moduleSize: 6 })

// Use in <img> tag
const img = document.createElement('img')
img.src = dataUrl

// Or trigger download
const link = document.createElement('a')
link.href = dataUrl
link.download = 'qrcode.png'
link.click()
```

## readQRCode

Decode a QR code from pixel data, returning the encoded text content. Returns `null` on failure.

```ts
function readQRCode(input: ImageInput): string | null
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `input.data` | `Uint8ClampedArray \| Uint8Array \| number[]` | RGBA pixel data, every 4 elements represent one pixel |
| `input.width` | `number` | Image width |
| `input.height` | `number` | Image height |

### Reading from Canvas

```ts
import { readQRCode } from '@bilibaba/ts-lab/tools'

const canvas = document.querySelector('canvas')!
const ctx = canvas.getContext('2d')!
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

const text = readQRCode({
  data: imageData.data,
  width: canvas.width,
  height: canvas.height,
})

console.log(text) // 'https://example.com' or null
```

### Reading from `<img>` / `<video>`

```ts
const img = document.querySelector('img')!
const canvas = document.createElement('canvas')
canvas.width = img.naturalWidth
canvas.height = img.naturalHeight
const ctx = canvas.getContext('2d')!
ctx.drawImage(img, 0, 0)
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

const text = readQRCode({
  data: imageData.data,
  width: canvas.width,
  height: canvas.height,
})
```

### Decoding Pipeline

`readQRCode` performs the following steps internally:

1. **Binarization** — Adaptive threshold converts image to black and white
2. **Finder Pattern Detection** — Scans for 1:1:3:1:1 ratio to locate three finder patterns
3. **Module Sampling** — Bilinear interpolation sampling for each module
4. **Format Info Decoding** — BCH decoding to obtain error correction level and mask
5. **Unmasking** — Apply corresponding mask to recover original data
6. **RS Error Correction** — Reed-Solomon decoding to repair data errors
7. **Data Decoding** — Parse UTF-8 text from bit stream

## Complete Example

```ts
import {
  generateQRCode,
  renderQRCodeToDataURL,
  readQRCode,
  ECLevel,
} from '@bilibaba/ts-lab/tools'

// 1. Generate QR code
const qr = generateQRCode('Hello, ts-lab!', ECLevel.H)

// 2. Render to Data URL
const dataUrl = renderQRCodeToDataURL(qr, { moduleSize: 8 })

// 3. Display on page
const img = document.createElement('img')
img.src = dataUrl
document.body.appendChild(img)

// 4. Decode back to text after image loads
img.onload = () => {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const decoded = readQRCode({
    data: imageData.data,
    width: canvas.width,
    height: canvas.height,
  })

  console.log(decoded) // 'Hello, ts-lab!'
}
```
