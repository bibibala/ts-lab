<script setup>
import { onMounted, ref } from 'vue'

const loadingMod = ref(null)
const isLoading = ref(false)
const selectedSpinner = ref('spin')
const selectedSize = ref(40)

const spinnerOptions = [
  { value: 'spin', label: 'spin (默认)' },
  { value: 'pulse', label: 'pulse (脉冲)' },
  { value: 'wave', label: 'wave (波浪)' },
  { value: 'dots', label: 'dots (闪烁点)' },
  { value: 'dual-ring', label: 'dual-ring (双圈)' },
]

const sizeOptions = [
  { value: 24, label: '24px' },
  { value: 32, label: '32px' },
  { value: 40, label: '40px (默认)' },
  { value: 56, label: '56px' },
  { value: 72, label: '72px' },
]

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab/ui')
  loadingMod.value = mod.loading
})

function trigger() {
  isLoading.value = true
  loadingMod.value?.show('加载中…', { spinner: selectedSpinner.value, size: selectedSize.value })
  setTimeout(() => {
    loadingMod.value?.hide()
    isLoading.value = false
  }, 2000)
}
</script>

<style>
.load-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  gap: 12px;
}
.load-btn {
  padding: 8px 20px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
.load-select {
  padding: 8px 12px; border: 1px solid var(--vp-c-divider); border-radius: 6px;
  font-size: 13px; background: var(--vp-c-bg); color: var(--vp-c-text-1);
}
</style>

<ClientOnly>
  <div class="load-demo">
    <select v-if="loadingMod" v-model="selectedSpinner" class="load-select">
      <option v-for="opt in spinnerOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <select v-if="loadingMod" v-model="selectedSize" class="load-select">
      <option v-for="opt in sizeOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <button v-if="loadingMod" class="load-btn" :disabled="isLoading" @click="trigger">
      {{ isLoading ? '加载中…' : '显示 Loading (2s)' }}
    </button>
  </div>
</ClientOnly>

---

# Loading

全屏 Loading 遮罩，**支持嵌套调用**——内部维护计数器，确保多层调用正确匹配。

## 基本用法

```ts
import { loading } from '@bilibaba/ts-lab/ui'

loading.show('加载中...')
await someAsyncTask()
loading.hide()
```

## 嵌套场景

```ts
async function fetchA() {
  loading.show('加载 A...')
  await delay(1000)
  loading.hide() // 计数器未归零，不会关闭
}

async function fetchB() {
  loading.show('加载 B...')
  await delay(2000)
  loading.hide() // 计数器归零，真正关闭
}

await Promise.all([fetchA(), fetchB()])
```

## force 参数

```ts
loading.hide(true) // 强制关闭，重置计数器
```

## Spinner 类型

支持 5 种 loading 动画样式：

| 类型 | 说明 | 效果 |
|------|------|------|
| `spin` | 旋转圆环（默认） | 经典旋转动画 |
| `pulse` | 脉冲 | 大小和透明度变化 |
| `wave` | 波浪 | 三个点依次上下移动 |
| `dots` | 闪烁点 | 三个点依次闪烁 |
| `dual-ring` | 双圈 | 两个同心圆以不同速度旋转 |

### 使用示例

```ts
// 默认旋转动画
loading.show('加载中...')

// 脉冲动画
loading.show('加载中...', { spinner: 'pulse' })

// 波浪动画
loading.show('加载中...', { spinner: 'wave' })

// 闪烁点动画
loading.show('加载中...', { spinner: 'dots' })

// 双圈动画
loading.show('加载中...', { spinner: 'dual-ring' })

// 自定义大小（像素）
loading.show('加载中...', { size: 60 })

// 组合使用
loading.show('加载中...', { spinner: 'pulse', size: 48 })
```

### 动画效果描述

| 样式 | 动画描述 |
|------|----------|
| spin | 经典旋转，0.7秒一圈 |
| pulse | 0.8-1.2倍缩放，透明度0.5-1 |
| wave | 三个点依次上下移动，间隔0.1秒 |
| dots | 三个点依次闪烁，间隔0.2秒 |
| dual-ring | 外圈1.2秒，内圈1.8秒反向旋转 |
