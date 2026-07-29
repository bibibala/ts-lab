<script setup lang="ts">
import { ref } from 'vue'
import JSZip from 'jszip'
import { getIco, getIcns, getImageBoth, getPngs, initModule } from '@bilibaba/ts-lab'

interface ResultItem {
  name: string
  size: number
  type: string
  data: Uint8Array
}

const step = ref<'upload' | 'loading' | 'ready' | 'busy'>('upload')
const message = ref('')
const previewUrl = ref('')
const imageBuf = ref<Uint8Array | null>(null)
const results = ref<ResultItem[]>([])

let moduleReady = false

async function ensureModule() {
  if (moduleReady) return
  moduleReady = true
  await initModule()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  loadImage(file)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  loadImage(file)
}

async function loadImage(file: File) {
  previewUrl.value = URL.createObjectURL(file)
  imageBuf.value = new Uint8Array(await file.arrayBuffer())
  results.value = []
  step.value = 'loading'
  message.value = '正在初始化 WASM…'

  try {
    await ensureModule()
  } catch (e) {
    message.value = `初始化失败：${e instanceof Error ? e.message : String(e)}`
    step.value = 'upload'
    return
  }

  message.value = ''
  step.value = 'ready'
}

function addResult(name: string, data: Uint8Array) {
  results.value.push({ name, size: data.byteLength, type: getType(name), data })
}

function getType(name: string) {
  if (name.endsWith('.ico')) return 'ICO'
  if (name.endsWith('.icns')) return 'ICNS'
  return 'PNG'
}

function downloadItem(item: ResultItem) {
  const blob = new Blob([item.data as BlobPart])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = item.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function run(action: () => Promise<void>, label: string) {
  if (!imageBuf.value) return
  step.value = 'busy'
  message.value = `正在转换 ${label}…`
  try {
    await action()
    message.value = `${label} 完成`
  } catch (e) {
    message.value = `转换失败：${e instanceof Error ? e.message : String(e)}`
  } finally {
    step.value = 'ready'
  }
}

async function handleGetIco() {
  await run(async () => {
    addResult('favicon.ico', await getIco(imageBuf.value!))
  }, 'ICO')
}

async function handleGetIcns() {
  await run(async () => {
    addResult('favicon.icns', await getIcns(imageBuf.value!))
  }, 'ICNS')
}

async function handleGetPngs() {
  await run(async () => {
    const pngs = await getPngs(imageBuf.value!)
    for (const [size, data] of Object.entries(pngs)) {
      addResult(`icon_${size}x${size}.png`, data)
    }
  }, '多尺寸 PNG')
}

async function handleGetBoth() {
  await run(async () => {
    const both = await getImageBoth(imageBuf.value!)
    const zip = new JSZip()
    zip.file('favicon.ico', both.ico)
    zip.file('favicon.icns', both.icns)
    for (const [size, data] of Object.entries(both.pngs)) {
      zip.file(`icon_${size}x${size}.png`, data)
    }
    const zipData = await zip.generateAsync({ type: 'uint8array' })
    addResult('icons.zip', zipData)
  }, 'ICO + ICNS + PNG')
}
</script>

<template>
  <div class="icon-demo">
    <h2>🖼️ 图片转图标</h2>
    <p class="desc">上传一张 PNG，然后选择要转换的格式，点击文件可下载</p>

    <label
      class="drop-zone"
      @drop.prevent="onDrop"
      @dragover.prevent="(e: DragEvent) => e.preventDefault()"
    >
      <input type="file" accept="image/png" @change="onFileChange" hidden>
      <template v-if="!previewUrl">
        <span class="drop-icon">📁</span>
        <span>点击选择 PNG 或拖拽</span>
      </template>
      <img v-else :src="previewUrl" class="preview" alt="预览">
    </label>

    <div v-if="step === 'loading'" class="msg-loading">⏳ {{ message }}</div>

    <div v-if="step === 'ready' || step === 'busy'" class="actions">
      <button :disabled="step === 'busy'" @click="handleGetIco">ICO</button>
      <button :disabled="step === 'busy'" @click="handleGetIcns">ICNS</button>
      <button :disabled="step === 'busy'" @click="handleGetPngs">多尺寸 PNG</button>
      <button :disabled="step === 'busy'" @click="handleGetBoth">全部 (.zip)</button>
    </div>

    <div v-if="message && step === 'busy'" class="msg-busy">{{ message }}</div>

    <ul v-if="results.length" class="file-list">
      <li v-for="f in results" :key="f.name" @click="downloadItem(f)">
        <span class="file-type">{{ f.type }}</span>
        <span class="file-name">{{ f.name }}</span>
        <span class="file-size">{{ (f.size / 1024).toFixed(1) }} KB</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.icon-demo {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 24px;
}
h2 { font-size: 16px; margin-bottom: 4px; }
.desc { font-size: 13px; color: #888; margin-bottom: 16px; }

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 140px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color .15s;
  overflow: hidden;
}
.drop-zone:hover { border-color: #1967d2; }
.drop-icon { font-size: 28px; }

.preview {
  max-width: 100%;
  max-height: 136px;
  object-fit: contain;
}

.msg-loading {
  margin-top: 12px;
  font-size: 13px;
  color: #1967d2;
  background: #e8f0fe;
  padding: 8px 12px;
  border-radius: 6px;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.actions button {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  background: #1967d2;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity .15s;
}
.actions button:disabled { opacity: .5; cursor: not-allowed; }
.actions button:not(:disabled):hover { opacity: .85; }

.msg-busy {
  margin-top: 10px;
  font-size: 13px;
  color: #1967d2;
  background: #e8f0fe;
  padding: 6px 12px;
  border-radius: 6px;
}

.file-list {
  margin-top: 12px;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.file-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background .15s;
}
.file-list li:hover { background: #e8e8e8; }
.file-type {
  background: #1967d2;
  color: #fff;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
  font-size: 11px;
}
.file-name { font-weight: 500; }
.file-size { color: #999; }
</style>
