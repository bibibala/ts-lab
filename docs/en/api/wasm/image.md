# Image · Image to Icon

A WebAssembly-based image format conversion tool that converts PNG to ICO (Windows icon), ICNS (macOS icon), and multi-size PNG.

## initModule

Initialize the WASM module. Automatically loads the WebAssembly binary; all subsequent conversion methods call this internally, so you don't need to call it manually.

```ts
function initModule(): Promise<WasmModule>
```

Multiple calls are idempotent — returns the same Module instance.

```ts
import { initModule } from '@bilibaba/ts-lab/wasm'

// Optional: pre-warm WASM
await initModule()
```

## getIco

Convert a PNG image to ICO format.

```ts
function getIco(imageData: Uint8Array): Promise<Uint8Array>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageData` | `Uint8Array` | Raw PNG byte data |

```ts
const ico = await getIco(imageData)
// Download Uint8Array as file
const blob = new Blob([ico], { type: 'image/x-icon' })
```

## getIcns

Convert a PNG image to ICNS format.

```ts
function getIcns(imageData: Uint8Array): Promise<Uint8Array>
```

```ts
const icns = await getIcns(imageData)
```

## getPngs

Generate multi-size PNGs. Returns a Map keyed by size (in pixels).

```ts
function getPngs(imageData: Uint8Array): Promise<Record<number, Uint8Array>>
```

Generated sizes: `16, 24, 30, 32, 40, 48, 64, 72, 80, 96, 128, 256, 512, 1024` px

```ts
const pngs = await getPngs(imageData)
// { 16: Uint8Array, 24: Uint8Array, 32: Uint8Array, ... }

for (const [size, data] of Object.entries(pngs)) {
  console.log(`${size}px → ${(data.byteLength / 1024).toFixed(1)} KB`)
}
```

## getImageBoth

Convert all formats at once: ICO + ICNS + multi-size PNG.

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

## Complete Example

```ts
import { getIco, getIcns, getPngs, getImageBoth } from '@bilibaba/ts-lab/wasm'

// Assuming you already have PNG byte data from input[type=file] or fetch
const response = await fetch('/photo.png')
const imageData = new Uint8Array(await response.arrayBuffer())

// Individual conversions
const ico = await getIco(imageData)
const icns = await getIcns(imageData)
const pngs = await getPngs(imageData)

// Or convert all at once
const all = await getImageBoth(imageData)
// all.ico / all.icns / all.pngs
```
