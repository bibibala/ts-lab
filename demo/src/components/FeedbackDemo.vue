<script setup lang="ts">
import { ref } from 'vue'
import { uiFeedback } from '@bilibaba/ts-lab'
import type { ToastPosition } from '@bilibaba/ts-lab'

const positions: { label: string, value: ToastPosition }[] = [
  { label: '⬆️ Top', value: 'top' },
  { label: '⬇️ Bottom', value: 'bottom' },
  { label: '↖️ Top Left', value: 'top-left' },
  { label: '↗️ Top Right', value: 'top-right' },
  { label: '↙️ Bottom Left', value: 'bottom-left' },
  { label: '↘️ Bottom Right', value: 'bottom-right' },
  { label: '🎯 Center', value: 'center' },
]

const selectedPosition = ref<ToastPosition>('top')

function showToast(type: 'success' | 'error' | 'warning' | 'info') {
  const messages: Record<typeof type, string> = {
    success: '操作成功！',
    error: '操作失败，请重试',
    warning: '请注意检查输入内容',
    info: '这是一条提示信息',
  }
  uiFeedback.toast({ message: messages[type], type, position: selectedPosition.value })
}

function triggerLoading() {
  uiFeedback.showLoading('正在处理中，请稍候…')
  setTimeout(() => {
    uiFeedback.hideLoading()
  }, 2500)
}
</script>

<template>
  <div>
    <p class="subtitle">
      零依赖 UI 反馈组件：<code>uiFeedback</code> — Toast 提示 + 全局 Loading 遮罩
    </p>

    <!-- Position Picker -->
    <div class="card">
      <h2>📍 Toast 位置</h2>
      <div class="pos-row">
        <button
          v-for="p in positions"
          :key="p.value"
          :class="['btn-pos', { active: selectedPosition === p.value }]"
          @click="selectedPosition = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Toast Demos -->
    <div class="card">
      <h2>🔔 Toast 类型</h2>
      <p class="hint">选中上方位置后点击按钮查看效果</p>
      <div class="btn-row">
        <button class="btn-toast btn-success" @click="showToast('success')">✓ Success</button>
        <button class="btn-toast btn-error" @click="showToast('error')">✕ Error</button>
        <button class="btn-toast btn-warning" @click="showToast('warning')">! Warning</button>
        <button class="btn-toast btn-info" @click="showToast('info')">i Info</button>
      </div>
    </div>

    <!-- Loading Demo -->
    <div class="card">
      <h2>🔄 全局 Loading</h2>
      <p class="hint">全屏遮罩 + 毛玻璃背景 + 加载动画，2.5 秒后自动关闭</p>
      <button class="btn-loading" @click="triggerLoading()">🔄 Show Loading (2.5s)</button>
    </div>
  </div>
</template>

<style scoped>
.subtitle { color: #666; font-size: 13px; margin-bottom: 16px; }
.subtitle code { background: #f0f0f0; padding: 1px 5px; border-radius: 4px; font-size: 12px; }

.card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
h2 { font-size: 15px; margin-bottom: 12px; }
.hint { color: #888; font-size: 13px; margin-bottom: 12px; }

.pos-row { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-pos {
  padding: 6px 14px; border: 1px solid #d0d0d0; border-radius: 6px;
  background: #fff; font-size: 12px; cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn-pos.active { background: #1967d2; color: #fff; border-color: #1967d2; }
.btn-pos:not(.active):hover { background: #f0f0f0; }

.btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-toast {
  padding: 9px 20px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: #fff; transition: background .15s, transform .1s;
}
.btn-toast:active { transform: scale(.97); }
.btn-success { background: #168a50; }
.btn-success:hover { background: #0f6e3e; }
.btn-error { background: #d93025; }
.btn-error:hover { background: #b3261e; }
.btn-warning { background: #e37400; }
.btn-warning:hover { background: #c05d00; }
.btn-info { background: #323233; }
.btn-info:hover { background: #1e1e1f; }

.btn-loading {
  padding: 10px 20px; border: 2px dashed #1967d2; border-radius: 6px;
  background: #e8f0fe; color: #1967d2; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: background .15s, transform .1s;
}
.btn-loading:hover { background: #d2e3fc; }
.btn-loading:active { transform: scale(.97); }
</style>
