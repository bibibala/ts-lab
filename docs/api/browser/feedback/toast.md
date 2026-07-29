# Toast

Toast 消息提示，支持六种预设类型和自定义配置。

## 预设类型

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

## 自定义 Toast

```ts
uiFeedback.toast({ message: '自定义', type: 'success', duration: 3000 })
// 字符串简写 → 等价于 info 类型
uiFeedback.toast('一行文本')
```
