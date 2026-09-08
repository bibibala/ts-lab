# Getting Started

`@bilibaba/ts-lab` is a lightweight, zero-dependency TypeScript utility library for the browser — fully tree-shakeable.

## Installation

::: code-group
```bash [pnpm]
pnpm add @bilibaba/ts-lab
```
```bash [npm]
npm install @bilibaba/ts-lab
```
```bash [yarn]
yarn add @bilibaba/ts-lab
```
:::

## ESM Imports

ESM only. Import what you need:

```ts
import { detectEnv } from '@bilibaba/ts-lab/browser'
import { createBus, getObjById } from '@bilibaba/ts-lab/tools'
```

Bundlers (Vite / Rollup / webpack / esbuild, etc.) will automatically tree-shake unused code.

You can also import from the root entrypoint; category subpaths (`/browser`, `/tools`, `/ui`, `/wasm`) keep things organized as the API grows:

```ts
import { writeText } from '@bilibaba/ts-lab/browser'
import { progress } from '@bilibaba/ts-lab/ui'
import { getIco } from '@bilibaba/ts-lab/wasm'
```

## TypeScript

Type definitions are built into the package — no need to install additional `@types/*`.

```ts
import { createBus } from '@bilibaba/ts-lab/tools'

interface Events {
  login: { user: string }
  logout: void
}

const bus = createBus<Events>()
//     ^? Bus<Events>
```

## Module Structure

```
src/
├── tools/            # Utility functions
│   ├── recursion/    # Tree data traversal
│   ├── bus/          # Event bus
│   ├── ws/           # WebSocket client
│   ├── qrCode/       # QR code generation & reading
│   └── md5/          # MD5 hashing
├── browser/          # Browser APIs
│   ├── clipboard/    # Clipboard (text/HTML/image/file)
│   ├── env/          # Runtime environment detection
│   └── network/      # Network status info
├── ui/               # UI components
│   ├── feedback/     # Toast notifications
│   ├── loading/      # Global loading overlay
│   ├── progress/     # Top progress bar
│   └── watermark/    # Page watermark
└── wasm/             # WASM capabilities
    └── image/        # Image format conversion
```

| Module | Description |
|--------|-------------|
| [Recursion](/en/api/tools/recursion) | Tree data traversal: find by ID, get parent nodes, path tracing |
| [Bus](/en/api/tools/bus) | Type-safe lightweight event bus with wildcard listener support |
| [WebSocket](/en/api/tools/ws) | WebSocket client: auto-reconnect, heartbeat, offline message queue |
| [QRCode](/en/api/tools/qrCode) | Pure TypeScript QR code generation & reading |
| [MD5](/en/api/tools/md5) | Async MD5 hashing that yields the event loop |
| [Clipboard](/en/api/browser/clipboard/) | Text / HTML / image read/write, file paste, cut, event listening |
| [Env](/en/api/browser/env) | Runtime environment detection (OS / architecture / WeChat / QQ / App WebView) |
| [Network](/en/api/browser/network) | Get current network status (online state, connection type, bandwidth, latency) |
| [Toast](/en/api/ui/feedback/) | Singleton Toast notification component with multiple types and positions |
| [Loading](/en/api/ui/loading/) | Global loading overlay with nested call support |
| [Progress](/en/api/ui/progress) | NProgress-style top progress bar with gradient support |
| [Watermark](/en/api/ui/watermark) | Tamper-proof page watermark with steganographic encoding and dynamic refresh |
| [WASM Image](/en/api/wasm/image) | Image to `.ico` / `.icns` / multi-size PNG |

## Basic Usage

```ts
// Utilities
import { getObjById, getParentNodes, getPathById } from '@bilibaba/ts-lab/tools'
import { createBus } from '@bilibaba/ts-lab/tools'
import { createWS } from '@bilibaba/ts-lab/tools'
import { generateQRCode, readQRCode } from '@bilibaba/ts-lab/tools'
import { md5 } from '@bilibaba/ts-lab/tools'

// Browser APIs
import { writeText, readText, writeImage, onFilePaste } from '@bilibaba/ts-lab/browser'
import { detectEnv } from '@bilibaba/ts-lab/browser'
import { getNetworkInfo } from '@bilibaba/ts-lab/browser'

// UI Components
import { uiFeedback } from '@bilibaba/ts-lab/ui'
import { loading } from '@bilibaba/ts-lab/ui'
import { progress } from '@bilibaba/ts-lab/ui'
import { createWatermark } from '@bilibaba/ts-lab/ui'

// WASM
import { getIco, getIcns, getPngs } from '@bilibaba/ts-lab/wasm'
```

## Browser Compatibility

All modules target modern browsers.
