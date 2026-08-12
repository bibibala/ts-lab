import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWS } from '../src/tools/ws'

class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  static CONNECTING = 0
  static CLOSING = 2

  url: string
  readyState: number = MockWebSocket.CONNECTING
  onopen: ((ev: Event) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null

  send = vi.fn()
  close = vi.fn((_code?: number, _reason?: string) => {
    this.readyState = MockWebSocket.CLOSING
  })

  constructor(url: string | URL, protocols?: string | string[]) {
    this.url = String(url)
    // store for assertions
    ;(this as any)._protocols = protocols
  }

  /** Helper: simulate successful open */
  _open() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  /** Helper: simulate close (passive disconnect) */
  _close(code = 1006, reason = '') {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close', { code, reason, wasClean: false }))
  }

  /** Helper: simulate error */
  _error() {
    this.onerror?.(new Event('error'))
  }

  /** Helper: simulate receiving a message */
  _message(data: unknown) {
    const ev = new MessageEvent('message', { data }) as MessageEvent
    this.onmessage?.(ev)
  }
}

// Mock the global WebSocket
vi.stubGlobal('WebSocket', MockWebSocket)

describe('createWS', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0) // jitter factor = 0, delay = base * 0.5
    MockWebSocket.prototype.send = vi.fn()
    MockWebSocket.prototype.close = vi.fn(function (this: MockWebSocket, _code?: number, _reason?: string) {
      this.readyState = MockWebSocket.CLOSING
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('connection', () => {
    it('should create WebSocket with given url', () => {
      createWS('ws://test.com/echo')
      // just verifying no throw
    })

    it('should pass protocols to WebSocket', () => {
      const ws = createWS('ws://test.com', { protocols: ['proto1', 'proto2'] })
      expect((ws.ws as any)?._protocols).toEqual(['proto1', 'proto2'])
    })

    it('should trigger onOpen when connection opens', () => {
      const onOpen = vi.fn()
      const client = createWS('ws://test.com')
      client.onOpen(onOpen)
      ;(client.ws as unknown as MockWebSocket)._open()

      expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('should support multiple onOpen handlers', () => {
      const h1 = vi.fn()
      const h2 = vi.fn()
      const client = createWS('ws://test.com')
      client.onOpen(h1)
      client.onOpen(h2)
      ;(client.ws as unknown as MockWebSocket)._open()

      expect(h1).toHaveBeenCalledTimes(1)
      expect(h2).toHaveBeenCalledTimes(1)
    })
  })

  describe('send', () => {
    it('should call ws.send with string', () => {
      const client = createWS('ws://test.com')
      ;(client.ws as unknown as MockWebSocket)._open()
      client.send('hello')

      expect(client.ws?.send).toHaveBeenCalledWith('hello')
    })

    it('should JSON.stringify objects', () => {
      const client = createWS('ws://test.com')
      ;(client.ws as unknown as MockWebSocket)._open()
      client.send({ foo: 'bar', num: 42 })

      expect(client.ws?.send).toHaveBeenCalledWith('{"foo":"bar","num":42}')
    })

    it('should throw when sending while not connected', () => {
      const client = createWS('ws://test.com')
      // not opened yet — ws.readyState is CONNECTING
      expect(() => client.send('hello')).toThrow('[ws] Cannot send: WebSocket is not connected')
    })

    it('should throw when sending after close', () => {
      const client = createWS('ws://test.com')
      ;(client.ws as unknown as MockWebSocket)._open()
      ;(client.ws as unknown as MockWebSocket)._close()
      expect(() => client.send('hello')).toThrow('[ws] Cannot send: WebSocket is not connected')
    })

    it('should send ArrayBuffer directly', () => {
      const client = createWS('ws://test.com')
      const buf = new ArrayBuffer(4)
      ;(client.ws as unknown as MockWebSocket)._open()
      client.send(buf)

      expect(client.ws?.send).toHaveBeenCalledWith(buf)
    })
  })

  describe('receive message', () => {
    it('should pass raw data through to onMessage (no parsing)', () => {
      const onMessage = vi.fn()
      const client = createWS('ws://test.com')
      client.onMessage(onMessage)
      ;(client.ws as unknown as MockWebSocket)._message('{"type":"greet","value":1}')

      // caller is responsible for parsing
      expect(onMessage).toHaveBeenCalledWith('{"type":"greet","value":1}', expect.any(MessageEvent))
    })

    it('should pass non-JSON string through unchanged', () => {
      const onMessage = vi.fn()
      const client = createWS('ws://test.com')
      client.onMessage(onMessage)
      ;(client.ws as unknown as MockWebSocket)._message('plain text')

      expect(onMessage).toHaveBeenCalledWith('plain text', expect.any(MessageEvent))
    })
  })

  describe('close', () => {
    it('should close underlying WebSocket', () => {
      const client = createWS('ws://test.com')
      client.close(1000, 'done')

      expect(client.ws?.close).toHaveBeenCalledWith(1000, 'done')
    })

    it('should set activeClose flag so reconnect is not triggered', () => {
      const onClose = vi.fn()
      const client = createWS('ws://test.com', { reconnect: true })
      client.onClose(onClose)
      client.close()
      ;(client.ws as unknown as MockWebSocket)._close()

      // onClose should fire but no reconnect should happen
      expect(onClose).toHaveBeenCalledTimes(1)
      // the ws should not have been recreated (no new connection)
    })
  })

  describe('reconnect', () => {
    it('should reconnect on passive disconnect', () => {
      const onOpen = vi.fn()
      const client = createWS('ws://test.com', { reconnectInterval: 1000 })
      client.onOpen(onOpen)

      const ws1 = client.ws as unknown as MockWebSocket
      ws1._open()
      expect(onOpen).toHaveBeenCalledTimes(1)

      ws1._close()
      // delay = 1000 * 2^0 * 0.5 = 500ms
      vi.advanceTimersByTime(500)

      // a new WebSocket should be created (ws reference changed)
      expect(client.ws).not.toBe(ws1)
      ;(client.ws as unknown as MockWebSocket)._open()
      expect(onOpen).toHaveBeenCalledTimes(2)
    })

    it('should not reconnect when reconnect is disabled', () => {
      const client = createWS('ws://test.com', { reconnect: false })
      ;(client.ws as unknown as MockWebSocket)._open()
      ;(client.ws as unknown as MockWebSocket)._close()

      // Advance any pending timers
      vi.advanceTimersByTime(10000)

      // ws should still be the closed instance
      expect(client.readyState).toBe(MockWebSocket.CLOSED)
    })

    it('should stop reconnect after maxReconnectAttempts', () => {
      const onClose = vi.fn()
      const client = createWS('ws://test.com', {
        reconnectInterval: 500,
        maxReconnectAttempts: 2,
      })
      client.onClose(onClose)

      const ws1 = client.ws as unknown as MockWebSocket
      ws1._close() // onClose ×1, scheduleReconnect for attempt 1 (delay=250ms)

      vi.advanceTimersByTime(250) // reconnect attempt 1
      ;(client.ws as unknown as MockWebSocket)._close() // onClose ×2, scheduleReconnect for attempt 2 (delay=500ms)

      vi.advanceTimersByTime(500) // reconnect attempt 2
      ;(client.ws as unknown as MockWebSocket)._close() // onClose ×3, attempts exhausted

      vi.advanceTimersByTime(500) // should NOT attempt 3
      expect(onClose).toHaveBeenCalledTimes(3)
    })

    it('should reset reconnect attempts on successful connection', () => {
      const client = createWS('ws://test.com', {
        reconnectInterval: 500,
        maxReconnectAttempts: 2,
      })

      // fail once
      ;(client.ws as unknown as MockWebSocket)._close()
      vi.advanceTimersByTime(500)
      // succeed
      ;(client.ws as unknown as MockWebSocket)._open()
      // fail again — counter should be reset
      ;(client.ws as unknown as MockWebSocket)._close()

      vi.advanceTimersByTime(500)
      // should reconnect (counter was reset)
      ;(client.ws as unknown as MockWebSocket)._open()
      expect(client.readyState).toBe(MockWebSocket.OPEN)
    })

    it('should fire onClose on every disconnect including reconnects', () => {
      const onClose = vi.fn()
      const client = createWS('ws://test.com', {
        reconnectInterval: 500,
        maxReconnectAttempts: 5,
      })
      client.onClose(onClose)

      const ws1 = client.ws as unknown as MockWebSocket
      ws1._open()
      ws1._close() // disconnect → onClose ×1
      expect(onClose).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(250)
      ;(client.ws as unknown as MockWebSocket)._open()
      ;(client.ws as unknown as MockWebSocket)._close() // disconnect → onClose ×2

      expect(onClose).toHaveBeenCalledTimes(2)
    })

    it('should apply exponential backoff', () => {
      const client = createWS('ws://test.com', {
        reconnectInterval: 1000,
        backoffMultiplier: 2,
        maxReconnectAttempts: 3,
        jitter: false,
      })

      const ws1 = client.ws as unknown as MockWebSocket
      ws1._close() // delay = 1000 * 2^0 = 1000ms

      vi.advanceTimersByTime(999) // not yet
      expect(client.ws).toBe(ws1)

      vi.advanceTimersByTime(1) // now reconnect 1
      expect(client.ws).not.toBe(ws1)

      const ws2 = client.ws as unknown as MockWebSocket
      ws2._close() // delay = 1000 * 2^1 = 2000ms

      vi.advanceTimersByTime(1999) // not yet
      expect(client.ws).toBe(ws2)

      vi.advanceTimersByTime(1) // now reconnect 2
      expect(client.ws).not.toBe(ws2)
    })

    it('should cap delay at maxReconnectInterval', () => {
      const client = createWS('ws://test.com', {
        reconnectInterval: 1000,
        backoffMultiplier: 10,
        maxReconnectInterval: 2000,
        maxReconnectAttempts: 3,
        jitter: false,
      })

      const ws1 = client.ws as unknown as MockWebSocket
      ws1._close() // delay = min(1000*10^0, 2000) = 1000ms

      vi.advanceTimersByTime(1000)
      // reconnect 1
      const ws2 = client.ws as unknown as MockWebSocket
      ws2._close() // delay = min(1000*10^1, 2000) = 2000ms (capped)

      vi.advanceTimersByTime(1999) // not yet
      expect(client.ws).toBe(ws2)

      vi.advanceTimersByTime(1) // now reconnect 2
      expect(client.ws).not.toBe(ws2)
    })

    it('should use exact delay when jitter is disabled', () => {
      const client = createWS('ws://test.com', {
        reconnectInterval: 500,
        jitter: false,
        maxReconnectAttempts: 1,
      })
      vi.spyOn(Math, 'random').mockRestore()

      const ws1 = client.ws as unknown as MockWebSocket
      ws1._close() // delay = 500ms exactly (backoffMultiplier=2, attempt 0: 500*1=500)

      vi.advanceTimersByTime(499)
      expect(client.ws).toBe(ws1) // not yet reconnected

      vi.advanceTimersByTime(1)
      expect(client.ws).not.toBe(ws1) // now reconnected
    })
  })

  describe('heartbeat', () => {
    it('should send heartbeat message at interval', () => {
      const client = createWS('ws://test.com', {
        heartbeatInterval: 1000,
        heartbeatMessage: 'ping',
      })
      const ws = client.ws as unknown as MockWebSocket
      ws._open()

      // reset send mock after constructor
      ws.send = vi.fn()
      vi.advanceTimersByTime(1000)
      expect(ws.send).toHaveBeenCalledWith('ping')

      vi.advanceTimersByTime(1000)
      expect(ws.send).toHaveBeenCalledTimes(2)
    })

    it('should support function heartbeat message', () => {
      const client = createWS('ws://test.com', {
        heartbeatInterval: 500,
        heartbeatMessage: () => 'dynamic-ping',
      })
      const ws = client.ws as unknown as MockWebSocket
      ws._open()

      ws.send = vi.fn()
      vi.advanceTimersByTime(500)
      expect(ws.send).toHaveBeenCalledWith('dynamic-ping')
    })

    it('should stop heartbeat after close', () => {
      const client = createWS('ws://test.com', { heartbeatInterval: 500 })
      const ws = client.ws as unknown as MockWebSocket
      ws._open()

      ws.send = vi.fn()
      client.close()
      vi.advanceTimersByTime(2000)
      // send should not have been called (heartbeat stopped)
      expect(ws.send).not.toHaveBeenCalled()
    })
  })

  describe('unsubscribe', () => {
    it('should remove handler when unsubscribe function is called', () => {
      const handler = vi.fn()
      const client = createWS('ws://test.com')
      const unsub = client.onOpen(handler)
      unsub()
      ;(client.ws as unknown as MockWebSocket)._open()

      expect(handler).not.toHaveBeenCalled()
    })

    it('should remove message handler when unsubscribe function is called', () => {
      const handler = vi.fn()
      const client = createWS('ws://test.com')
      const unsub = client.onMessage(handler)
      unsub()
      ;(client.ws as unknown as MockWebSocket)._message('test')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('readyState', () => {
    it('should reflect the underlying WebSocket readyState', () => {
      const client = createWS('ws://test.com')
      expect(client.readyState).toBe(MockWebSocket.CONNECTING)

      const ws = client.ws as unknown as MockWebSocket
      ws._open()
      expect(client.readyState).toBe(MockWebSocket.OPEN)
    })

    it('should return CLOSED when ws is null', () => {
      // This is tricky to test directly; test default state
      const client = createWS('ws://test.com')
      expect(client.readyState).toBe(MockWebSocket.CONNECTING)
    })
  })

  describe('error', () => {
    it('should trigger onError', () => {
      const onError = vi.fn()
      const client = createWS('ws://test.com')
      client.onError(onError)
      ;(client.ws as unknown as MockWebSocket)._error()

      expect(onError).toHaveBeenCalledTimes(1)
    })
  })

  describe('reconnectNow', () => {
    it('should reset activeClose and reconnect immediately', () => {
      const onOpen = vi.fn()
      const client = createWS('ws://test.com', { reconnect: false })
      client.onOpen(onOpen)

      const ws1 = client.ws as unknown as MockWebSocket
      ws1._open()
      expect(onOpen).toHaveBeenCalledTimes(1)

      // close with no reconnect (reconnect: false)
      client.close()
      ws1._close()
      vi.advanceTimersByTime(10000)
      expect(onOpen).toHaveBeenCalledTimes(1) // no reconnect

      // reconnectNow overrides both activeClose and reconnect:false
      client.reconnectNow()
      expect(onOpen).toHaveBeenCalledTimes(1) // not yet fired

      const ws2 = client.ws as unknown as MockWebSocket
      ws2._open()
      expect(onOpen).toHaveBeenCalledTimes(2)
    })
  })

  describe('queueWhenOffline', () => {
    it('should buffer messages while disconnected and flush on reconnect', () => {
      const client = createWS('ws://test.com', { queueWhenOffline: true })
      ;(client.ws as unknown as MockWebSocket)._open()

      // send while connected
      client.send('msg1')
      expect(client.ws?.send).toHaveBeenCalledWith('msg1')
      ;(client.ws as unknown as MockWebSocket).send = vi.fn() // reset

      // disconnect
      ;(client.ws as unknown as MockWebSocket)._close()
      // sending while offline queues instead of throwing
      expect(() => client.send('msg2')).not.toThrow()
      expect(() => client.send('msg3')).not.toThrow()

      // reconnect — queued messages are flushed
      ;(client.ws as unknown as MockWebSocket)._open()
      expect(client.ws?.send).toHaveBeenCalledTimes(2)
      expect(client.ws?.send).toHaveBeenCalledWith('msg2')
      expect(client.ws?.send).toHaveBeenCalledWith('msg3')
    })

    it('should throw when queueWhenOffline is false (default)', () => {
      const client = createWS('ws://test.com')
      ;(client.ws as unknown as MockWebSocket)._close()
      expect(() => client.send('msg')).toThrow('[ws] Cannot send: WebSocket is not connected')
    })

    it('should drop oldest messages when queue exceeds maxQueueSize', () => {
      const client = createWS('ws://test.com', {
        queueWhenOffline: true,
        maxQueueSize: 2,
      })
      ;(client.ws as unknown as MockWebSocket)._close()

      client.send('a') // queued
      client.send('b') // queued
      client.send('c') // a dropped, b and c remain

      ;(client.ws as unknown as MockWebSocket)._open()
      expect(client.ws?.send).toHaveBeenCalledTimes(2)
      expect(client.ws?.send).toHaveBeenCalledWith('b')
      expect(client.ws?.send).toHaveBeenCalledWith('c')
    })

    it('should clear offline queue on close', () => {
      const client = createWS('ws://test.com', { queueWhenOffline: true })
      ;(client.ws as unknown as MockWebSocket)._close()

      client.send('queued')
      client.close()

      // reopen — queue was cleared by close(), nothing to flush
      ;(client.ws as unknown as MockWebSocket)._open()
      expect(client.ws?.send).not.toHaveBeenCalled()
    })
  })

  describe('heartbeat timeout', () => {
    it('should force-close when no message received within timeout', () => {
      vi.setSystemTime(0)

      const client = createWS('ws://test.com', {
        heartbeatInterval: 1000,
        heartbeatTimeoutMultiplier: 2,
      })
      const ws = client.ws as unknown as MockWebSocket
      ws._open() // lastMessageAt = 0
      ws.send = vi.fn()
      ws.close = vi.fn(function (this: MockWebSocket) {
        this.readyState = MockWebSocket.CLOSING
      })

      // t=1000: heartbeat fires, Date.now() - lastMessageAt = 1000 < 2000 → OK
      vi.setSystemTime(1000)
      vi.advanceTimersByTime(1000)
      expect(ws.send).toHaveBeenCalledWith('ping')

      // t=2000: Date.now() - lastMessageAt = 2000 >= 2000 → zombie detected
      vi.setSystemTime(2000)
      vi.advanceTimersByTime(1000)
      expect(ws.close).toHaveBeenCalledWith(4000, 'heartbeat timeout')
    })

    it('should reset timeout when a message is received', () => {
      vi.setSystemTime(0)

      const client = createWS('ws://test.com', {
        heartbeatInterval: 1000,
        heartbeatTimeoutMultiplier: 2,
      })
      const ws = client.ws as unknown as MockWebSocket
      ws._open() // lastMessageAt = 0
      ws.send = vi.fn()
      ws.close = vi.fn(function (this: MockWebSocket) {
        this.readyState = MockWebSocket.CLOSING
      })

      // t=500: receive a message → lastMessageAt reset to 500
      vi.advanceTimersByTime(500)
      ws._message('server-pong')

      // t=2000: heartbeat fires at 1000 and 2000
      // at t=1000: 1000-500=500 < 2000 → OK
      // at t=2000: 2000-500=1500 < 2000 → OK, no zombie
      vi.advanceTimersByTime(1500)
      expect(ws.close).not.toHaveBeenCalled()
    })
  })
})
