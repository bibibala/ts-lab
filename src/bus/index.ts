export type EventType = string | symbol

export type Handler<T = unknown> = (event: T) => void

export type WildcardHandler<Events> = (
  type: keyof Events,
  event: Events[keyof Events],
) => void

export interface Bus<Events> {
  /** Map of event types to their handlers */
  all: Map<EventType, Handler[]>

  /** Register an event handler */
  emit: (<Key extends keyof Events>(type: Key, event: Events[Key]) => void) & (<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never) => void)

  /** Register an event handler */
  on: (<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) => void) & ((type: '*', handler: WildcardHandler<Events>) => void)
  off: (<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) => void) & ((type: '*', handler: WildcardHandler<Events>) => void)
}

/**
 * Create a new event bus instance.
 *
 * @example
 * ```ts
 * type Events = {
 *   foo: string
 *   bar: number
 * }
 *
 * const bus = createBus<Events>()
 *
 * bus.on('foo', (msg) => console.log(msg))
 * bus.emit('foo', 'hello')
 * ```
 */
export function createBus<Events>(
  all?: Map<EventType, Handler[]>,
): Bus<Events> {
  const map = all ?? new Map()

  return {
    all: map,

    on<Key extends keyof Events>(type: Key | '*', handler: Handler<Events[Key]> | WildcardHandler<Events>): void {
      const handlers = map.get(type as EventType)
      if (handlers) {
        if (handlers.includes(handler as Handler)) {
          console.warn(`[bus] Duplicate handler registration for event "${String(type)}". The handler will not be added again.`)
          return
        }
        handlers.push(handler as Handler)
      }
      else {
        map.set(type as EventType, [handler as Handler])
      }
    },

    off<Key extends keyof Events>(type: Key | '*', handler: Handler<Events[Key]> | WildcardHandler<Events>): void {
      const handlers = map.get(type as EventType)
      if (handlers) {
        const idx = handlers.indexOf(handler as Handler)
        if (idx !== -1)
          handlers.splice(idx, 1)
      }
    },

    emit<Key extends keyof Events>(type: Key | '*', event?: Events[Key]): void {
      const handlers = map.get(type as EventType)
      if (handlers) {
        for (const handler of handlers) {
          ;(handler as Handler)(event)
        }
      }

      // wildcard handlers
      const wildcards = map.get('*')
      if (wildcards) {
        for (const handler of wildcards) {
          ;(handler as WildcardHandler<Events>)(type as keyof Events, event!)
        }
      }
    },
  }
}
