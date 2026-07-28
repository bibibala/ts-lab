# Feedback · 提示反馈

单例 Toast + Loading 工具。自行管理 DOM 和样式，**零 UI 框架依赖**。

## uiFeedback

全局单例，直接调用：

```ts
import { uiFeedback } from '@bilibaba/ts-lab'
```

## Toast

### 预设类型

```ts
uiFeedback.success('保存成功!')
uiFeedback.error('操作失败')
uiFeedback.warning('请检查输入')
uiFeedback.info('提示信息')

// 自定义显示时长 (ms) 和位置
uiFeedback.success('3 秒后消失', 3000)
uiFeedback.error('底部提示', 2000, 'bottom')
```

六个位置可选：`'top'`（默认）、`'bottom'`、`'top-left'`、`'top-right'`、`'bottom-left'`、`'bottom-right'`、`'center'`。

### 自定义 Toast

```ts
uiFeedback.toast({ message: '自定义', type: 'success', duration: 3000 })
// 字符串简写 → 等价于 info 类型
uiFeedback.toast('一行文本')
```

## Loading

全屏遮罩，**支持嵌套调用**——内部维护计数器，确保多层调用正确匹配。

```ts
uiFeedback.showLoading('加载中...')
await someAsyncTask()
uiFeedback.hideLoading()
```

嵌套场景：

```ts
async function fetchA() {
  uiFeedback.showLoading('加载 A...')
  await delay(1000)
  uiFeedback.hideLoading() // 计数器未归零，不会关闭
}

async function fetchB() {
  uiFeedback.showLoading('加载 B...')
  await delay(2000)
  uiFeedback.hideLoading() // 计数器归零，真正关闭
}

await Promise.all([fetchA(), fetchB()])
```

### force 参数

```ts
uiFeedback.hideLoading(true) // 强制关闭，重置计数器
```
