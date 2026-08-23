# Image · 图片转图标

基于 WebAssembly 的图片格式转换工具，将 PNG 转换为 ICO（Windows 图标）、ICNS（macOS 图标）以及多尺寸 PNG。

## initModule

初始化 WASM 模块。会自动加载 WebAssembly 二进制，后续所有转换方法内部都会自动调用此方法，你无需手动调用。

```ts
function initModule(): Promise<WasmModule>
```

多次调用是幂等的，返回同一个 Module 实例。

```ts
import { initModule } from '@bilibaba/ts-lab/wasm'

// 可选：提前预热 WASM
await initModule()
```

## getIco

将 PNG 图片转换为 ICO 格式。

```ts
function getIco(imageData: Uint8Array): Promise<Uint8Array>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `imageData` | `Uint8Array` | PNG 原始字节数据 |

```ts
const ico = await getIco(imageData)
// 将 Uint8Array 下载为文件
const blob = new Blob([ico], { type: 'image/x-icon' })
```

## getIcns

将 PNG 图片转换为 ICNS 格式。

```ts
function getIcns(imageData: Uint8Array): Promise<Uint8Array>
```

```ts
const icns = await getIcns(imageData)
```

## getPngs

生成多尺寸 PNG。返回一个以尺寸（像素）为键的 Map。

```ts
function getPngs(imageData: Uint8Array): Promise<Record<number, Uint8Array>>
```

生成尺寸：`16, 24, 30, 32, 40, 48, 64, 72, 80, 96, 128, 256, 512, 1024` px

```ts
const pngs = await getPngs(imageData)
// { 16: Uint8Array, 24: Uint8Array, 32: Uint8Array, ... }

for (const [size, data] of Object.entries(pngs)) {
  console.log(`${size}px → ${(data.byteLength / 1024).toFixed(1)} KB`)
}
```

## getImageBoth

同时转换所有格式：ICO + ICNS + 多尺寸 PNG。

```ts
function getImageBoth(imageData: Uint8Array): Promise<{
  ico: Uint8Array
  icns: Uint8Array
  pngs: Record<number, Uint8Array>
}>
```

```ts
const { ico, icns, pngs } = await getImageBoth(imageData)
```

## 完整示例

```ts
import { getIco, getIcns, getPngs, getImageBoth } from '@bilibaba/ts-lab/wasm'

// 假设你已经从 input[type=file] 或 fetch 拿到 PNG 的字节数据
const response = await fetch('/photo.png')
const imageData = new Uint8Array(await response.arrayBuffer())

// 单独转换
const ico = await getIco(imageData)
const icns = await getIcns(imageData)
const pngs = await getPngs(imageData)

// 或一次性全部转换
const all = await getImageBoth(imageData)
// all.ico / all.icns / all.pngs
```
