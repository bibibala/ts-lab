import { describe, expect, it, vi } from 'vitest'
import { createBus } from '../src/tools/bus'

interface Events {
  foo: string
  bar: number
  baz: void
}

describe('createBus', () => {
  describe('on + emit', () => {
    it('should register and invoke a handler', () => {
      const bus = createBus<Events>()
      const handler = vi.fn()

      bus.on('foo', handler)
      bus.emit('foo', 'hello')

      expect(handler).toHaveBeenCalledWith('hello')
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should invoke all handlers for the same event', () => {
      const bus = createBus<Events>()
      const h1 = vi.fn()
      const h2 = vi.fn()

      bus.on('bar', h1)
      bus.on('bar', h2)
      bus.emit('bar', 42)

      expect(h1).toHaveBeenCalledWith(42)
      expect(h2).toHaveBeenCalledWith(42)
    })

    it('should emit without payload', () => {
      const bus = createBus<Events>()
      const handler = vi.fn()

      bus.on('baz', handler)
      bus.emit('baz')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should warn when registering the same handler twice', () => {
      const bus = createBus<Events>()
      const handler = vi.fn()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      bus.on('foo', handler)
      bus.on('foo', handler)
      bus.emit('foo', 'once')

      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(
        '[bus] Duplicate handler registration for event "foo". The handler will not be added again.',
      )
      expect(handler).toHaveBeenCalledTimes(1)

      warn.mockRestore()
    })
  })

  describe('off', () => {
    it('should remove a specific handler', () => {
      const bus = createBus<Events>()
      const h1 = vi.fn()
      const h2 = vi.fn()

      bus.on('foo', h1)
      bus.on('foo', h2)
      bus.off('foo', h1)
      bus.emit('foo', 'test')

      expect(h1).not.toHaveBeenCalled()
      expect(h2).toHaveBeenCalledWith('test')
    })

    it('should be a no-op if handler not found', () => {
      const bus = createBus<Events>()
      const h = vi.fn()

      bus.on('foo', h)
      bus.off('foo', vi.fn())
      bus.emit('foo', 'test')

      expect(h).toHaveBeenCalledTimes(1)
    })

    it('should be a no-op if no handlers registered for type', () => {
      const bus = createBus<Events>()
      expect(() => bus.off('foo', vi.fn())).not.toThrow()
    })
  })

  describe('wildcard (*)', () => {
    it('should invoke wildcard handler for any event', () => {
      const bus = createBus<Events>()
      const handler = vi.fn()

      bus.on('*', handler)
      bus.emit('foo', 'hello')

      expect(handler).toHaveBeenCalledWith('foo', 'hello')
    })

    it('should invoke wildcard handler alongside normal handler', () => {
      const bus = createBus<Events>()
      const normal = vi.fn()
      const wild = vi.fn()

      bus.on('bar', normal)
      bus.on('*', wild)
      bus.emit('bar', 99)

      expect(normal).toHaveBeenCalledWith(99)
      expect(wild).toHaveBeenCalledWith('bar', 99)
    })

    it('should remove wildcard handler', () => {
      const bus = createBus<Events>()
      const handler = vi.fn()

      bus.on('*', handler)
      bus.off('*', handler)
      bus.emit('foo', 'x')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('all', () => {
    it('should expose the internal Map', () => {
      const bus = createBus<Events>()
      const h = vi.fn()

      bus.on('foo', h)
      expect(bus.all.get('foo')).toEqual([h])
    })

    it('should share state when given an external Map', () => {
      const shared = new Map()
      const bus1 = createBus<Events>(shared)
      const bus2 = createBus<Events>(shared)
      const handler = vi.fn()

      bus1.on('foo', handler)
      bus2.emit('foo', 'shared')

      expect(handler).toHaveBeenCalledWith('shared')
    })
  })
})
