# Network · 网络信息

基于浏览器 [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) 获取网络环境信息。

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
