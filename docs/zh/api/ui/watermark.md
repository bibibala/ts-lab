<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

let wm: any = null
const wmModule = ref<any>(null)
const active = ref(false)
const text = ref('张三 · 内部资料')
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
  decodeResult.value = '解码中…'

  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const code = wmModule.value.decodeWatermark(img)
    if (code !== null) {
      decodeResult.value = `0x${code.toString(16).toUpperCase().padStart(4, '0')}`
    } else {
      decodeResult.value = '解码失败（图片太小或无水印）'
    }
    decoding.value = false
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    decodeResult.value = '图片加载失败'
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
      <label>水印文字</label>
      <input v-model="text" @change="updateParams" placeholder="水印文字" />
    </div>
    <div class="wm-field">
      <label>透明度 (0–1)</label>
      <input v-model.number="opacity" type="range" min="0.02" max="0.3" step="0.01" @input="updateParams" />
      <span style="font-size:12px;color:var(--vp-c-text-2)">{{ opacity }}</span>
    </div>
    <div class="wm-field">
      <label>旋转角度</label>
      <input v-model.number="rotate" type="range" min="-60" max="0" step="1" @input="updateParams" />
      <span style="font-size:12px;color:var(--vp-c-text-2)">{{ rotate }}°</span>
    </div>
    <div class="wm-check">
      <input type="checkbox" id="wm-stego" v-model="stegoDebug" @change="updateParams" />
      <label for="wm-stego">隐形水印可见（调试）</label>
    </div>
    <button
      v-if="wmModule"
      class="wm-btn"
      :style="{ background: active ? '#dc2626' : 'var(--vp-c-brand-1)' }"
      @click="toggle"
    >
      {{ active ? '移除水印' : '显示水印' }}
    </button>
    <label
      v-if="wmModule && active"
      class="wm-btn"
      style="background:#6d28d9;cursor:pointer;display:inline-flex;align-items:center;"
    >
      {{ decoding ? '解码中…' : '上传截图解码' }}
      <input type="file" accept="image/*" style="display:none" :disabled="decoding" @change="decodeFromFile" />
    </label>
    <span v-if="decodeResult" style="font-family:monospace;font-size:13px;color:var(--vp-c-brand-1);margin-left:4px;">{{ decodeResult }}</span>
  </div>
</ClientOnly>

---

# Watermark · 页面水印

零依赖的页面水印组件。Canvas 生成背景图 + MutationObserver 防篡改保护。支持多行文字、明暗主题、隐藏标识追踪、像素域隐形水印和动态刷新。

> ⚠️ **注意：** 默认水印文字为白色（适配本页面深色主题）。在浅色页面使用时请将 `colorScheme` 改为 `'dark'`（黑字）。

## 快速开始

```ts
import { createWatermark } from '@bilibaba/ts-lab/ui'

const wm = createWatermark({
  text: '内部资料',
  opacity: 0.1,
  rotate: -25,
  colorScheme: 'light',  // 白字（深色主题）。浅色页面请用 'dark'
})
```

页面会立即覆盖一层半透明水印背景（`pointer-events: none`，不影响任何交互）。默认黑字（`colorScheme: 'dark'`），深色主题页面需改为 `'light'`。

---

## API

### createWatermark(options)

创建水印实例并挂载到 `<body>`。

```ts
const wm = createWatermark({
  // ===== 基础 =====
  text: ['内部资料', '张三'],   // 水印文字，string | string[]
  opacity: 0.15,                // 透明度 0–1，默认 0.15
  rotate: -30,                  // 旋转角度 (°)，默认 -30
  fontSize: 16,                 // 字号 px，默认 16
  fontFamily: 'sans-serif',     // 字体
  color: '#000',                // 文字颜色，默认 '#000'
  colorScheme: 'light',          // 主题：'light' 白字 | 'dark' 黑字，默认 'light'
  gap: [200, 150],              // [水平间距, 垂直间距] px，默认 [200, 150]
  width: 300,                   // Canvas 宽度（默认自动计算）
  height: 200,                  // Canvas 高度（默认自动计算）
  zIndex: 9999,                 // z-index，默认 9999

  // ===== 保护 =====
  protect: true,                // MutationObserver 防篡改，默认 true

  // ===== 身份追踪（仅隐形）=====
  userId: '10001',              // 用户 ID，作为隐形水印载荷（不追加可见文字）

  // ===== 隐形水印（实验性）=====
  invisibleId: false,           // 将 userId hash 嵌入像素域（扩频噪声），截图取证
  stegoDebug: false,            // DEBUG：将隐形水印振幅放大到肉眼可见，验证嵌入逻辑

  // ===== 动态刷新 =====
  dynamic: false,               // 定时刷新水印（日期自动更新）
  interval: 30000,              // 刷新间隔 ms，默认 30s
})
```

**返回值** `WatermarkInstance`：

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

运行时更新水印。传入部分配置即可，未传的项保持不变：

```ts
wm.update({ text: '新水印文字' })
wm.update({ opacity: 0.2, rotate: -45 })
wm.update({ colorScheme: 'light' })
```

`protect`、`dynamic`、`interval` 等也可在 `update` 中修改，内部会自动同步 protector 和定时器。

---

### wm.destroy()

销毁水印：断开 MutationObserver、清除定时器、移除 DOM 节点。调用后实例不可再用。

---

### wm.show() / wm.hide()

临时显示 / 隐藏水印层。`hide()` 会同时暂停动态刷新的定时器（避免不可见时无效 Canvas 重绘），`show()` 会恢复定时器。

```ts
wm.hide()
// ... 不需要水印的阶段
wm.show()   // 定时器自动恢复
```

---

## 明暗主题

通过 `colorScheme` 控制水印文字颜色以适应页面背景色。默认 `'light'`（白字，适配深色主题）：

```ts
// 深色背景 → 浅色文字（默认）
createWatermark({ text: '内部资料' })
// 等价于
createWatermark({ text: '内部资料', colorScheme: 'light' })

// 浅色背景 → 深色文字
createWatermark({ text: '内部资料', colorScheme: 'dark' })
```

| `colorScheme` | 文字颜色 | 适用场景 |
|---------------|----------|----------|
| `'light'`（默认） | 白色 `#fff` | 深色页面背景 |
| `'dark'` | 黑色 `#000` | 浅色页面背景 |

`colorScheme` 优先级高于 `color`——设置了 `colorScheme` 后会忽略 `color` 的自定义值。

---

## 防篡改保护

`protect: true`（默认）时，MutationObserver 监控并恢复以下受保护样式：

| 监测情形 | 行为 |
|----------|------|
| 水印 DOM 被 `remove()` 删除 | 自动重新挂载到 `body` |
| `style.display` 被设为 `none` | 重置为可见（合法 `hide()` 除外） |
| `visibility` / `opacity` / `zIndex` / `pointerEvents` 被篡改 | 恢复为预期值 |
| `backgroundImage` 被替换 | 恢复 |
| 祖先节点被清空 | 重新挂载 |

> 这是提高篡改门槛的前端防护，并非绝对安全——DevTools 完全可控的浏览器环境中无法 100% 防删除。

---

## 身份追踪

`userId` 仅作为隐形水印的载荷使用，**不会在水印上追加任何可见文字**。如需可见的追踪信息，直接在 `text` 中写入：

```ts
createWatermark({
  text: ['内部资料', '张三', 'ID:6B8A2F'],  // 手动写入追踪文字
  userId: '10001',                           // 仅用于隐形水印
  invisibleId: true,
})
```

---

## 隐形水印（实验性）

`invisibleId: true` 会将 `userId` hash 的低 16 位以像素域扩频方式嵌入 Canvas 图块。原理：

- 将 Canvas 划分为 16×16 px 的 block
- 每个 block 用确定性伪随机 ±1 噪声（mulberry32 PRNG）叠加到 RGB 通道
- 振幅仅 3/255，肉眼不可见
- 生产级 JPEG 重压缩可能破坏此模式

**调试**：`stegoDebug: true` 将振幅放大到 60/255，block 网格肉眼可见，用于验证嵌入逻辑是否正常工作。**切勿在生产环境开启**。

```ts
createWatermark({
  text: '机密',
  userId: '10001',
  invisibleId: true,
  stegoDebug: true,     // ← 仅调试用
})
```

### 解码

`decodeWatermark` 可从截图或图片中反向提取嵌入的 16-bit code：

```ts
import { decodeWatermark } from '@bilibaba/ts-lab/ui'

const img = document.querySelector('img.wm-screenshot') as HTMLImageElement
const code = decodeWatermark(img)
if (code !== null) {
  console.log('提取码:', code.toString(16).toUpperCase())
}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `source` | `HTMLImageElement \| HTMLCanvasElement \| ImageData` | 截图或图片源 |
| 返回值 | `number \| null` | 解码出的 16-bit code，图片太小或非浏览器环境返回 `null` |

**限制**：需 1:1 原始分辨率的截图；缩放、裁剪偏移、重度 JPEG 压缩后解码可能失败。

---

## 动态水印

`dynamic: true` 时水印按 `interval` 周期自动刷新。`hide()` 时暂停定时器，`show()` 恢复：

```ts
const wm = createWatermark({
  text: '机密文件',
  userId: '10001',
  dynamic: true,
  interval: 15000,  // 每 15 秒刷新
})

wm.hide()  // 同时暂停定时器
wm.show()  // 恢复定时器
```

---

## SSR 安全

非浏览器环境（`window` 或 `document` 不可用）时返回 no-op 实例，所有方法调用安全无操作：

```ts
// Node / SSR 中安全调用
const wm = createWatermark({ text: 'test' })
wm.update({ text: 'changed' })  // no-op
wm.destroy()                     // no-op
```
