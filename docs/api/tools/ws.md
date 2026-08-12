# WebSocket · 实时连接

支持自动重连、心跳保活、僵尸连接检测、离线消息队列的 WebSocket 客户端封装。

## 类型导出

```ts
export interface WSOptions { ... }
export interface WSClient { ... }
```

## createWS

创建一个 WebSocket 客户端实例。对象传入 `send()` 自动 `JSON.stringify`，接收数据原样透传 — 由调用方自行解析。

```ts
function createWS(url: string | URL, options?: WSOptions): WSClient
```

## WSOptions

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `reconnect` | `boolean` | `true` | 是否自动重连 |
| `reconnectInterval` | `number` | `3000` | 初始重连间隔 (ms) |
| `backoffMultiplier` | `number` | `2` | 退避倍数，设为 `1` 即固定间隔 |
| `maxReconnectInterval` | `number` | `30000` | 最大重连间隔 (ms) |
| `jitter` | `boolean` | `true` | 是否启用随机抖动（避免惊群效应） |
| `maxReconnectAttempts` | `number` | `5` | 最大重连次数 |
| `heartbeatInterval` | `number` | `0` | 心跳间隔 (ms)，`0` 不启用 |
| `heartbeatMessage` | `string \| () => string \| ArrayBuffer` | `'ping'` | 心跳消息 |
| `heartbeatTimeoutMultiplier` | `number` | `2` | 心跳超时倍数，超时视为僵尸连接。`0` 禁用检测 |
| `protocols` | `string \| string[]` | — | WebSocket 子协议 |
| `queueWhenOffline` | `boolean` | `false` | 离线时是否缓存消息，重连后自动发送 |
| `maxQueueSize` | `number` | `100` | 离线队列最大长度，超出时丢弃最旧消息 |

## WSClient 接口

```ts
interface WSClient {
  /** 发送消息，对象自动 JSON.stringify */
  send(data: string | ArrayBuffer | Blob | object): void

  /** 主动关闭（不触发重连） */
  close(code?: number, reason?: string): void

  /** 立即重连：重置 activeClose 并重新建立连接 */
  reconnectNow(): void

  /** 注册事件回调，返回取消订阅函数 */
  onOpen(cb: (ev: Event) => void): () => void
  onClose(cb: (ev: CloseEvent) => void): () => void
  onError(cb: (ev: Event) => void): () => void
  onMessage<T = unknown>(cb: (data: T, ev: MessageEvent) => void): () => void

  /** 当前连接状态（对应 WebSocket.readyState） */
  readonly readyState: number

  /** 底层 WebSocket 实例 */
  readonly ws: WebSocket | null
}
```

`onClose` 在每次断连时都会触发（包括中间断连和最终关闭），调用方可通过 `ev.code` / `readyState` 自行区分。

## 基本用法

```ts
import { createWS } from '@bilibaba/ts-lab/tools'

const ws = createWS('wss://example.com/ws')

ws.onOpen(() => console.log('已连接'))
ws.onClose((ev) => console.log('已断开', ev.code))
ws.onError((ev) => console.error('出错'))

// 接收消息 — 数据原样透传，调用方自行解析
ws.onMessage((data) => {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  console.log('收到:', parsed)
})

// 发送消息 — 对象自动 JSON.stringify
ws.send({ type: 'hello', payload: 'world' })

// 主动关闭
ws.close(1000, '用户离开')
```

## 自动重连

默认开启。断开时触发 `onClose` 回调**并**自动重连，重连间隔按指数退避增长并附加随机抖动：

```
delay = min(reconnectInterval × backoffMultiplier^attempts, maxReconnectInterval)
delay = delay × (0.5 + random × 0.5)  // jitter
```

重连成功后 `onOpen` 再次触发，重连计数器归零。

```ts
const ws = createWS('wss://example.com/ws', {
  reconnectInterval: 1000,     // 首次重连等待 ≈500–1000ms
  backoffMultiplier: 2,        // 每次翻倍
  maxReconnectInterval: 30000, // 上限 30s
  maxReconnectAttempts: 10,    // 最多 10 次
  jitter: true,                // 默认开启
})
```

禁用重连：

```ts
const ws = createWS('wss://example.com/ws', { reconnect: false })
```

## 立即重连 reconnectNow

主动关闭后想重新连接，或在重连禁用状态下手动触发：

```ts
ws.close()           // 主动断开，不会自动重连
// ... 一段时间后 ...
ws.reconnectNow()    // 重置标记，立即建立新连接
```

`reconnectNow` 会无视 `reconnect: false` 和 `activeClose` 标记，直接重连。

## 心跳 · 僵尸连接检测

设置 `heartbeatInterval` 后，每隔固定时间发送一次心跳消息。设置 `heartbeatTimeoutMultiplier` 后，若在 `heartbeatInterval × heartbeatTimeoutMultiplier` 时间内未收到任何消息（包括服务端 pong），则视为僵死连接，自动关闭并触发重连。

```ts
const ws = createWS('wss://example.com/ws', {
  heartbeatInterval: 5000,            // 每 5s 发送一次心跳
  heartbeatTimeoutMultiplier: 2,      // 10s 没收到任何消息 → 僵尸，断开重连
  heartbeatMessage: 'ping',           // 心跳内容（支持函数）
})
```

收到任何消息都会重置心跳超时计时器，无论消息内容。

## 离线消息队列

设置 `queueWhenOffline` 后，断连期间 `send()` 不会抛错，消息会缓存到队列中。重连成功后自动发送：

```ts
const ws = createWS('wss://example.com/ws', {
  queueWhenOffline: true,
  maxQueueSize: 50,  // 最多缓存 50 条，超出时丢弃最旧消息
})

ws.onMessage((data) => {
  // data 原样透传，自行解析
  console.log(data)
})

// 断线时 send 不会抛错，消息进入队列
ws.send({ action: 'move', x: 10, y: 20 })
ws.send({ action: 'move', x: 15, y: 25 })
// 重连后自动按顺序发送
```

`close()` 会清空离线队列。
