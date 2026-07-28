# 图片与富文本

剪贴板不只存文字——你在网页上选中一段带格式的表格 Ctrl+C，粘贴到飞书时表格还在，这是因为剪贴板同时存了 `text/html` 和 `text/plain` 两份数据。下面这些 API 就是做这类事的，需要浏览器支持 `ClipboardItem`（`isRichClipboardSupported()` 返回 `true`）。

## 复制带格式的内容到邮件 / 飞书

想做一个「分享报价单」按钮：用户一点，HTML 表格进剪贴板，粘贴到邮件或飞书时保留格式；粘贴到纯文本输入框时自动显示纯文本版本。

用 `writeHtml` —— 它同时写入 HTML 和一份纯文本回退：

```ts
import { writeHtml } from '@bilibaba/ts-lab'

await writeHtml(
  `<table style="border-collapse:collapse">
     <tr><th>Q1</th><th>Q2</th></tr>
     <tr><td>¥12,000</td><td>¥18,500</td></tr>
   </table>`,
  'Q1: ¥12,000  Q2: ¥18,500'  // 纯文本回退
)
```

底层原理就是一次往剪贴板里塞了两个 MIME 类型。如果你想自己控制塞哪些格式——比如额外加一个 `text/csv`——用更底层的 `writeRich`：

```ts
import { writeRich } from '@bilibaba/ts-lab'

await writeRich([
  { type: 'text/html', data: '<table>...</table>' },
  { type: 'text/csv',  data: 'Q1,12\nQ2,18' },
  { type: 'text/plain', data: 'Q1: 12  Q2: 18' },
])
```

反过来也成立——`readRich` 能拿到剪贴板里所有格式。用户在网页上复制一段文字，剪贴板里通常同时有 `text/plain` 和 `text/html`：

```ts
import { readRich } from '@bilibaba/ts-lab'

const items = await readRich()
// items[0] — { type: 'text/plain', blob: ... }
// items[1] — { type: 'text/html',  blob: ... }
```

## 图片进剪贴板：canvas 图表一键粘贴

做完一个 canvas 统计图，用户想直接 Ctrl+V 贴到飞书或 PPT 里。不用先下载再插入——`writeImage` 把 Blob 写进剪贴板：

```ts
import { writeImage } from '@bilibaba/ts-lab'

// canvas 导出 → 直接进剪贴板
canvas.toBlob(async (blob) => {
  if (blob) await writeImage(blob)
}, 'image/png')

// 或者网络图片直接复制
const blob = await fetch('/qrcode.png').then(r => r.blob())
await writeImage(blob)
```

`writeImage` 默认用 `blob.type` 作为 MIME，空 Blob 自动回退 `image/png`。

## 用户粘贴了一张截图

聊天框里用户 Ctrl+V 贴了张截图——用 `readImage` 拿到 Blob，预览或上传都行：

```ts
import { readImage } from '@bilibaba/ts-lab'

const blob = await readImage()
if (blob) {
  // 预览
  img.src = URL.createObjectURL(blob)
  // 或上传
  await upload(blob)
}
```

剪贴板里没有图片时 `readImage` 返回 `null`。
