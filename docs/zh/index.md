# 快速开始

`@bilibaba/ts-lab` 是一个面向浏览器的 TypeScript 工具库，零依赖、支持 Tree-shaking。

## 安装

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

## ESM 导入

本包仅提供 ESM 格式，所有模块均可按需引入：

```ts
import { detectEnv } from '@bilibaba/ts-lab/browser'
import { createBus, getObjById } from '@bilibaba/ts-lab/tools'
```

打包工具（Vite / Rollup / webpack / esbuild 等）会自动移除未使用的模块。

也可以从根入口统一导入；随着 API 增多，按分类入口引入更清晰：

```ts
import { writeText } from '@bilibaba/ts-lab/browser'
import { progress } from '@bilibaba/ts-lab/ui'
import { getIco } from '@bilibaba/ts-lab/wasm'
```

## TypeScript

类型定义已内置在包中，无需额外安装 `@types/*`。

```ts
import { createBus } from '@bilibaba/ts-lab/tools'

interface Events {
  login: { user: string }
  logout: void
}

const bus = createBus<Events>()
//     ^? Bus<Events>
```

## 模块结构

```
src/
├── tools/            # 工具函数
│   ├── recursion/    # 树形数据遍历
│   ├── bus/          # 事件总线
│   ├── ws/           # WebSocket 客户端
│   ├── qrCode/       # 二维码生成与读取
│   └── md5/          # MD5 哈希
├── browser/          # 浏览器 API
│   ├── clipboard/    # 剪贴板（文本/HTML/图片/文件）
│   ├── env/          # 运行环境检测
│   └── network/      # 网络状态信息
├── ui/               # UI 组件
│   ├── feedback/     # Toast 提示
│   ├── loading/      # 全局 Loading 遮罩
│   ├── progress/     # 顶部进度条
│   └── watermark/    # 页面水印
└── wasm/             # WASM 能力
    └── image/        # 图片格式转换
```

| 模块 | 说明 |
|------|------|
| [Recursion](/zh/api/tools/recursion) | 树形数据遍历：按 ID 查找、获取父节点、路径追溯 |
| [Bus](/zh/api/tools/bus) | 类型安全的轻量事件总线，支持通配符监听 |
| [WebSocket](/zh/api/tools/ws) | WebSocket 客户端：自动重连、心跳检测、离线消息队列 |
| [QRCode](/zh/api/tools/qrCode) | 纯 TypeScript 二维码生成与读取 |
| [MD5](/zh/api/tools/md5) | 异步 MD5 哈希计算，自动让出事件循环 |
| [Clipboard](/zh/api/browser/clipboard/) | 文本 / HTML / 图片读写、文件粘贴、剪切、事件监听 |
| [Env](/zh/api/browser/env) | 运行环境检测（OS / 架构 / 微信 / QQ / App WebView） |
| [Network](/zh/api/browser/network) | 获取当前网络状态（在线状态、连接类型、带宽、延迟） |
| [Toast](/zh/api/ui/feedback/) | 单例 Toast 提示组件，支持多种类型和位置 |
| [Loading](/zh/api/ui/loading/) | 全局 Loading 遮罩，支持嵌套调用 |
| [Progress](/zh/api/ui/progress) | NProgress 风格顶部进度条，支持渐变色 |
| [Watermark](/zh/api/ui/watermark) | 防篡改页面水印，支持隐写编码和动态刷新 |
| [WASM Image](/zh/api/wasm/image) | 图片转 `.ico` / `.icns` / 多尺寸 PNG |

## 基础用法

```ts
// 工具函数
import { getObjById, getParentNodes, getPathById } from '@bilibaba/ts-lab/tools'
import { createBus } from '@bilibaba/ts-lab/tools'
import { createWS } from '@bilibaba/ts-lab/tools'
import { generateQRCode, readQRCode } from '@bilibaba/ts-lab/tools'
import { md5 } from '@bilibaba/ts-lab/tools'

// 浏览器 API
import { writeText, readText, writeImage, onFilePaste } from '@bilibaba/ts-lab/browser'
import { detectEnv } from '@bilibaba/ts-lab/browser'
import { getNetworkInfo } from '@bilibaba/ts-lab/browser'

// UI 组件
import { uiFeedback } from '@bilibaba/ts-lab/ui'
import { loading } from '@bilibaba/ts-lab/ui'
import { progress } from '@bilibaba/ts-lab/ui'
import { createWatermark } from '@bilibaba/ts-lab/ui'

// WASM
import { getIco, getIcns, getPngs } from '@bilibaba/ts-lab/wasm'
```

## 浏览器兼容性

所有模块均基于现代浏览器 API。
