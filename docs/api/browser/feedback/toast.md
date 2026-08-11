<script setup>
import { onMounted, ref } from 'vue'

const uiFeedback = ref(null)

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab')
  uiFeedback.value = mod.uiFeedback
})
</script>

<style>
.toast-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
  display: flex; gap: 8px; flex-wrap: wrap;
}
.toast-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: #fff;
}
.toast-btn.s { background: #22c55e; }
.toast-btn.e { background: #ef4444; }
.toast-btn.w { background: #f59e0b; }
.toast-btn.i { background: #3b82f6; }
</style>

<ClientOnly>
  <div class="toast-demo">
    <button v-if="uiFeedback" class="toast-btn s" @click="uiFeedback.success('操作成功')">Success</button>
    <button v-if="uiFeedback" class="toast-btn e" @click="uiFeedback.error('操作失败')">Error</button>
    <button v-if="uiFeedback" class="toast-btn w" @click="uiFeedback.warning('请注意')">Warning</button>
    <button v-if="uiFeedback" class="toast-btn i" @click="uiFeedback.info('提示信息')">Info</button>
  </div>
</ClientOnly>

---

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
