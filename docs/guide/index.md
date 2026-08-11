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

## 模块结构

```
src/
├── tools/            # 工具函数
│   ├── recursion/    # 树遍历
│   └── bus/          # 事件总线
├── browser/          # 浏览器 API
│   ├── clipboard/    # 剪贴板
│   ├── env/          # 环境检测
│   ├── network/      # 网络信息
│   └── webmcp/       # AI 工具注册
├── ui/               # UI 组件
│   ├── feedback/     # Toast + Index
│   └── progress/     # 顶部进度条
└── wasm/             # WASM 能力
```

| 模块 | 说明 |
|------|------|
| [Recursion](/api/tools/recursion) | 树形数据遍历：按 ID 查找、获取父节点、路径追溯 |
| [Bus](/api/tools/bus) | 类型安全的轻量事件总线 |
| [Clipboard](/api/browser/clipboard/) | 文本 / HTML / 图片读写、文件粘贴、剪切 |
| [Env](/api/browser/env) | 浏览器 UA 环境检测（微信 / QQ / iOS / Android） |
| [Feedback](/api/ui/feedback/) | 单例 Toast + Index，零 UI 框架依赖 |
| [Progress](/api/ui/progress) | 顶部页面进度条 |
| [Network](/api/browser/network) | 获取当前网络状态信息 |
| [WebMCP](/api/browser/webmcp) | 将页面数据暴露为 WebMCP 工具供 AI Agent 调用 |
| [WASM Image](/api/wasm/image) | 图片转 `.ico` / `.icns` / 多尺寸 PNG |

## 基础用法

```ts
import { detectEnv, getNetworkInfo, writeText } from '@bilibaba/ts-lab/browser'
import { createBus, getObjById } from '@bilibaba/ts-lab/tools'
import { progress, uiFeedback } from '@bilibaba/ts-lab/ui'
import { getIco } from '@bilibaba/ts-lab/wasm'
```

## 浏览器兼容性

所有模块均面向现代浏览器。WebMCP 模块需要 **Chrome 149+** 并开启以下 flags：

- `chrome://flags/#webmcp`
- `chrome://flags/#devtools-webmcp-support`
