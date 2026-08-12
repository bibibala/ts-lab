export interface WSOptions {
  /** Auto-reconnect. Default: true */
  reconnect?: boolean
  /** Initial reconnect interval (ms). Default: 3000 */
  reconnectInterval?: number
  /** Backoff multiplier. Default: 2. Set to 1 for a fixed interval */
  backoffMultiplier?: number
  /** Max reconnect interval (ms). Default: 30000 */
  maxReconnectInterval?: number
  /** Random jitter. Default: true */
  jitter?: boolean
  /** Max reconnect attempts. Default: 5 */
  maxReconnectAttempts?: number
  /** Heartbeat interval (ms). Default: 0 (disabled) */
  heartbeatInterval?: number
  /** Heartbeat message. Default: 'ping' */
  heartbeatMessage?: string | (() => string | ArrayBuffer)
  /**
   * Heartbeat timeout multiplier. Default: 2.
   * If no message is received for longer than
   * heartbeatInterval * heartbeatTimeoutMultiplier, the connection is
   * treated as dead (zombie connection): it's force-closed and a
   * reconnect is triggered. Set to 0 to disable this check.
   */
  heartbeatTimeoutMultiplier?: number
  /** Sub-protocols */
  protocols?: string | string[]
  /**
   * Whether send() should buffer messages while disconnected and
   * flush them once the connection reopens.
   * Default: false (original behavior: throws immediately when offline).
   */
  queueWhenOffline?: boolean
  /** Max offline queue size. Default: 100. Oldest messages are dropped once exceeded */
  maxQueueSize?: number
}

type OpenHandler = (ev: Event) => void
type CloseHandler = (ev: CloseEvent) => void
type ErrorHandler = (ev: Event) => void
type MessageHandler = (data: unknown, ev: MessageEvent) => void

export interface WSClient {
  /** Send a message; objects are auto-serialized with JSON.stringify. When offline, behavior depends on the queueWhenOffline option (queue vs throw) */
  send: (data: string | ArrayBuffer | Blob | object) => void
  /** Actively close the connection (does not trigger a reconnect) */
  close: (code?: number, reason?: string) => void
  /** Manually trigger a reconnect: resets activeClose and reconnects immediately */
  reconnectNow: () => void
  /** Register an open handler; returns an unsubscribe function */
  onOpen: (cb: OpenHandler) => () => void
  /** Register a close handler; returns an unsubscribe function */
  onClose: (cb: CloseHandler) => () => void
  /** Register an error handler; returns an unsubscribe function */
  onError: (cb: ErrorHandler) => () => void
  /** Register a message handler (no parsing is done — raw data is passed through for the caller to handle); returns an unsubscribe function */
  onMessage: <T = unknown>(cb: (data: T, ev: MessageEvent) => void) => () => void
  /** Current connection state */
  readonly readyState: number
  /** The underlying WebSocket instance */
  readonly ws: WebSocket | null
}

function noop(): void {}

/** No-op implementation returned in SSR / non-browser environments to avoid build-time errors */
function createNoopWSClient(): WSClient {
  return {
    send: noop,
    close: noop,
    reconnectNow: noop,
    onOpen: () => noop,
    onClose: () => noop,
    onError: () => noop,
    onMessage: () => noop,
    get readyState() {
      return 3 // corresponds to CLOSED
    },
    get ws() {
      return null
    },
  }
}

/**
 * Creates a WebSocket client with auto-reconnect, heartbeat (including
 * zombie-connection detection), and an offline message queue.
 * Objects passed to send() are auto-serialized with JSON.stringify, but
 * incoming data is passed through untouched to the onMessage callback —
 * the caller is responsible for inspecting its type and parsing it
 * (e.g. JSON.parse) as needed.
 *
 * @example
 * ```ts
 * const ws = createWS('wss://example.com/ws')
 *
 * ws.onOpen(() => console.log('connected'))
 * ws.onMessage((data) => {
 *   // data is raw — check its type and parse it yourself, e.g.:
 *   const parsed = typeof data === 'string' ? JSON.parse(data) : data
 *   console.log(parsed)
 * })
 * ws.send({ type: 'hello' })
 * ```
 */
export function createWS(url: string | URL, options: WSOptions = {}): WSClient {
  // SSR / non-browser guard: avoids errors during build steps like vite-ssg
  if (typeof WebSocket === 'undefined') {
    return createNoopWSClient()
  }

  const {
    reconnect = true,
    reconnectInterval = 3000,
    backoffMultiplier = 2,
    maxReconnectInterval = 30000,
    jitter = true,
    maxReconnectAttempts = 5,
    heartbeatInterval = 0,
    heartbeatMessage = 'ping',
    heartbeatTimeoutMultiplier = 2,
    protocols,
    queueWhenOffline = false,
    maxQueueSize = 100,
  } = options

  let ws: WebSocket | null = null
  let activeClose = false
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let lastMessageAt = 0
  const offlineQueue: (string | ArrayBuffer | Blob)[] = []

  const openHandlers: OpenHandler[] = []
  const closeHandlers: CloseHandler[] = []
  const errorHandlers: ErrorHandler[] = []
  const messageHandlers: MessageHandler[] = []

  // Declared up front so scheduleReconnect's setTimeout closure can reference it (mutual recursion)
  let connect: () => void

  const flushQueue = (): void => {
    if (!ws || ws.readyState !== WebSocket.OPEN)
      return
    while (offlineQueue.length > 0) {
      const raw = offlineQueue.shift()!
      ws.send(raw)
    }
  }

  const startHeartbeat = (): void => {
    if (heartbeatInterval <= 0)
      return
    lastMessageAt = Date.now()
    heartbeatTimer = setInterval(() => {
      if (ws?.readyState !== WebSocket.OPEN)
        return

      // Zombie-connection detection: no message (including server pongs) received in too long — force-close and reconnect
      if (
        heartbeatTimeoutMultiplier > 0
        && Date.now() - lastMessageAt > heartbeatInterval * heartbeatTimeoutMultiplier
      ) {
        ws.close(4000, 'heartbeat timeout')
        return
      }

      const msg = typeof heartbeatMessage === 'function' ? heartbeatMessage() : heartbeatMessage
      ws.send(msg)
    }, heartbeatInterval)
  }

  const stopHeartbeat = (): void => {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  const scheduleReconnect = (): void => {
    if (!reconnect || activeClose)
      return
    if (reconnectAttempts >= maxReconnectAttempts)
      return

    // Cap the exponent before computing it, so Math.pow can't overflow to Infinity when maxReconnectAttempts is set very high
    const safeAttempts = Math.min(reconnectAttempts, 30)
    let delay = reconnectInterval * backoffMultiplier ** safeAttempts
    if (!Number.isFinite(delay) || delay > maxReconnectInterval) {
      delay = maxReconnectInterval
    }
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    reconnectTimer = setTimeout(() => {
      reconnectAttempts++
      connect()
    }, delay)
  }

  connect = (): void => {
    stopHeartbeat()

    ws = new WebSocket(url, protocols)

    ws.onopen = (ev) => {
      reconnectAttempts = 0
      startHeartbeat()
      flushQueue()
      for (const handler of openHandlers) {
        handler(ev)
      }
    }

    ws.onclose = (ev) => {
      stopHeartbeat()

      // Notify callers (fires for both mid-session drops and final closes)
      for (const handler of closeHandlers) {
        handler(ev)
      }

      // The reconnect-count/flag checks are fully handled inside scheduleReconnect, so we don't repeat them here
      if (!activeClose) {
        scheduleReconnect()
      }
    }

    ws.onerror = (ev) => {
      for (const handler of errorHandlers) {
        handler(ev)
      }
    }

    ws.onmessage = (ev) => {
      // Used for zombie-connection detection: any message counts as "connection alive", regardless of content
      lastMessageAt = Date.now()

      // No parsing or transformation is done here — data is passed through as-is; the caller decides how to handle it
      for (const handler of messageHandlers) {
        handler(ev.data, ev)
      }
    }
  }

  connect()

  return {
    get ws() {
      return ws
    },

    get readyState() {
      return ws?.readyState ?? WebSocket.CLOSED
    },

    send(data: string | ArrayBuffer | Blob | object): void {
      const raw = typeof data === 'object' && !(data instanceof ArrayBuffer) && !(data instanceof Blob) && data !== null
        ? JSON.stringify(data)
        : data as string | ArrayBuffer | Blob

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        if (queueWhenOffline) {
          if (offlineQueue.length >= maxQueueSize) {
            offlineQueue.shift() // drop the oldest message to stay within the queue limit
          }
          offlineQueue.push(raw)
          return
        }
        throw new Error('[ws] Cannot send: WebSocket is not connected')
      }
      ws.send(raw)
    },

    close(code?: number, reason?: string): void {
      activeClose = true
      reconnectAttempts = 0
      stopHeartbeat()
      offlineQueue.length = 0
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      ws?.close(code, reason)
    },

    reconnectNow(): void {
      activeClose = false
      reconnectAttempts = 0
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      ws?.close()
      connect()
    },

    onOpen(cb: OpenHandler) {
      openHandlers.push(cb)
      return () => {
        const idx = openHandlers.indexOf(cb)
        if (idx !== -1)
          openHandlers.splice(idx, 1)
      }
    },

    onClose(cb: CloseHandler) {
      closeHandlers.push(cb)
      return () => {
        const idx = closeHandlers.indexOf(cb)
        if (idx !== -1)
          closeHandlers.splice(idx, 1)
      }
    },

    onError(cb: ErrorHandler) {
      errorHandlers.push(cb)
      return () => {
        const idx = errorHandlers.indexOf(cb)
        if (idx !== -1)
          errorHandlers.splice(idx, 1)
      }
    },

    onMessage<T = unknown>(cb: (data: T, ev: MessageEvent) => void) {
      const handler: MessageHandler = (data, ev) => cb(data as T, ev)
      messageHandlers.push(handler)
      return () => {
        const idx = messageHandlers.indexOf(handler)
        if (idx !== -1)
          messageHandlers.splice(idx, 1)
      }
    },
  }
}
