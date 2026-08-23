<script setup>
import { onMounted, ref } from 'vue'
import { getNetworkInfo } from '@bilibaba/ts-lab/browser'

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
      <span class="label">Status</span>
      <span class="value">{{ info.online ? '🟢 Online' : '🔴 Offline' }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">Network Type</span>
      <span class="value">{{ info.connectionType === 'unknown' ? 'Unknown' : info.connectionType }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">Speed Tier</span>
      <span class="value">{{ info.effectiveType }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">Downlink</span>
      <span class="value">{{ info.downlink ? info.downlink + ' Mbps' : 'Unknown' }}</span>
    </div>
    <div v-if="info" class="net-item">
      <span class="label">RTT</span>
      <span class="value">{{ info.rtt ? info.rtt + ' ms' : 'Unknown' }}</span>
    </div>
    <div v-else style="color:var(--vp-c-text-3); font-size:13px;">Detecting…</div>
  </div>
</ClientOnly>

---

# Network · Network Info

Based on [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)

Get browser network environment information.

## getNetworkInfo

```ts
function getNetworkInfo(): NetworkInfo
```

## NetworkInfo

```ts
interface NetworkInfo {
  online: boolean           // Whether online
  effectiveType: string     // 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  downlink: number          // Downlink bandwidth estimate (Mbps)
  rtt: number              // Round-trip time estimate (ms)
  saveData: boolean         // Whether data saver is enabled
  connectionType: string    // 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'
}
```

```ts
import { getNetworkInfo } from '@bilibaba/ts-lab/browser'

const info = getNetworkInfo()
console.log(info.online)        // true
console.log(info.effectiveType) // '4g'
```

## Non-Browser Environments

Calling in Node.js prints a warning and returns default values:

```ts
{ online: false, effectiveType: 'unknown', downlink: 0, rtt: 0, saveData: false, connectionType: 'unknown' }
```

::: warning Compatibility
Network Information API has limited support in Safari. Some fields return default values when unavailable.
:::
