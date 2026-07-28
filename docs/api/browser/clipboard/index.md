# 概览

浏览器剪贴板能力的完整封装：文本 / HTML / 图片读写、文件粘贴、剪切、事件监听，自带降级策略和统一错误类型。

## 快速开始

```ts
import { writeText, readText, writeImage, onFilePaste } from '@bilibaba/ts-lab'

// 复制
await writeText('Hello, world!')

// 粘贴
const text = await readText()

// 图片
canvas.toBlob(async (blob) => { if (blob) await writeImage(blob) }, 'image/png')
```

## 特性检测

在调用 API 之前，可以先检测当前环境的支持情况：

```ts
import {
  isSecureContext,
  isClipboardApiSupported,
  isRichClipboardSupported,
  isExecCommandSupported,
  queryClipboardPermission,
} from '@bilibaba/ts-lab'

isSecureContext()              // boolean — 是否 HTTPS / localhost
isClipboardApiSupported()      // boolean — 是否支持 Clipboard API
isRichClipboardSupported()     // boolean — 是否支持 ClipboardItem（图片 / HTML）
isExecCommandSupported()       // boolean — 是否支持 execCommand 降级

// 查询权限状态：'granted' | 'denied' | 'prompt' | 'unknown'
await queryClipboardPermission('clipboard-write')
await queryClipboardPermission('clipboard-read')
```

## 错误处理

所有 API 抛出统一的 `ClipboardError`：

```ts
import { ClipboardError } from '@bilibaba/ts-lab'

try {
  await writeText('hello')
} catch (err) {
  if (err instanceof ClipboardError) {
    console.log(err.code) // 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | ...
    console.log(err.message)
  }
}
```

| 错误码 | 含义 |
|--------|------|
| `NOT_SUPPORTED` | 当前环境不支持该能力 |
| `PERMISSION_DENIED` | 用户 / 系统拒绝了剪贴板权限 |
| `NOT_FOCUSED` | 页面未处于焦点 |
| `EMPTY_CLIPBOARD` | 剪贴板为空或无匹配类型 |
| `INSECURE_CONTEXT` | 非 HTTPS / localhost |
| `UNSUPPORTED_MIME_TYPE` | 尝试写入不允许的 MIME 类型 |
| `UNKNOWN` | 其他未知错误 |

## 降级策略

| API | 降级行为 |
|-----|---------|
| `writeText` | Clipboard API → `execCommand('copy')` |
| `readText` | 无降级，不支持时抛出 `NOT_SUPPORTED` |
| `writeRich` / `readRich` | 无降级，需要 `ClipboardItem` 支持 |
| `cutText` | `execCommand('cut')` → `writeText` |

::: tip 安全上下文
`readText`、`readRich`、`readImage`、`writeRich` 需要 HTTPS / localhost。
本地开发时 `http://localhost` 被视为安全上下文。
:::
