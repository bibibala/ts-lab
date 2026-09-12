<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const files = ref([])
let unbind = null

onMounted(async () => {
  const { onPasteFiles } = await import('@bilibaba/ts-lab/browser')
  unbind = onPasteFiles((items) => {
    files.value = items.map(f => ({
      name: f.name,
      size: f.formattedSize,
      type: f.mimeType,
      isImg: f.isImage,
      preview: f.previewUrl,
    }))
  })
})
onUnmounted(() => { unbind?.() })
</script>

<style>
.file-demo {
  border: 2px dashed var(--vp-c-divider);
  border-radius: 8px; padding: 40px 20px; text-align: center;
  margin: 16px 0 24px; background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3); font-size: 14px;
}
.file-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; justify-content: center; }
.file-card {
  background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider);
  border-radius: 6px; padding: 8px 12px; font-size: 12px; max-width: 200px;
}
.file-card img { max-width: 100%; max-height: 100px; border-radius: 4px; margin-bottom: 4px; }
</style>

<ClientOnly>
  <div class="file-demo">
    <div>📁 在文件管理器中复制文件，回到此页面按 Ctrl+V 粘贴</div>
    <div v-if="files.length" class="file-list">
      <div v-for="(f, i) in files" :key="i" class="file-card">
        <img v-if="f.isImg && f.preview" :src="f.preview" />
        <div>{{ f.name }}</div>
        <div style="color:var(--vp-c-text-3)">{{ f.size }} · {{ f.type }}</div>
      </div>
    </div>
  </div>
</ClientOnly>

---

# 文件粘贴 · 剪切 · 事件

## 文件粘贴

::: warning 安全限制
浏览器不允许网页 JS 主动把任意文件写入系统剪贴板，只支持 `text/plain`、`text/html`、`image/png`，所以「写文件」最多只能写图片，拿文件主要靠监听用户粘贴。
:::

### 监听文件粘贴 onPasteFiles

聊天/上传场景的核心：用户在文件管理器里选了图和一个 PDF，回到页面 Ctrl+V，回调一次性拿到**全部**文件，图片文档混着也没问题，`isImage` 标记帮你区分：

```ts
import { onPasteFiles } from '@bilibaba/ts-lab/browser'
import type { PreparedFile } from '@bilibaba/ts-lab/browser'

const unbind = onPasteFiles((files: PreparedFile[]) => {
  for (const f of files) {
    console.log(f.name)           // 'photo.jpg' | 'report.pdf' | ...
    console.log(f.formattedSize)  // '2.1 MB'
    console.log(f.isImage)        // true | false

    if (f.previewUrl) {
      // 图片有预览 URL，直接 <img :src="f.previewUrl" />
    }
    f.dispose() // 用完释放预览 URL，防内存泄漏
  }
})

unbind() // 组件卸载时解绑
```

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `processed` | `true` | 是否预处理（生成 id、previewUrl、dispose），`false` 则回调收到原始 `File[]` |
| `preventDefault` | `true` | 是否阻止浏览器默认粘贴行为 |

```ts
// 需要原始 File[]（比如直接交给 FormData 上传）
onPasteFiles((files: File[]) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  await upload(form)
}, { processed: false })
```

### 复制图片文件 copyFileToBoard

只能写图片类文件，其它类型抛 `UNSUPPORTED_MIME_TYPE`：

```ts
import { copyFileToBoard } from '@bilibaba/ts-lab/browser'

const file = new File(['...'], 'photo.png', { type: 'image/png' })
await copyFileToBoard(file)
```

### prepareFiles / formatFileSize

需要手动把 `File[]` 变成结构化的 `PreparedFile[]`（带预览和 `dispose()`）时使用；`formatFileSize` 单独格式化字节数：

```ts
import { formatFileSize, prepareFiles } from '@bilibaba/ts-lab/browser'

const prepared = prepareFiles(rawFiles)
prepared[0].previewUrl  // 图片直接当 <img src> 用
prepared[0].dispose()   // 用完释放

formatFileSize(2 * 1024 * 1024) // '2.0 MB'
```

## 从输入框剪切

`cutFromInput` 把 `input` / `textarea` 里选中的文字复制到剪贴板并从输入框移除，返回被剪切的内容：

```ts
import { cutFromInput } from '@bilibaba/ts-lab/browser'

const el = document.querySelector('textarea')!
const selected = await cutFromInput(el)
console.log(selected) // 被剪切的内容，同时已从输入框删除
```

## 事件监听

监听底层 `copy` / `cut` / `paste` 事件，返回取消监听函数：

```ts
import { onCopy, onCut, onPaste } from '@bilibaba/ts-lab/browser'

const unbind = onPaste((payload) => {
  console.log(payload.text)   // clipboardData 中的纯文本
  console.log(payload.html)   // clipboardData 中的 HTML（仅 paste 常见）
  console.log(payload.files)  // 文件列表（仅 paste 常见）
  console.log(payload.originalEvent) // 原生 ClipboardEvent
})

unbind()
```

第二个参数可指定监听目标（默认 `document`）：

```ts
onCopy(handler, myElement)
```