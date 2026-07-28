# Clipboard · 剪贴板

将 Base64 编码的图片写入剪贴板。

## writeImgToClipboard

```ts
function writeImgToClipboard(src: string): Promise<void>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `src` | `string` | Base64 图片数据，格式 `data:image/png;base64,...` |

**支持的格式：** `png` / `jpeg` / `jpg` / `gif`

```ts
import { writeImgToClipboard } from '@bilibaba/ts-lab'

await writeImgToClipboard('data:image/png;base64,iVBORw0KGgo...')
```

## 降级策略

当浏览器不支持 [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write)（非 HTTPS 或旧版浏览器）时，自动降级为**下载文件**。
