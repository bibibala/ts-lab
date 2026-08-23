# 快速开始

`@bilibaba/ts-lab` 是一组面向浏览器端的 TypeScript 工具函数集合，零依赖、Tree-shakeable。

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

本包仅提供 ESM 格式，所有模块均可按需导入：

```ts
import { detectEnv } from '@bilibaba/ts-lab/browser'
import { createBus, getObjById } from '@bilibaba/ts-lab/tools'
```

打包工具（Vite / Rollup / webpack / esbuild 等）会自动 Tree-shake 未使用的模块。

也可以继续从根入口导入已有 API；分类入口更适合在 API 变多时保持清晰：

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
│   ├── network/      # 网络状态信息
│   └── webmcp/       # WebMCP 工具注册
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
| [Recursion](/api/tools/recursion) | 树形数据遍历：按 ID 查找、获取父节点、路径追溯 |
| [Bus](/api/tools/bus) | 类型安全的轻量事件总线，支持通配符监听 |
| [WebSocket](/api/tools/ws) | WebSocket 客户端：自动重连、心跳检测、离线消息队列 |
| [QRCode](/api/tools/qrCode) | 纯 TypeScript 二维码生成与读取 |
| [MD5](/api/tools/md5) | 异步 MD5 哈希计算，自动让出事件循环 |
| [Clipboard](/api/browser/clipboard/) | 文本 / HTML / 图片读写、文件粘贴、剪切、事件监听 |
| [Env](/api/browser/env) | 运行环境检测（OS / 架构 / 微信 / QQ / App WebView） |
| [Network](/api/browser/network) | 获取当前网络状态（在线状态、连接类型、带宽、延迟） |
| [WebMCP](/api/browser/webmcp) | 将页面数据 / 函数 / 表单暴露为 WebMCP 工具供 AI Agent 调用 |
| [Toast](/api/ui/feedback/) | 单例 Toast 提示组件，支持多种类型和位置 |
| [Loading](/api/ui/loading/) | 全局 Loading 遮罩，支持嵌套调用 |
| [Progress](/api/ui/progress) | NProgress 风格顶部进度条，支持渐变色 |
| [Watermark](/api/ui/watermark) | 防篡改页面水印，支持隐写编码和动态刷新 |
| [WASM Image](/api/wasm/image) | 图片转 `.ico` / `.icns` / 多尺寸 PNG |

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
import { exposeData, exposeFunction, registerTool } from '@bilibaba/ts-lab/browser'

// UI 组件
import { uiFeedback } from '@bilibaba/ts-lab/ui'
import { loading } from '@bilibaba/ts-lab/ui'
import { progress } from '@bilibaba/ts-lab/ui'
import { createWatermark } from '@bilibaba/ts-lab/ui'

// WASM
import { getIco, getIcns, getPngs } from '@bilibaba/ts-lab/wasm'
```

## 浏览器兼容性

所有模块均面向现代浏览器。WebMCP 模块需要 **Chrome 149+** 并开启以下 flags：

- `chrome://flags/#webmcp`
- `chrome://flags/#devtools-webmcp-support`
