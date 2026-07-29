# Loading

全屏 Loading 遮罩，**支持嵌套调用**——内部维护计数器，确保多层调用正确匹配。

## 基本用法

```ts
uiFeedback.showLoading('加载中...')
await someAsyncTask()
uiFeedback.hideLoading()
```

## 嵌套场景

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

## force 参数

```ts
uiFeedback.hideLoading(true) // 强制关闭，重置计数器
```
