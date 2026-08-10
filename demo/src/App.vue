<script setup lang="ts">
import { ref } from 'vue'
import ClipboardDemo from './components/ClipboardDemo.vue'
import EnvDemo from './components/EnvDemo.vue'
import FeedbackDemo from './components/FeedbackDemo.vue'
import IconDemo from './components/IconDemo.vue'
import InvoiceDemo from './components/InvoiceDemo.vue'

const activeTab = ref<'invoice' | 'feedback' | 'clipboard' | 'icon' | 'env'>('clipboard')
</script>

<template>
  <div class="app">
    <h1>@bilibaba/ts-lab · Demo</h1>

    <nav class="tabs">
      <button
        :class="['tab', { active: activeTab === 'invoice' }]"
        @click="activeTab = 'invoice'"
      >
        🧾 WebMCP · 发票管理
      </button>
      <button
        :class="['tab', { active: activeTab === 'feedback' }]"
        @click="activeTab = 'feedback'"
      >
        🔔 Feedback · Toast &amp; Loading
      </button>
      <button
        :class="['tab', { active: activeTab === 'clipboard' }]"
        @click="activeTab = 'clipboard'"
      >
        📋 Clipboard
      </button>
      <button
        :class="['tab', { active: activeTab === 'icon' }]"
        @click="activeTab = 'icon'"
      >
        🖼️ 图片转图标
      </button>
      <button
        :class="['tab', { active: activeTab === 'env' }]"
        @click="activeTab = 'env'"
      >
        🌐 环境检测
      </button>
    </nav>

    <InvoiceDemo v-if="activeTab === 'invoice'" />
    <FeedbackDemo v-if="activeTab === 'feedback'" />
    <ClipboardDemo v-if="activeTab === 'clipboard'" />
    <IconDemo v-if="activeTab === 'icon'" />
    <EnvDemo v-if="activeTab === 'env'" />
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, "Segoe UI", sans-serif; background: #f5f5f5; color: #222; }
.app { max-width: 780px; margin: 0 auto; padding: 24px 20px 60px; }
h1 { font-size: 20px; margin-bottom: 16px; }

.tabs {
  display: flex; gap: 0; margin-bottom: 20px;
  border: 1px solid #d0d0d0; border-radius: 8px; overflow: hidden;
}
.tab {
  flex: 1; padding: 10px 16px; border: none; border-radius: 0;
  background: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
  color: #666; transition: background .15s, color .15s;
}
.tab:not(:last-child) { border-right: 1px solid #d0d0d0; }
.tab.active { background: #1967d2; color: #fff; }
.tab:not(.active):hover { background: #f0f0f0; }
</style>
