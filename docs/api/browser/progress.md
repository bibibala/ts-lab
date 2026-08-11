<script setup>
import { ref, onMounted } from 'vue'

const progress = ref(null)
const running = ref(false)
const mode = ref('默认')

onMounted(async () => {
  const mod = await import('@bilibaba/ts-lab')
  progress.value = mod.progress
})

function show(m, color) {
  mode.value = m
  running.value = true
  progress.value?.configure({ color })
  progress.value?.start()
  const delay = 1500 + Math.random() * 2000
  setTimeout(() => { running.value = false; progress.value?.done() }, delay)
}
</script>

<style>
.progress-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}
.progress-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: #fff;
}
.progress-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
.progress-hint { font-size: 12px; color: var(--vp-c-text-2); margin-left: 4px; }
</style>

<ClientOnly>
  <div class="progress-demo">
    <button v-if="progress" class="progress-btn" style="background:#29d" :disabled="running" @click="show('默认', '#29d')">默认蓝</button>
    <button v-if="progress" class="progress-btn" style="background:linear-gradient(to right,#f00,#f0f)" :disabled="running" @click="show('彩虹', ['#f00','#ff0','#0f0','#0ff','#00f','#f0f'])">彩虹</button>
    <button v-if="progress" class="progress-btn" style="background:linear-gradient(to right,#f97316,#ef4444)" :disabled="running" @click="show('火焰', ['#f97316','#ef4444','#dc2626'])">火焰</button>
    <button v-if="progress" class="progress-btn" style="background:linear-gradient(to right,#667eea,#764ba2)" :disabled="running" @click="show('紫霞', ['#667eea','#764ba2'])">紫霞</button>
    <span v-if="running" class="progress-hint">{{ mode }} 加载中...</span>
  </div>
</ClientOnly>

---

# Progress · 顶部进度条

NProgress 风格的页面顶部进度条。零 UI 框架依赖，自行管理 DOM 和样式。

## progress

全局单例，直接调用：

```ts
import { progress } from '@bilibaba/ts-lab'
```

## start

开始显示进度条并启动自动增长（trickle）。

```ts
progress.start()
```

进度条会自动以小幅随机增量前进，模拟加载过程。

## done

完成进度并隐藏进度条。进度条会在过渡动画完成后自动消失。

```ts
progress.done()
```

## set

手动设置进度百分比（0–100）。

```ts
progress.set(40)  // 设置为 40%
progress.set(80)  // 设置为 80%
```

## inc

手动递增进度，不传参数则使用随机小增量（0.5–3%）。

```ts
progress.start()    // 开始 + 自动 trickle
progress.inc(10)    // 手动推 10%
progress.inc()      // 随机增量
progress.done()     // 完成
```

## configure

运行时更新配置，下次 `start()` 生效。

```ts
// 单色
progress.configure({ color: '#e91e63' })

// 双色渐变 — 从左到右逐渐加深
progress.configure({ color: ['#667eea', '#764ba2'] })

// 多彩渐变 — 五颜六色
progress.configure({ color: ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f'] })
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `color` | `string \| string[]` | `'#29d'` | 进度条颜色。`string` 为纯色，`string[]` 为从左到右渐变 |
| `height` | `number` | `3` | 高度 (px) |
| `speed` | `number` | `200` | CSS 过渡速度 (ms) |
| `trickle` | `boolean` | `true` | 是否自动增长 |
| `trickleSpeed` | `number` | `200` | 自动增长间隔 (ms) |
| `minimum` | `number` | `0.08` | 起始百分比 (0–1) |
| `easing` | `string` | `'ease'` | CSS 缓动函数 |

## 典型用法

```ts
import { progress } from '@bilibaba/ts-lab'

// 路由切换 — 默认蓝色
progress.start()
// ... 异步加载
progress.done()

// 加载前配置渐变色 — 火焰风格
progress.configure({ color: ['#f97316', '#ef4444', '#dc2626'] })
progress.start()
// ... 完成后
progress.done()
```
