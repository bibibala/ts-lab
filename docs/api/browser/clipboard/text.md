# 文本读写

纯文本的复制和粘贴，最常用的两个操作。

## writeText

写入纯文本到剪贴板。优先使用 Clipboard API，失败或不支持时自动降级为 `execCommand('copy')`。

```ts
import { writeText } from '@bilibaba/ts-lab'

await writeText('Hello, world!')
```

即使在不支持 Clipboard API 的旧浏览器中也能正常工作——内部会创建一个隐藏的 `<textarea>`，选中后执行 `execCommand('copy')`。

## readText

从剪贴板读取纯文本。仅支持 Clipboard API，需要用户授予剪贴板读取权限。

```ts
import { readText } from '@bilibaba/ts-lab'

const text = await readText()
console.log(text) // 'Hello, world!'
```

::: warning
`readText` 没有 `execCommand` 降级方案。在不支持 Clipboard API 的环境下会抛出 `NOT_SUPPORTED`。
:::
