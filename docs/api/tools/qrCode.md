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

// ---- 解读 ----
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
        decodeError.value = '未识别到有效的 QR 码'
      }
    } catch (_e) {
      decodeError.value = '解码失败'
    }
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    decodeError.value = '图片加载失败'
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

/* 解读 */
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
        <label for="qr-text">文本内容</label>
        <input id="qr-text" v-model="text" class="qr-input" placeholder="输入要编码的文字…" maxlength="200" />
      </div>
      <div class="qr-field">
        <label for="qr-ec">纠错级别</label>
        <select id="qr-ec" v-model.number="ecLevel" class="qr-select">
          <option v-for="opt in ecOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
    <div class="qr-output">
      <img v-if="dataUrl" :src="dataUrl" alt="QR Code" />
      <div v-if="qr" class="qr-meta">
        Version {{ qr.version }} · {{ qr.size }}×{{ qr.size }} 模块
      </div>
    </div>
  </div>
</ClientOnly>

<ClientOnly>
  <div class="qr-demo">
    <div class="qr-controls">
      <div class="qr-field">
        <label>解读二维码</label>
        <label class="qr-file-btn">
          选择图片<input type="file" accept="image/*" @change="handleDecodeFile" />
        </label>
        <img v-if="readerImg" :src="readerImg" class="qr-reader-preview" alt="preview" style="margin-top:8px" />
      </div>
    </div>
    <div class="qr-output" style="flex:1; align-items:flex-start;">
      <div v-if="decodeResult" class="qr-reader-result">{{ decodeResult }}</div>
      <div v-if="decodeError" class="qr-reader-error">{{ decodeError }}</div>
      <div v-if="!decodeResult && !decodeError" class="qr-meta">选择一张包含 QR 码的图片即可解码</div>
    </div>
  </div>
</ClientOnly>

---

# QR Code · 二维码生成与解析

纯 TypeScript 实现的二维码生成与解码器。零依赖，支持从文本生成 QR 码、Canvas 渲染输出，以及从像素数据反向解码。

## 类型导出

```ts
export enum ECLevel { L = 0, M = 1, Q = 2, H = 3 }

export interface QRCode {
  modules: boolean[][]   // 模块矩阵，true = 深色
  version: number        // QR 版本号 (1-40)
  size: number           // 矩阵边长 (version × 4 + 17)
  ecLevel: ECLevel       // 纠错级别
}

export interface ImageInput {
  data: Uint8ClampedArray | Uint8Array | number[]  // RGBA 像素数据
  width: number
  height: number
}

export interface RenderOptions {
  moduleSize?: number    // 每个模块的像素大小，默认 4
  margin?: number        // 四周留白（模块数），默认 4
  darkColor?: string     // 深色模块颜色，默认 '#000000'
  lightColor?: string    // 浅色模块颜色，默认 '#ffffff'
}
```

## generateQRCode

从文本生成 QR 码矩阵。自动选择合适的版本和掩码。

```ts
function generateQRCode(
  text: string,
  ecLevel?: ECLevel,
  version?: number,
): QRCode
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | — | 要编码的文本，支持 UTF-8 |
| `ecLevel` | `ECLevel` | `ECLevel.M` | 纠错级别，可选 L / M / Q / H |
| `version` | `number` | 自动 | QR 版本号 (1-40)，不传则根据数据长度自动选择 |

### 基本用法

```ts
import { generateQRCode, ECLevel } from '@bilibaba/ts-lab/tools'

// 生成默认纠错级别 (M) 的二维码
const qr = generateQRCode('https://ts-lab.netlify.app')

// 指定高纠错级别
const qrH = generateQRCode('hello world', ECLevel.H)

// 固定版本号
const qrV10 = generateQRCode('some data', ECLevel.M, 10)
```

### 纠错级别说明

| 级别 | 可恢复比例 | 适用场景 |
|------|-----------|----------|
| `L` | ≈7% | 环境干净、码不被遮挡 |
| `M` | ≈15% | 一般使用（默认） |
| `Q` | ≈25% | 可能部分污损 |
| `H` | ≈30% | 需要叠加 logo 或高容错 |

## renderQRCodeToCanvas

将 QR 码渲染到指定 `<canvas>` 上。

```ts
function renderQRCodeToCanvas(
  qr: QRCode,
  canvas: HTMLCanvasElement,
  options?: RenderOptions,
): void
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `qr` | `QRCode` | `generateQRCode` 的返回结果 |
| `canvas` | `HTMLCanvasElement` | 目标画布元素 |
| `options` | `RenderOptions` | 渲染选项 |

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

将 QR 码渲染为 Data URL 字符串，适合直接用于 `<img>` 的 `src` 或下载。

```ts
function renderQRCodeToDataURL(
  qr: QRCode,
  options?: RenderOptions,
): string
```

```ts
const qr = generateQRCode('https://example.com')
const dataUrl = renderQRCodeToDataURL(qr, { moduleSize: 6 })

// 用于 <img> 标签
const img = document.createElement('img')
img.src = dataUrl

// 或触发下载
const link = document.createElement('a')
link.href = dataUrl
link.download = 'qrcode.png'
link.click()
```

## readQRCode

从像素数据中解码 QR 码，返回编码的文本内容。解码失败返回 `null`。

```ts
function readQRCode(input: ImageInput): string | null
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `input.data` | `Uint8ClampedArray \| Uint8Array \| number[]` | RGBA 像素数据，每 4 个元素为一个像素 |
| `input.width` | `number` | 图像宽度 |
| `input.height` | `number` | 图像高度 |

### 从 Canvas 读取

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

console.log(text) // 'https://example.com' 或 null
```

### 从 `<img>` / `<video>` 读取

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

### 解码流程

`readQRCode` 内部执行以下步骤：

1. **二值化** — 自适应阈值将图像转为黑白
2. **定位图案检测** — 扫描 1:1:3:1:1 比例定位三个定位图案
3. **模块采样** — 双线性插值采样每个模块
4. **格式信息解码** — BCH 解码获取纠错级别和掩码
5. **去掩码** — 应用对应掩码恢复原始数据
6. **RS 纠错** — Reed-Solomon 解码修复数据错误
7. **数据解码** — 从 bit 流中解析 UTF-8 文本

## 完整示例

```ts
import {
  generateQRCode,
  renderQRCodeToDataURL,
  readQRCode,
  ECLevel,
} from '@bilibaba/ts-lab/tools'

// 1. 生成二维码
const qr = generateQRCode('Hello, ts-lab!', ECLevel.H)

// 2. 渲染为 Data URL
const dataUrl = renderQRCodeToDataURL(qr, { moduleSize: 8 })

// 3. 显示在页面上
const img = document.createElement('img')
img.src = dataUrl
document.body.appendChild(img)

// 4. 等图片加载后解码回文字
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
