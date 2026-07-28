# 文件 · 剪切 · 事件

文件粘贴、剪切操作、底层事件监听以及辅助工具函数。

## 文件粘贴

::: warning 安全限制
浏览器不允许网页 JS 主动把任意文件写入系统剪贴板，仅支持 `text/plain`、`text/html`、`image/png`。文件粘贴只能通过监听 `paste` 事件从用户操作中获取。
:::

### writeFile

仅当文件是图片（MIME 在白名单内）时才能写入，否则抛出 `UNSUPPORTED_MIME_TYPE`：

```ts
import { writeFile } from '@bilibaba/ts-lab'

const file = new File(['...'], 'photo.png', { type: 'image/png' })
await writeFile(file)
```

### onFilePaste

监听用户粘贴文件。用户在文件管理器里选中几张图和一个 PDF，回到网页 Ctrl+V——回调一次拿到**全部**文件，图片和文档混在一起也没问题，`isImage` 标记帮你区分：

```ts
import { onFilePaste } from '@bilibaba/ts-lab'
import type { ProcessedPastedFile } from '@bilibaba/ts-lab'

const unbind = onFilePaste((files: ProcessedPastedFile[]) => {
  for (const f of files) {
    console.log(f.name)           // 'photo.jpg' | 'report.pdf' | ...
    console.log(f.formattedSize)  // '2.1 MB'
    console.log(f.mimeType)       // 'image/jpeg' | 'application/pdf'
    console.log(f.isImage)        // true | false

    if (f.previewUrl) {
      // 图片有预览 URL，直接 <img :src="f.previewUrl" />
    }
  }
})

// 不再需要时解绑
unbind()
```

每次粘贴回调收到的 `files` 是一个数组，用户在系统里同时复制了多个文件、在文件夹里多选后 Ctrl+V，都会一次性全部拿到。图片类型的文件自动生成 `previewUrl`，非图片（PDF、文档等）`previewUrl` 为 `null`、`isImage` 为 `false`，调用方可以按 MIME 类型选择图标展示。

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `processed` | `true` | 是否预处理文件（生成 id、previewUrl 等），`false` 则回调收到原始 `File[]` |
| `preventDefault` | `true` | 是否阻止浏览器默认粘贴行为 |

```ts
// 需要原始 File[]（比如直接交给 FormData 上传）
onFilePaste((files: File[]) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  await upload(form)
}, { processed: false })
```

### processPastedFiles / revokePastedFilePreview

手动处理粘贴文件或释放预览 URL：

```ts
import { processPastedFiles, revokePastedFilePreview } from '@bilibaba/ts-lab'

const processed = processPastedFiles(rawFiles)
// 使用完毕后释放
for (const item of processed) {
  revokePastedFilePreview(item)
}
```

## 剪切

### cutText

将文本剪切到剪贴板（等价于复制，不清空来源）：

```ts
import { cutText } from '@bilibaba/ts-lab'

await cutText('选中的文本')
```

### cutFromInput

从 `input` / `textarea` 中剪切选中内容：

```ts
import { cutFromInput } from '@bilibaba/ts-lab'

const el = document.querySelector('textarea')!
const selected = await cutFromInput(el)
console.log(selected) // 被剪切的内容，同时已从输入框中移除
```

## 事件监听

### onClipboardEvent

监听 `copy` / `cut` / `paste` 事件，返回取消监听函数：

```ts
import { onClipboardEvent } from '@bilibaba/ts-lab'

const unbind = onClipboardEvent('paste', (payload) => {
  console.log(payload.text)   // clipboardData 中的纯文本
  console.log(payload.html)   // clipboardData 中的 HTML（仅 paste 常见）
  console.log(payload.files)  // 文件列表（仅 paste 常见）
  console.log(payload.originalEvent) // 原生 ClipboardEvent
})

// 不再需要时
unbind()
```

第三个参数可指定监听目标（默认 `document`）：

```ts
onClipboardEvent('copy', handler, myElement)
```

## 工具函数

| 函数 | 说明 |
|------|------|
| `formatFileSize(bytes)` | 字节 → `'1.2 MB'` |
| `generateId()` | 生成唯一 ID（`crypto.randomUUID` 或降级方案） |
| `isWritableMimeType(type)` | 判断 MIME 类型是否可写入系统剪贴板 |
