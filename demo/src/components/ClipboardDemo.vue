<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  cutText,
  isClipboardApiSupported,
  isExecCommandSupported,
  isRichClipboardSupported,
  isSecureContext,
  onFilePaste,
  queryClipboardPermission,
  readText,
  revokePastedFilePreview,
  writeHtml,
  writeText,
} from '@bilibaba/ts-lab'
import type { ProcessedPastedFile } from '@bilibaba/ts-lab'

/* ========== 特性检测 ========== */
const features = ref<{ label: string, value: boolean | string }[]>([])

async function refreshFeatures() {
  features.value = [
    { label: 'Secure Context', value: isSecureContext() },
    { label: 'Clipboard API', value: isClipboardApiSupported() },
    { label: 'Rich Clipboard (ClipboardItem)', value: isRichClipboardSupported() },
    { label: 'execCommand', value: isExecCommandSupported() },
    { label: 'clipboard-read', value: await queryClipboardPermission('clipboard-read') },
    { label: 'clipboard-write', value: await queryClipboardPermission('clipboard-write') },
  ]
}

/* ========== 文本复制 ========== */
const copyText = ref('Hello from @bilibaba/ts-lab clipboard!')
const copyStatus = ref<'idle' | 'ok' | 'fail'>('idle')

async function handleCopy() {
  try {
    await writeText(copyText.value)
    copyStatus.value = 'ok'
    setTimeout(() => (copyStatus.value = 'idle'), 1500)
  } catch {
    copyStatus.value = 'fail'
    setTimeout(() => (copyStatus.value = 'idle'), 1500)
  }
}

/* ========== 文本粘贴 ========== */
const pastedText = ref('')
const pasteStatus = ref<'idle' | 'ok' | 'fail'>('idle')

async function handlePaste() {
  try {
    pastedText.value = await readText()
    pasteStatus.value = 'ok'
  } catch {
    pasteStatus.value = 'fail'
  }
}

/* ========== HTML 富文本 ========== */
const htmlResult = ref('')

async function handleCopyHtml() {
  try {
    await writeHtml('<b style="color:#1967d2">Bold & Blue</b> from ts-lab', 'Bold & Blue from ts-lab')
    htmlResult.value = '已复制！粘贴到支持富文本的地方（如邮件、Word、飞书）查看效果'
  } catch (e: unknown) {
    htmlResult.value = `复制失败：${e instanceof Error ? e.message : String(e)}`
  }
}

/* ========== 剪切 ========== */
const cutInput = ref('选中这段文字的一部分，然后点剪切按钮')
const cutStatus = ref<'idle' | 'ok' | 'fail'>('idle')

async function handleCut() {
  try {
    const el = document.getElementById('cut-input') as HTMLTextAreaElement
    if (!el) return
    await cutText(el.value.substring(el.selectionStart, el.selectionEnd) || el.value)
    cutStatus.value = 'ok'
    setTimeout(() => (cutStatus.value = 'idle'), 1500)
  } catch {
    cutStatus.value = 'fail'
    setTimeout(() => (cutStatus.value = 'idle'), 1500)
  }
}

/* ========== 文件粘贴 ========== */
const pastedFiles = ref<ProcessedPastedFile[]>([])
let unbindPaste: (() => void) | null = null

onMounted(() => {
  refreshFeatures()
  unbindPaste = onFilePaste((files) => {
    pastedFiles.value = [...pastedFiles.value, ...files]
  })
})

onUnmounted(() => {
  unbindPaste?.()
})

function removeFile(id: string) {
  const idx = pastedFiles.value.findIndex(f => f.id === id)
  if (idx === -1) return
  const [item] = pastedFiles.value.splice(idx, 1)
  if (item) revokePastedFilePreview(item)
}

function clearFiles() {
  for (const f of pastedFiles.value) {
    revokePastedFilePreview(f)
  }
  pastedFiles.value = []
}
</script>

<template>
  <div>
    <p class="subtitle">
      浏览器剪贴板能力封装：<code>writeText</code> · <code>readText</code> · <code>writeHtml</code> · <code>cutText</code> · <code>onFilePaste</code>
    </p>

    <!-- 特性检测 -->
    <div class="card">
      <h2>🔍 特性检测</h2>
      <div class="feature-grid">
        <div v-for="f in features" :key="f.label" class="feature-item">
          <span class="feat-label">{{ f.label }}</span>
          <span :class="['feat-value', String(f.value)]">
            {{ typeof f.value === 'boolean' ? (f.value ? '✅' : '❌') : f.value }}
          </span>
        </div>
      </div>
      <button class="btn-secondary" @click="refreshFeatures()">🔄 重新检测</button>
    </div>

    <!-- 文本复制 -->
    <div class="card">
      <h2>📋 文本复制 · writeText</h2>
      <textarea
        v-model="copyText"
        class="input"
        rows="2"
        placeholder="输入要复制的文本…"
      />
      <div class="btn-row">
        <button class="btn-primary" @click="handleCopy()">
          📋 复制到剪贴板
        </button>
        <span v-if="copyStatus === 'ok'" class="status-ok">✓ 已复制</span>
        <span v-if="copyStatus === 'fail'" class="status-fail">✕ 复制失败（可能需要安全上下文）</span>
      </div>
      <p class="hint">writeText 优先使用 Clipboard API，失败时自动降级为 execCommand('copy')</p>
    </div>

    <!-- 文本粘贴 -->
    <div class="card">
      <h2>📥 文本粘贴 · readText</h2>
      <div class="btn-row">
        <button class="btn-primary" @click="handlePaste()">📥 读取剪贴板文本</button>
        <span v-if="pasteStatus === 'ok'" class="status-ok">✓ 读取成功</span>
        <span v-if="pasteStatus === 'fail'" class="status-fail">✕ 读取失败（需 HTTPS + 用户授予剪贴板权限）</span>
      </div>
      <div v-if="pastedText" class="result-box">{{ pastedText }}</div>
    </div>

    <!-- HTML 富文本 -->
    <div class="card">
      <h2>🏷️ 富文本 · writeHtml</h2>
      <p class="hint">写入带格式的 HTML 到剪贴板，同时附带纯文本回退</p>
      <button class="btn-primary" @click="handleCopyHtml()">🏷️ 复制富文本</button>
      <div v-if="htmlResult" class="result-box">{{ htmlResult }}</div>
    </div>

    <!-- 剪切 -->
    <div class="card">
      <h2>✂️ 剪切 · cutText</h2>
      <p class="hint">选中下面输入框中的一部分文字，点击剪切按钮</p>
      <textarea
        id="cut-input"
        v-model="cutInput"
        class="input"
        rows="2"
      />
      <div class="btn-row">
        <button class="btn-primary" @click="handleCut()">✂️ 剪切选中内容</button>
        <span v-if="cutStatus === 'ok'" class="status-ok">✓ 已剪切</span>
        <span v-if="cutStatus === 'fail'" class="status-fail">✕ 剪切失败</span>
      </div>
    </div>

    <!-- 文件粘贴 -->
    <div class="card">
      <h2>🖼️ 文件粘贴 · onFilePaste</h2>
      <p class="hint">
        复制系统里的文件或截图后，在此区域按 <kbd>Ctrl+V</kbd> / <kbd>⌘V</kbd> 粘贴查看
      </p>
      <div class="paste-zone">
        <span v-if="pastedFiles.length === 0">📦 在此处粘贴文件或截图</span>
        <div v-else class="file-list">
          <div v-for="f in pastedFiles" :key="f.id" class="file-item">
            <img v-if="f.previewUrl" :src="f.previewUrl" class="file-thumb" alt="preview" />
            <span v-else class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">{{ f.name || '(未命名)' }}</span>
              <span class="file-meta">{{ f.mimeType }} · {{ f.formattedSize }}</span>
            </div>
            <button class="btn-remove" @click="removeFile(f.id)">✕</button>
          </div>
        </div>
      </div>
      <button v-if="pastedFiles.length > 0" class="btn-secondary" style="margin-top:12px" @click="clearFiles()">
        🗑 清空列表
      </button>
    </div>
  </div>
</template>

<style scoped>
.subtitle { color: #666; font-size: 13px; margin-bottom: 16px; }
.subtitle code { background: #f0f0f0; padding: 1px 5px; border-radius: 4px; font-size: 12px; }

.card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
h2 { font-size: 15px; margin-bottom: 12px; }
.hint { color: #888; font-size: 13px; margin-bottom: 12px; }
.hint kbd { background: #eee; padding: 1px 5px; border-radius: 3px; font-size: 11px; border: 1px solid #ccc; }

.input {
  width: 100%; padding: 10px 12px; border: 1px solid #d0d0d0; border-radius: 6px;
  font-size: 13px; font-family: inherit; resize: vertical; margin-bottom: 10px;
  background: #fafafa;
}
.input:focus { outline: none; border-color: #1967d2; }

.btn-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.btn-primary {
  padding: 9px 20px; border: none; border-radius: 6px;
  background: #1967d2; color: #fff; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: background .15s, transform .1s;
}
.btn-primary:hover { background: #1557b0; }
.btn-primary:active { transform: scale(.97); }

.btn-secondary {
  padding: 7px 14px; border: 1px solid #d0d0d0; border-radius: 6px;
  background: #fff; font-size: 12px; cursor: pointer;
  transition: background .15s;
}
.btn-secondary:hover { background: #f0f0f0; }

.status-ok { color: #168a50; font-size: 13px; font-weight: 500; }
.status-fail { color: #d93025; font-size: 13px; }

.result-box {
  margin-top: 10px; padding: 10px 12px; background: #f5f5f5;
  border-radius: 6px; font-size: 13px; color: #333; word-break: break-all;
}

/* 特性检测 */
.feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 12px; }
.feature-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.feat-label { font-size: 13px; color: #555; }
.feat-value { font-size: 13px; font-weight: 500; }
.feat-value.true { color: #168a50; }
.feat-value.false { color: #999; }
.feat-value.granted { color: #168a50; }
.feat-value.prompt { color: #e37400; }
.feat-value.denied { color: #d93025; }
.feat-value.unknown { color: #999; }

/* 文件粘贴区 */
.paste-zone {
  min-height: 120px; border: 2px dashed #d0d0d0; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #999; font-size: 14px; transition: border-color .15s;
}
.paste-zone:hover { border-color: #1967d2; }

.file-list { width: 100%; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.file-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: #f9f9f9; border-radius: 6px; }
.file-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; }
.file-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: 28px; background: #eee; border-radius: 4px; }
.file-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.file-name { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-meta { font-size: 11px; color: #888; }
.btn-remove { width: 24px; height: 24px; border: none; border-radius: 50%; background: #f0f0f0; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #999; transition: background .15s, color .15s; flex-shrink: 0; }
.btn-remove:hover { background: #d93025; color: #fff; }
</style>
