<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { detectEnv } from '@bilibaba/ts-lab'
import type { EnvInfo } from '@bilibaba/ts-lab'

const env = ref<EnvInfo | null>(null)

const osLabel: Record<string, string> = {
  ios: '🍎 iOS',
  android: '🤖 Android',
  macos: '💻 macOS',
  windows: '🪟 Windows',
  linux: '🐧 Linux',
  unknown: '❓ 未知',
}

const archLabel: Record<string, string> = {
  arm64: 'ARM64 (Apple Silicon / Snapdragon X)',
  arm: 'ARM (32-bit, ARMv7+)',
  x64: 'x64 (Intel / AMD 64-bit)',
  x86: 'x86 (Intel 32-bit)',
  unknown: '未知架构',
}

onMounted(async () => {
  env.value = await detectEnv()
})
</script>

<template>
  <div>
    <p class="subtitle">
      通过 <code>detectEnv()</code> 识别操作系统、CPU 架构和运行时容器
    </p>

    <div v-if="env" class="result-grid">
      <div class="card">
        <h2>🖥️ 操作系统</h2>
        <div class="value">{{ osLabel[env.os] ?? env.os }}</div>
        <div class="meta">type: {{ env.os }}</div>
      </div>

      <div class="card">
        <h2>🔧 CPU 架构</h2>
        <div class="value">{{ archLabel[env.arch] ?? env.arch }}</div>
        <div class="meta">arch: {{ env.arch }}</div>
      </div>

      <div class="card">
        <h2>📦 运行时容器</h2>
        <div class="tags">
          <span :class="['tag', { on: env.isQQ }]">QQ</span>
          <span :class="['tag', { on: env.isWechat }]">微信</span>
          <span :class="['tag', { on: env.isInApp }]">App WebView</span>
          <span :class="['tag', { on: env.isBrowser }]">浏览器</span>
        </div>
      </div>

      <div class="card ua-card">
        <h2>📋 User-Agent</h2>
        <code class="ua">{{ env.ua }}</code>
      </div>
    </div>

    <div v-else class="loading">检测中…</div>
  </div>
</template>

<style scoped>
.subtitle {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}
.subtitle code {
  background: #e8e8e8;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px 20px;
}
.card h2 {
  font-size: 13px;
  color: #888;
  margin-bottom: 6px;
  font-weight: 500;
}

.value {
  font-size: 22px;
  font-weight: 600;
}
.meta {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
  font-family: monospace;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: #f0f0f0;
  color: #999;
  transition: background .15s, color .15s;
}
.tag.on {
  background: #1967d2;
  color: #fff;
}

.ua-card {
  word-break: break-all;
}
.ua {
  font-size: 12px;
  color: #555;
  line-height: 1.6;
}

.loading {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>
