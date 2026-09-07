# AGENTS.md

`@bilibaba/ts-lab` — 轻量、零依赖、TypeScript 优先的浏览器工具库。

本文档面向 AI Agent，说明每个模块的用途、导入方式和调用方法。

## 安装与导入

```bash
pnpm add @bilibaba/ts-lab
```

四个子路径入口，按需导入：

```ts
import { detectEnv, getNetworkInfo, readText, writeText } from '@bilibaba/ts-lab/browser'
import { createBus, createWS, generateQRCode, getObjById, md5 } from '@bilibaba/ts-lab/tools'
import { createWatermark, loading, progress, uiFeedback } from '@bilibaba/ts-lab/ui'
import { getIcns, getIco, getPngs } from '@bilibaba/ts-lab/wasm'
```

也可从主入口导入全部：

```ts
import { createBus, getIco, uiFeedback, writeText } from '@bilibaba/ts-lab'
```

> 注意：`browser/`、`ui/`、`wasm/` 下的工具依赖浏览器 API（DOM、navigator、Canvas、WebAssembly）。在 Node.js 环境下部分工具会降级或报错。

---

## browser — 浏览器 API 封装

### clipboard — 剪贴板

写入/读取剪贴板内容，支持纯文本、富文本（HTML）、图片、文件，自带 API 能力检测和降级。

```ts
import {
  ClipboardError,
  cutFromInput,
  cutText,
  formatFileSize,
  generateId,
  isClipboardApiSupported,
  isExecCommandSupported,
  isRichClipboardSupported,
  isSecureContext,
  isWritableMimeType,
  onClipboardEvent,
  onFilePaste,
  processPastedFiles,
  queryClipboardPermission,
  readImage,
  readRich,
  readText,
  revokePastedFilePreview,
  WRITABLE_MIME_TYPES,
  writeFile,
  writeHtml,
  writeImage,
  writeRich,
  writeText,
} from '@bilibaba/ts-lab/browser'
```

| 函数 | 签名 | 用途 |
|------|------|------|
| `writeText` | `(text: string) => Promise<void>` | 写入纯文本到剪贴板，优先用 Clipboard API，降级 execCommand |
| `readText` | `() => Promise<string>` | 读取剪贴板纯文本（仅现代 API，无降级） |
| `writeRich` | `(items: ClipboardContentItem[]) => Promise<void>` | 同时写入多种 MIME 类型（HTML + 纯文本等），需 `isRichClipboardSupported()` |
| `readRich` | `() => Promise<ClipboardReadItem[]>` | 读取剪贴板全部内容（可能含图片、HTML），返回 `{ type, blob }[]` |
| `writeImage` | `(blob: Blob, type?) => Promise<void>` | 写入图片 Blob 到剪贴板 |
| `writeHtml` | `(html: string, plainTextFallback?) => Promise<void>` | 写入 HTML 富文本，可选纯文本降级 |
| `readImage` | `() => Promise<Blob \| null>` | 读取剪贴板中第一张图片，无图片返回 null |
| `cutText` | `(text: string) => Promise<void>` | 剪切文本到剪贴板 |
| `cutFromInput` | `(el: HTMLInputElement \| HTMLTextAreaElement) => Promise<string>` | 从输入框剪切选中文本，返回被剪切的文本 |
| `onClipboardEvent` | `(eventName, handler, target?) => () => void` | 监听 copy/cut/paste 事件，返回取消监听函数 |
| `onFilePaste` | `(handler, options?, target?) => () => void` | 监听粘贴文件事件，自动处理为 `ProcessedPastedFile[]` |
| `writeFile` | `(file: File) => Promise<void>` | 写入文件到剪贴板（仅支持图片类型的 MIME） |
| `processPastedFiles` | `(files: File[]) => ProcessedPastedFile[]` | 将原始文件列表转为结构化信息（含预览 URL） |
| `revokePastedFilePreview` | `(item: ProcessedPastedFile) => void` | 释放预览 URL，防止内存泄漏 |
| `formatFileSize` | `(bytes: number) => string` | 格式化文件大小，如 `"1.2 MB"` |
| `generateId` | `() => string` | 生成唯一 ID |

**能力检测函数**（均返回 `boolean`）：

| 函数 | 用途 |
|------|------|
| `isClipboardApiSupported()` | 现代 Clipboard API 是否可用 |
| `isRichClipboardSupported()` | 富文本剪贴板（ClipboardItem）是否可用 |
| `isSecureContext()` | 是否安全上下文（HTTPS/localhost） |
| `isExecCommandSupported()` | execCommand 降级是否可用 |
| `queryClipboardPermission(name)` | 查询剪贴板读/写权限状态，返回 `'granted' \| 'denied' \| 'prompt' \| 'unknown'` |

**使用示例**：

```ts
// 写入纯文本
await writeText('Hello')

// 读取纯文本
const text = await readText()

// 写入 HTML + 纯文本降级
await writeHtml('<b>bold</b>', 'bold')

// 监听粘贴文件
const unbind = onFilePaste((files) => {
  files.forEach((f) => {
    console.log(f.name, f.formattedSize, f.isImage, f.previewUrl)
    // 用完后释放预览
    revokePastedFilePreview(f)
  })
})

// 监听剪贴板事件
const off = onClipboardEvent('paste', (payload) => {
  console.log(payload.text, payload.html, payload.files)
})
```

---

### env — 环境检测

检测操作系统、CPU 架构、运行容器（微信/QQ/App WebView/浏览器）。

```ts
import { detectEnv } from '@bilibaba/ts-lab/browser'
```

| 函数 | 签名 | 用途 |
|------|------|------|
| `detectEnv` | `(appFlag?: string) => Promise<EnvInfo>` | 检测完整运行环境 |

`EnvInfo` 返回值：

```ts
{
  os: 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown'
  arch: 'arm64' | 'arm' | 'x64' | 'x86' | 'unknown'
  isQQ: boolean // QQ 内置浏览器
  isWechat: boolean // 微信内置浏览器
  isInApp: boolean // 自己 App 的 WebView
  isBrowser: boolean // 普通浏览器（以上都不是）
  ua: string // 原始 User-Agent
}
```

**使用示例**：

```ts
const env = await detectEnv()
if (env.isWechat) { /* 微信内 */ }
if (env.os === 'ios') { /* iOS */ }
// 自定义 App WebView 检测
const env2 = await detectEnv('MyAppWebView')
if (env2.isInApp) { /* 在 App 内 */ }
```

---

### network — 网络信息

获取当前网络状态。

```ts
import { getNetworkInfo } from '@bilibaba/ts-lab/browser'
```

| 函数 | 签名 | 用途 |
|------|------|------|
| `getNetworkInfo` | `() => NetworkInfo` | 获取网络信息，非浏览器环境返回默认值并打印警告 |

`NetworkInfo` 返回值：

```ts
{
  online: boolean // 是否在线
  effectiveType: string // '4g' | '3g' | '2g' | 'slow-2g' | 'unknown'
  downlink: number // 下行速度 Mb/s
  rtt: number // 往返延迟 ms
  saveData: boolean // 是否省流模式
  connectionType: string // 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'
}
```

```ts
const info = getNetworkInfo()
if (!info.online) { /* 离线 */ }
if (info.effectiveType === 'slow-2g') { /* 弱网 */ }
```

---

### webmcp — WebMCP 工具注册

将页面功能暴露为 AI 可调用的工具（需 Chrome 149+ 开启 WebMCP flags）。

```ts
import {
  exposeAction,
  exposeData,
  exposeForm,
  exposeFunction,
  isWebMCPSupported,
  registerTool,
} from '@bilibaba/ts-lab/browser'
```

| 函数 | 签名 | 用途 |
|------|------|------|
| `isWebMCPSupported` | `() => boolean` | 检测 WebMCP 是否可用 |
| `registerTool` | `(definition, opts?) => boolean` | 注册一个完整的 WebMCP 工具 |
| `exposeFunction` | `(name, fn, opts) => boolean` | 将一个异步函数暴露为工具（有返回值） |
| `exposeAction` | `(name, fn, opts) => boolean` | 将一个 UI 操作暴露为工具（无返回值，只返回 `{ done: true }`） |
| `exposeData` | `(name, data, options) => boolean` | 将数组数据暴露为一组 CRUD 工具 |
| `exposeForm` | `(name, formState, options) => boolean` | 将表单状态暴露为填写/提交工具 |

**exposeFunction** — 暴露一个有返回值的函数：

```ts
exposeFunction('greet', async ({ name }: { name: string }) => {
  return { greeting: `Hello, ${name}!` }
}, {
  description: 'Say hello',
  params: { name: { type: 'string', description: 'Your name' } },
  required: ['name'],
})
```

**exposeAction** — 暴露一个 UI 操作（打开弹窗、切换面板等）：

```ts
exposeAction('openInvoiceDialog', async () => {
  dialogOpen.value = true
}, { description: 'Open the create-invoice dialog' })
```

**exposeData** — 将数组暴露为 CRUD 工具集：

```ts
const ORDERS = [
  { id: '001', customer: 'Alice', amount: 100 },
  { id: '002', customer: 'Bob', amount: 200 },
]

exposeData('orders', ORDERS, {
  idField: 'id',
  searchFields: ['id', 'customer'],
  fields: {
    id: { type: 'string', description: 'Order ID' },
    customer: { type: 'string', description: 'Customer name' },
    amount: { type: 'number', description: 'Order amount' },
  },
})
// 自动生成：orders_search, orders_get, orders_add, orders_delete, orders_stats
// 可通过 tools 参数选择性注册，如 tools: ['search', 'get']
```

**exposeForm** — 将表单暴露为填写工具：

```ts
const form = reactive({ customer: '', amount: 0 })
exposeForm('invoiceForm', form, {
  description: 'Fill the invoice form',
  fields: {
    customer: { type: 'string', description: 'Customer name' },
    amount: { type: 'number', description: 'Invoice amount' },
  },
  required: ['customer', 'amount'],
  allowSubmit: true,
  onSubmit: () => submitInvoice(form),
})
// 生成：invoiceForm_fill（始终注册）、invoiceForm_submit（allowSubmit=true 时注册）
```

**`params` / `fields` 的 FieldSchema 格式**：

```ts
{ type: 'string' | 'number' | 'boolean', description: string }
```

**AbortSignal 清理**：

```ts
const controller = new AbortController()
exposeFunction('myTool', fn, { description: '...', signal: controller.signal })
// 组件卸载时：
controller.abort()
```

---

## tools — 通用工具

### bus — 事件总线

轻量级类型安全的发布/订阅事件系统。

```ts
import { createBus } from '@bilibaba/ts-lab/tools'
```

```ts
interface Events {
  login: { userId: string }
  logout: undefined
  error: Error
}

const bus = createBus<Events>()

// 订阅
bus.on('login', data => console.log(data.userId))
bus.on('error', err => console.error(err))

// 通配符 — 监听所有事件
bus.on('*', (type, event) => console.log(type, event))

// 发布
bus.emit('login', { userId: '123' })
bus.emit('logout') // undefined 类型的事件可以不传第二个参数

// 取消订阅
function handler(err: Error) {}
bus.on('error', handler)
bus.off('error', handler)
```

---

### md5 — MD5 哈希

异步计算 MD5 值，大文件不会阻塞 UI（每 256KB 让出事件循环）。

```ts
import { md5 } from '@bilibaba/ts-lab/tools'
```

```ts
// 字符串
const hash = await md5('hello')
// '5d41402abc4b2a76b9719d911017c592'

// 文件
const fileHash = await md5(await file.arrayBuffer())

// ArrayBuffer / Uint8Array
const buf = new Uint8Array([1, 2, 3])
const h = await md5(buf)
```

---

### qrCode — 二维码

纯 TypeScript 实现的二维码生成与解析，零依赖。

```ts
import {
  ECLevel,
  generateQRCode,
  readQRCode,
  renderQRCodeToCanvas,
  renderQRCodeToDataURL,
} from '@bilibaba/ts-lab/tools'
```

| 函数 | 签名 | 用途 |
|------|------|------|
| `generateQRCode` | `(text, ecLevel?, version?) => QRCode` | 生成二维码矩阵数据 |
| `renderQRCodeToCanvas` | `(qr, canvas, options?) => void` | 渲染到 Canvas 元素 |
| `renderQRCodeToDataURL` | `(qr, options?) => string` | 渲染为 PNG data URL |
| `readQRCode` | `(input: ImageInput) => string \| null` | 从 RGBA 图像数据解析二维码 |

`ECLevel` 纠错等级枚举：`ECLevel.L`(7%) / `ECLevel.M`(15%) / `ECLevel.Q`(25%) / `ECLevel.H`(30%)

**使用示例**：

```ts
// 生成并渲染到 Canvas
const qr = generateQRCode('https://example.com')
renderQRCodeToCanvas(qr, document.getElementById('canvas') as HTMLCanvasElement, {
  moduleSize: 8,
  margin: 4,
  darkColor: '#000',
  lightColor: '#fff',
})

// 生成 data URL
const qr = generateQRCode('hello', ECLevel.H)
const dataUrl = renderQRCodeToDataURL(qr)

// 解析二维码（需要 RGBA 像素数据）
const imageData = ctx.getImageData(0, 0, width, height)
const text = readQRCode({
  data: imageData.data,
  width: imageData.width,
  height: imageData.height,
})
```

`RenderOptions`（渲染选项）：

```ts
{
  moduleSize?: number    // 每个模块像素大小，默认 4
  margin?: number        // 边距（模块数），默认 4
  darkColor?: string     // 深色，默认 '#000000'
  lightColor?: string    // 浅色，默认 '#ffffff'
}
```

---

### recursion — 树结构递归工具

对树形数据（如菜单、组织架构）进行查找和遍历。所有函数都支持自定义 `idKey` 和 `childrenKey` 字段名。

```ts
import { getObjById, getParentNodes, getPathById, getTopLevelNode } from '@bilibaba/ts-lab/tools'
```

| 函数 | 签名 | 用途 |
|------|------|------|
| `getObjById` | `(list, id, idKey?, childrenKey?) => T \| null` | 递归查找指定 ID 的节点 |
| `getParentNodes` | `(treeList, childIds, idKey?, childrenKey?) => T[]` | 查找包含指定子节点 ID 的所有直接父节点 |
| `getTopLevelNode` | `(treeList, targetId, idKey?, childrenKey?) => T \| null` | 查找包含目标节点的顶层根节点 |
| `getPathById` | `(list, id, idKey?, childrenKey?) => T[] \| null` | 查找从根到目标节点的路径（面包屑） |

**使用示例**：

```ts
const tree = [
  {
    id: 1,
    name: 'Root',
    children: [
      { id: 2, name: 'A', children: [
        { id: 4, name: 'A-1' },
      ] },
      { id: 3, name: 'B' },
    ],
  },
]

// 查找节点
const node = getObjById(tree, 4) // { id: 4, name: 'A-1' }

// 查找路径（面包屑）
const path = getPathById(tree, 4) // [Root, A, A-1]

// 查找父节点
const parents = getParentNodes(tree, [4]) // [A]

// 查找根节点
const root = getTopLevelNode(tree, 4) // Root

// 自定义字段名
const customTree = [{ key: 1, items: [{ key: 2 }] }]
getObjById(customTree, 2, 'key', 'items')
```

---

### ws — WebSocket 客户端

带自动重连、心跳检测、离线消息队列的 WebSocket 封装。

```ts
import { createWS } from '@bilibaba/ts-lab/tools'
```

```ts
const ws = createWS('wss://example.com/ws', {
  // 重连配置
  reconnect: true, // 是否自动重连，默认 true
  reconnectInterval: 3000, // 初始重连间隔 ms，默认 3000
  backoffMultiplier: 2, // 退避倍数，默认 2
  maxReconnectInterval: 30000, // 最大重连间隔 ms，默认 30000
  maxReconnectAttempts: 5, // 最大重试次数，默认 5
  jitter: true, // 随机抖动，默认 true

  // 心跳配置
  heartbeatInterval: 30000, // 心跳间隔 ms，默认 0（禁用）
  heartbeatMessage: 'ping', // 心跳消息，默认 'ping'，也支持函数
  heartbeatTimeoutMultiplier: 2, // 超时倍数，默认 2

  // 离线队列
  queueWhenOffline: true, // 断线时缓存消息，默认 false（直接抛错）
  maxQueueSize: 100, // 最大缓存条数，默认 100
})
```

**事件监听**（所有 `on*` 方法返回取消订阅函数）：

```ts
const offOpen = ws.onOpen(() => console.log('connected'))
const offClose = ws.onClose(ev => console.log('closed', ev.code))
const offError = ws.onError(ev => console.error('error', ev))
const offMsg = ws.onMessage<string>((data, ev) => {
  // data 是原始数据，不会自动解析
  console.log(data)
})

// 取消监听
offOpen()
```

**发送与关闭**：

```ts
// 发送（对象会自动 JSON.stringify）
ws.send({ type: 'hello', payload: 'world' })
ws.send('raw string')
ws.send(new ArrayBuffer(8))

// 关闭（不会触发重连）
ws.close(1000, 'bye')

// 手动立即重连
ws.reconnectNow()
```

**属性**：

```ts
ws.readyState // WebSocket.CONNECTING / OPEN / CLOSING / CLOSED
ws.ws // 底层 WebSocket 实例，可能为 null
```

---

## ui — UI 组件

### feedback — Toast 提示

全局单例 Toast，自带 DOM 和样式，不依赖任何 UI 框架。

```ts
import { uiFeedback } from '@bilibaba/ts-lab/ui'
```

| 方法 | 签名 | 用途 |
|------|------|------|
| `toast` | `(options: { message, type?, duration?, position? } \| string) => void` | 显示提示 |
| `success` | `(message, duration?, position?) => void` | 成功提示（绿色） |
| `error` | `(message, duration?, position?) => void` | 错误提示（红色） |
| `warning` | `(message, duration?, position?) => void` | 警告提示（橙色） |
| `info` | `(message, duration?, position?) => void` | 信息提示（深色） |

`position` 可选值：`'top'`（默认）、`'bottom'`、`'top-left'`、`'top-right'`、`'bottom-left'`、`'bottom-right'`、`'center'`

**使用示例**：

```ts
// 最简用法
uiFeedback.toast('操作成功')

// 完整参数
uiFeedback.toast({
  message: '保存成功',
  type: 'success',
  duration: 3000,
  position: 'top-right',
})

// 快捷方法
uiFeedback.success('提交成功')
uiFeedback.error('网络错误', 5000, 'center')
uiFeedback.warning('注意')
uiFeedback.info('提示信息')
```

---

### loading — 全屏加载遮罩

全局单例加载遮罩，支持嵌套调用（内部计数器）。

```ts
import { loading } from '@bilibaba/ts-lab/ui'
```

| 方法 | 签名 | 用途 |
|------|------|------|
| `show` | `(text?: string) => void` | 显示加载遮罩，支持嵌套调用 |
| `hide` | `(force?: boolean) => void` | 隐藏遮罩，计数器归零时才真正移除。`force=true` 强制关闭 |

**使用示例**：

```ts
loading.show('加载中...')
await fetchData()
loading.hide()

// 嵌套场景（两次 show 需要两次 hide 才会移除）
loading.show('加载 A')
loading.show('加载 B')
loading.hide() // 隐藏 B，遮罩仍在
loading.hide() // 隐藏 A，遮罩移除

// 异常恢复时强制关闭
try {
  loading.show()
  await riskyOperation()
}
catch {
  loading.hide(true) // force=true，直接关闭
}
```

---

### progress — 顶部进度条

NProgress 风格的页面顶部进度条，支持自动缓进。

```ts
import { progress } from '@bilibaba/ts-lab/ui'
```

| 方法 | 签名 | 用途 |
|------|------|------|
| `start` | `() => void` | 开始进度条，重置并启动自动缓进 |
| `done` | `() => void` | 完成进度（跳到 100%）并移除 |
| `set` | `(n: number) => void` | 设置进度百分比（0-100） |
| `inc` | `(amount?: number) => void` | 增加进度，不传则随机增加 0.5-3 |
| `configure` | `(opts: Partial<ProgressOptions>) => void` | 更新配置，下次 `start()` 生效 |

`ProgressOptions`：

```ts
{
  color?: string | string[]  // 颜色或渐变色，默认 '#29d'
  height?: number            // 条高度 px，默认 3
  speed?: number             // CSS 过渡时间 ms，默认 200
  trickle?: boolean          // 是否自动缓进，默认 true
  trickleSpeed?: number      // 缓进间隔 ms，默认 200
  minimum?: number           // 起始百分比，默认 0.08
  easing?: string            // CSS 缓动函数，默认 'ease'
}
```

**使用示例**：

```ts
// 基本用法
progress.start()
await loadData()
progress.done()

// 手动控制
progress.start()
progress.set(30)
// ...处理中
progress.set(70)
// ...完成
progress.done()

// 自定义颜色
progress.configure({ color: ['#f00', '#ff0', '#0f0'] }) // 彩虹渐变
progress.start()
```

---

### watermark — 页面水印

防篡改的页面水印，支持动态刷新、用户 ID 嵌入、隐写水印。

```ts
import { createWatermark, decodeWatermark } from '@bilibaba/ts-lab/ui'
```

**创建水印**：

```ts
const wm = createWatermark({
  text: ['内部资料', '张三'], // 水印文字，字符串或数组
  opacity: 0.15, // 透明度，默认 0.15
  rotate: -30, // 旋转角度，默认 -30
  gap: [200, 150], // 水印间距 [水平, 垂直]，默认 [200, 150]
  fontSize: 16, // 字号，默认 16
  color: '#000', // 颜色，默认 '#000'
  fontFamily: 'sans-serif', // 字体，默认 'sans-serif'
  protect: true, // 防篡改（MutationObserver + 计算样式检查），默认 true
  zIndex: 9999, // 层级，默认 9999

  // 可选：动态水印（定时刷新，如显示时间）
  dynamic: false, // 是否动态，默认 false
  interval: 30000, // 刷新间隔 ms，默认 30000

  // 可选：用户标识
  userId: 'user-123', // 用户 ID，会嵌入水印中

  // 可选：隐写水印（截图后可追溯）
  invisibleId: false, // 是否启用隐写，默认 false

  // 可选：CSS !important 注入防护
  styleCheckInterval: 1000, // 计算样式检查间隔 ms，默认 1000，设为 0 禁用
  onTamperDetected: () => { // 样式篡改检测回调
    console.warn('水印被篡改，已自动恢复')
  },
})
```

> 防篡改机制：`protect: true` 时启用双重防护——MutationObserver 监听 DOM 结构和属性变化，同时定期通过 `getComputedStyle()` 检查计算样式，防御 CSS `!important` 注入攻击。检测到篡改时自动恢复并触发 `onTamperDetected` 回调。

**实例方法**：

```ts
wm.update({ text: ['新的水印'] }) // 更新配置
wm.hide() // 隐藏
wm.show() // 显示
wm.destroy() // 销毁，释放所有资源
```

**解码隐写水印**（从截图中提取用户标识）：

```ts
import { decodeWatermark } from '@bilibaba/ts-lab/ui'

// 从图片/Canvas/ImageData 中解码
const img = document.getElementById('screenshot') as HTMLImageElement
const code = decodeWatermark(img) // 返回 number | null
```

---

## wasm — WebAssembly 工具

### image — 图片格式转换

基于 WASM 的 PNG 转 ICO/ICNS/多尺寸 PNG 工具。输入必须是 PNG 格式的 `Uint8Array`，限制 50MB。

```ts
import { getIcns, getIco, getImageBoth, getPngs, initModule } from '@bilibaba/ts-lab/wasm'
```

| 函数 | 签名 | 用途 |
|------|------|------|
| `initModule` | `() => Promise<WasmModule>` | 初始化 WASM 模块（懒加载，单例缓存） |
| `getIco` | `(imageData: Uint8Array) => Promise<Uint8Array>` | PNG → ICO |
| `getIcns` | `(imageData: Uint8Array) => Promise<Uint8Array>` | PNG → ICNS（macOS 图标） |
| `getPngs` | `(imageData: Uint8Array) => Promise<Record<number, Uint8Array>>` | PNG → 多尺寸 PNG（16/24/30/32/40/48/64/72/80/96/128/256/512/1024） |
| `getImageBoth` | `(imageData: Uint8Array) => Promise<{ ico, icns, pngs }>` | 一次性转换全部格式 |

**使用示例**：

```ts
// 从文件获取 PNG 字节
const file = document.querySelector<HTMLInputElement>('#file')!.files![0]
const pngData = new Uint8Array(await file.arrayBuffer())

// 转 ICO
const icoData = await getIco(pngData)
// 转 macOS 图标
const icnsData = await getIcns(pngData)
// 转多尺寸 PNG
const pngs = await getPngs(pngData)
// pngs[16], pngs[32], pngs[64], pngs[128], pngs[256], pngs[512], pngs[1024] ...

// 一次性全部转换
const all = await getImageBoth(pngData)
// all.ico, all.icns, all.pngs

// 下载示例
function download(data: Uint8Array, filename: string) {
  const blob = new Blob([data])
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
download(icoData, 'icon.ico')
```

> 注意：首次调用会自动加载 WASM 模块（约几十 KB），后续调用直接使用缓存。非浏览器环境（无 WebAssembly）会抛错。

---

## 快速对照表

| 需求 | 导入 | 调用 |
|------|------|------|
| 复制文本到剪贴板 | `browser` | `await writeText('...')` |
| 读取剪贴板 | `browser` | `await readText()` |
| 检测微信/手机/系统 | `browser` | `await detectEnv()` |
| 获取网络状态 | `browser` | `getNetworkInfo()` |
| 注册 AI 可调用工具 | `browser` | `exposeFunction(...)` / `exposeData(...)` / `exposeForm(...)` |
| 发布/订阅事件 | `tools` | `createBus<Events>()` → `.on()` / `.emit()` |
| 计算 MD5 | `tools` | `await md5('...')` |
| 生成二维码 | `tools` | `generateQRCode('...')` → `renderQRCodeToDataURL(qr)` |
| 解析二维码 | `tools` | `readQRCode({ data, width, height })` |
| 树结构查找 | `tools` | `getObjById(tree, id)` / `getPathById(tree, id)` |
| WebSocket 客户端 | `tools` | `createWS(url, options)` |
| Toast 提示 | `ui` | `uiFeedback.success('...')` |
| 加载遮罩 | `ui` | `loading.show()` / `loading.hide()` |
| 进度条 | `ui` | `progress.start()` / `progress.done()` |
| 页面水印 | `ui` | `createWatermark({ text: '...' })` |
| PNG 转 ICO/ICNS | `wasm` | `await getIco(pngUint8Array)` |
