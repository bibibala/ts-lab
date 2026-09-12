<script setup>
import { ref } from 'vue'
import { copyHtmlToBoard, pasteAllFromBoard } from '@bilibaba/ts-lab/browser'

const htmlText = ref('')
const plainText = ref('')
const result = ref('')

async function copyRich() {
  await copyHtmlToBoard(
    `<p style="color:#1967d2;font-size:16px"><b>${htmlText.value || '一条富文本'}</b></p>`,
    plainText.value || htmlText.value || '纯文本回退内容',
  )
}
async function read() {
  const items = await pasteAllFromBoard()
  result.value = items.map(i => `${i.type} (${(i.blob.size / 1024).toFixed(1)} KB)`).join(', ')
}
</script>

<style>
.rich-demo {
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  padding: 16px 20px; margin: 16px 0 24px; background: var(--vp-c-bg-soft);
  display: flex; flex-direction: column; gap: 8px;
}
.rich-demo input {
  padding: 6px 10px; border: 1px solid var(--vp-c-divider);
  border-radius: 6px; font-size: 13px;
}
.rich-row { display: flex; gap: 8px; }
.rich-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
.rich-info { font-size: 12px; color: var(--vp-c-text-3); }
</style>

<ClientOnly>
  <div class="rich-demo">
    <input v-model="htmlText" placeholder="HTML 内容（粘贴到飞书/邮件看效果）" />
    <input v-model="plainText" placeholder="纯文本回退（可选）" />
    <div class="rich-row">
      <button class="rich-btn" @click="copyRich">复制到剪贴板</button>
      <button class="rich-btn" @click="read">读取剪贴板</button>
    </div>
    <div v-if="result" class="rich-info">📋 剪贴板内容：{{ result }}</div>
    <div class="rich-info">⚠️ 粘贴到飞书 / 邮件 / 文档看格式效果；需要浏览器支持 ClipboardItem</div>
  </div>
</ClientOnly>

---

# HTML 与图片

文本之外的内容，先把话说明白：**网页只能往系统剪贴板写文本和图片两类数据**，这是浏览器安全策略，无法绕过。所以下面的功能全部基于 `ClipboardItem`（`isRichSupported()` 返回 `true` 才可用）。

## 复制带格式内容到邮件 / 飞书

用户点一下「分享报价单」，HTML 表格进剪贴板：粘到邮件/飞书保留格式，粘到纯文本输入框自动降为文字。用 `copyHtmlToBoard`，一次写入 HTML + 纯文本两份数据：

```ts
import { copyHtmlToBoard } from '@bilibaba/ts-lab/browser'

await copyHtmlToBoard(
  `<table><tr><th>Q1</th><th>Q2</th></tr><tr><td>¥12,000</td><td>¥18,500</td></tr></table>`,
  'Q1: ¥12,000  Q2: ¥18,500', // 纯文本回退
)
```

想自己控制写入哪些格式（比如再加一份 `text/csv`），用底层 `copyItemsToBoard`：

```ts
import { copyItemsToBoard } from '@bilibaba/ts-lab/browser'

await copyItemsToBoard([
  { type: 'text/html', data: '<table>...</table>' },
  { type: 'text/csv',  data: 'Q1,12\nQ2,18' },
  { type: 'text/plain', data: 'Q1: 12  Q2: 18' },
])
```

反向同理——`pasteAllFromBoard` 把剪贴板里的所有格式一次拿回来：

```ts
import { pasteAllFromBoard } from '@bilibaba/ts-lab/browser'

const items = await pasteAllFromBoard()
// items[0] — { type: 'text/plain', blob: ... }
// items[1] — { type: 'text/html',  blob: ... }
```

## 复制 canvas 图表，一键粘贴进 PPT

做个 canvas 统计图，想直接 Ctrl+V 贴到飞书/PPT，不用先下载再插入。`copyImageToBoard` 把 Blob 写进剪贴板：

```ts
import { copyImageToBoard } from '@bilibaba/ts-lab/browser'

// canvas 导出 → 直接进剪贴板
canvas.toBlob(async (blob) => {
  if (blob) await copyImageToBoard(blob)
}, 'image/png')

// 或网络图片直接复制
const blob = await fetch('/qrcode.png').then(r => r.blob())
await copyImageToBoard(blob)
```

`copyImageToBoard` 默认用 `blob.type` 作为 MIME，空 Blob 自动回退 `image/png`。

## 用户粘贴了一张截图

聊天框里用户 Ctrl+V 贴了张截图——`pasteImageFromBoard` 拿到 Blob，预览或上传都行：

```ts
import { pasteImageFromBoard } from '@bilibaba/ts-lab/browser'

const blob = await pasteImageFromBoard()
if (blob) {
  img.src = URL.createObjectURL(blob) // 预览
  await upload(blob)                   // 或上传
}
```

剪贴板里没有图片时返回 `null`。