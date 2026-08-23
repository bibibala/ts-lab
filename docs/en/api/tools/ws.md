# WebSocket · Real-Time Connection

A WebSocket client wrapper with automatic reconnection, heartbeat keep-alive, zombie connection detection, and offline message queuing.

## Type Exports

```ts
export interface WSOptions { ... }
export interface WSClient { ... }
```

## createWS

Create a WebSocket client instance. Objects passed to `send()` are automatically `JSON.stringify`-ed; received data is passed through as-is — the caller is responsible for parsing.

```ts
function createWS(url: string | URL, options?: WSOptions): WSClient
```

## WSOptions

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `reconnect` | `boolean` | `true` | Whether to auto-reconnect |
| `reconnectInterval` | `number` | `3000` | Initial reconnect interval (ms) |
| `backoffMultiplier` | `number` | `2` | Backoff multiplier; set to `1` for fixed interval |
| `maxReconnectInterval` | `number` | `30000` | Maximum reconnect interval (ms) |
| `jitter` | `boolean` | `true` | Enable random jitter (avoid thundering herd) |
| `maxReconnectAttempts` | `number` | `5` | Maximum reconnect attempts |
| `heartbeatInterval` | `number` | `0` | Heartbeat interval (ms); `0` disables |
| `heartbeatMessage` | `string \| () => string \| ArrayBuffer` | `'ping'` | Heartbeat message |
| `heartbeatTimeoutMultiplier` | `number` | `2` | Heartbeat timeout multiplier; timeout triggers zombie detection. `0` disables detection |
| `protocols` | `string \| string[]` | — | WebSocket sub-protocol(s) |
| `queueWhenOffline` | `boolean` | `false` | Buffer messages while offline; auto-send on reconnect |
| `maxQueueSize` | `number` | `100` | Max offline queue size; oldest messages are dropped when exceeded |

## WSClient Interface

```ts
interface WSClient {
  /** Send message; objects are auto JSON.stringify-d */
  send(data: string | ArrayBuffer | Blob | object): void

  /** Actively close (does not trigger reconnect) */
  close(code?: number, reason?: string): void

  /** Reconnect immediately: reset activeClose and re-establish connection */
  reconnectNow(): void

  /** Register event callbacks; returns unsubscribe function */
  onOpen(cb: (ev: Event) => void): () => void
  onClose(cb: (ev: CloseEvent) => void): () => void
  onError(cb: (ev: Event) => void): () => void
  onMessage<T = unknown>(cb: (data: T, ev: MessageEvent) => void): () => void

  /** Current connection state (corresponds to WebSocket.readyState) */
  readonly readyState: number

  /** Underlying WebSocket instance */
  readonly ws: WebSocket | null
}
```

`onClose` fires on every disconnection (including intermediate drops and final close). Callers can distinguish via `ev.code` / `readyState`.

## Basic Usage

```ts
import { createWS } from '@bilibaba/ts-lab/tools'

const ws = createWS('wss://example.com/ws')

ws.onOpen(() => console.log('Connected'))
ws.onClose((ev) => console.log('Disconnected', ev.code))
ws.onError((ev) => console.error('Error'))

// Receive messages — data passed through as-is, caller parses
ws.onMessage((data) => {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  console.log('Received:', parsed)
})

// Send messages — objects are auto JSON.stringify-d
ws.send({ type: 'hello', payload: 'world' })

// Close manually
ws.close(1000, 'User left')
```

## Auto-Reconnect

Enabled by default. On disconnect, `onClose` fires **and** auto-reconnect triggers. Reconnect interval grows exponentially with random jitter:

```
delay = min(reconnectInterval × backoffMultiplier^attempts, maxReconnectInterval)
delay = delay × (0.5 + random × 0.5)  // jitter
```

After successful reconnect, `onOpen` fires again and the reconnect counter resets.

```ts
const ws = createWS('wss://example.com/ws', {
  reconnectInterval: 1000,     // First reconnect wait ≈500–1000ms
  backoffMultiplier: 2,        // Doubles each time
  maxReconnectInterval: 30000, // Cap at 30s
  maxReconnectAttempts: 10,    // Up to 10 attempts
  jitter: true,                // Enabled by default
})
```

Disable reconnect:

```ts
const ws = createWS('wss://example.com/ws', { reconnect: false })
```

## Immediate Reconnect with reconnectNow

After a manual close you want to reconnect, or manually trigger when reconnect is disabled:

```ts
ws.close()           // Manually disconnected, no auto-reconnect
// ... after some time ...
ws.reconnectNow()    // Reset flags, immediately establish new connection
```

`reconnectNow` ignores both `reconnect: false` and the `activeClose` flag, reconnecting directly.

## Heartbeat · Zombie Connection Detection

Set `heartbeatInterval` to send a heartbeat message at a fixed interval. Set `heartbeatTimeoutMultiplier` — if no message (including server pong) is received within `heartbeatInterval × heartbeatTimeoutMultiplier`, the connection is considered dead and automatically closed with reconnect triggered.

```ts
const ws = createWS('wss://example.com/ws', {
  heartbeatInterval: 5000,            // Send heartbeat every 5s
  heartbeatTimeoutMultiplier: 2,      // 10s no message → zombie, disconnect & reconnect
  heartbeatMessage: 'ping',           // Heartbeat content (supports function)
})
```

Receiving any message resets the heartbeat timeout timer, regardless of content.

## Offline Message Queue

With `queueWhenOffline` enabled, `send()` won't throw during disconnection — messages are buffered. They are sent automatically after successful reconnect:

```ts
const ws = createWS('wss://example.com/ws', {
  queueWhenOffline: true,
  maxQueueSize: 50,  // Buffer up to 50 messages; oldest dropped when exceeded
})

ws.onMessage((data) => {
  // Data passed through as-is, parse it yourself
  console.log(data)
})

// send() won't throw while disconnected; messages enter the queue
ws.send({ action: 'move', x: 10, y: 20 })
ws.send({ action: 'move', x: 15, y: 25 })
// Sent automatically in order after reconnect
```

`close()` clears the offline queue.
