<script setup>
import { onMounted, ref } from 'vue'
import { getNetworkInfo } from '@bilibaba/ts-lab'

const info = ref(null)

onMounted(() => { info.value = getNetworkInfo() })
</script>

<style>
.net-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 20px;
  margin: 16px 0 24px;
  background: var(--vp-c-bg-soft);
  display: flex; gap: 24px; flex-wrap: wrap; align-items: center;
}
.net-item { display: flex; flex-direction: column; }
.net-item .label { font-size: 12px; color: var(--vp-c-text-3); }
.net-item .value { font-size: 18px; font-weight: 600; }
</style>

<ClientOnly>
  <div class="net-demo">
    <div v-if="info" class="net-item">
      <span class="label">状态</span>
      <span class="value">{{ info.online ? '🟢 在线' : '🔴 离线' }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">网络类型</span>
      <span class="value">{{ info.connectionType === 'unknown' ? '未知' : info.connectionType }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">速度等级</span>
      <span class="value">{{ info.effectiveType }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">下行带宽</span>
      <span class="value">{{ info.downlink ? info.downlink + ' Mbps' : '未知' }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">RTT</span>
      <span class="value">{{ info.rtt ? info.rtt + ' ms' : '未知' }}</span>
    </div>
    <div v-else style="color:var(--vp-c-text-3); font-size:13px;">检测中…</div>
  </div>
</ClientOnly>

---

# Network · 网络信息

基于 [Network Information API](https://developer.mozilla.org/zh-CN/docs/Web/API/Network_Information_API)

获取浏览器网络环境信息。

## getNetworkInfo

```ts
function getNetworkInfo(): NetworkInfo
```

## NetworkInfo

```ts
interface NetworkInfo {
  online: boolean           // 是否在线
  effectiveType: string     // 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  downlink: number          // 下行带宽估算 (Mbps)
  rtt: number              // 往返时延估算 (ms)
  saveData: boolean         // 是否开启省流量模式
  connectionType: string    // 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'
}
```

```ts
import { getNetworkInfo } from '@bilibaba/ts-lab'

const info = getNetworkInfo()
console.log(info.online)        // true
console.log(info.effectiveType) // '4g'
```

## 非浏览器环境

在 Node.js 中调用会打印警告并返回默认值：

```ts
{ online: false, effectiveType: 'unknown', downlink: 0, rtt: 0, saveData: false, connectionType: 'unknown' }
```

::: warning 兼容性
Network Information API 在 Safari 中支持有限，部分字段不可用时返回默认值。
:::
