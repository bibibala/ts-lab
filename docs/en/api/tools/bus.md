<script setup>
import { ref } from 'vue'
import { createBus } from '@bilibaba/ts-lab/tools'

const bus = createBus()
const logs = ref([])
const count = ref(0)

bus.on('ping', (msg) => {
  count.value++
  logs.value.push(`[ping] ${msg}`)
})
bus.on('clear', () => { logs.value = []; count.value = 0 })

function send() { bus.emit('ping', `Message #${count.value + 1}`) }
function clearLogs() { bus.emit('clear') }
</script>

<style>
.bus-demo {
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  padding: 16px 20px; margin: 16px 0 24px; background: var(--vp-c-bg-soft);
}
.bus-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.bus-btn {
  padding: 6px 16px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: var(--vp-c-brand-1); color: #fff;
}
.bus-log {
  margin-top: 8px; max-height: 120px; overflow-y: auto;
  font-size: 12px; font-family: monospace; color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider); border-radius: 4px;
  padding: 6px 10px; background: var(--vp-c-bg);
}
.bus-count { font-size: 13px; color: var(--vp-c-text-3); margin-left: 8px; }
</style>

<ClientOnly>
  <div class="bus-demo">
    <div class="bus-row">
      <button class="bus-btn" @click="send">Emit ping</button>
      <button class="bus-btn" @click="clearLogs">Clear</button>
      <span class="bus-count">Received {{ count }} messages</span>
    </div>
    <div v-if="logs.length" class="bus-log">
      <div v-for="(l, i) in logs" :key="i">{{ l }}</div>
    </div>
  </div>
</ClientOnly>

---

# Bus · Event Bus

A type-safe lightweight event bus with wildcard listener support, duplicate registration detection, and cross-instance sharing.

## Type Exports

```ts
export type EventType = string | symbol
export type Handler<T = unknown> = (event: T) => void
export type WildcardHandler<Events> = (
  type: keyof Events,
  event: Events[keyof Events],
) => void
```

## createBus

Create a new event bus instance. Pass an existing `Map` to share handlers across multiple Bus instances.

```ts
function createBus<Events>(all?: Map<EventType, Handler[]>): Bus<Events>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `all` | `Map<EventType, Handler[]>` | Optional, shared handler Map. Creates a new one if not provided |

## Bus Interface

```ts
interface Bus<Events> {
  /** Emit event (omit payload for void events) */
  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void
  emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void

  /** Register event handler ('*' for wildcard) */
  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void
  on(type: '*', handler: WildcardHandler<Events>): void

  /** Remove event handler */
  off<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void
  off(type: '*', handler: WildcardHandler<Events>): void
}
```

## Basic Usage

```ts
import { createBus } from '@bilibaba/ts-lab/tools'

interface Events {
  login: string
  logout: void
}

const bus = createBus<Events>()

const handler = (user: string) => console.log(user)
bus.on('login', handler)
bus.emit('login', 'bibibala') // → "bibibala"

// void events don't require a payload
bus.emit('logout')

bus.off('login', handler)
```

## Wildcard Listener `'*'`

```ts
bus.on('*', (type, event) => {
  console.log(type, event)
})

bus.emit('login', 'bibibala')
// → "login" "bibibala"
```

Wildcard handlers receive callbacks for **all** events — first argument is the event type, second is the event data.

## Shared Handler Map

Multiple Bus instances can share the same handler Map for cross-instance communication. Pass a shared `Map` via the constructor:

```ts
const sharedMap = new Map()
const busA = createBus<Events>(sharedMap)
const busB = createBus<Events>(sharedMap)

busA.on('login', user => console.log('A:', user))
busB.emit('login', 'shared!') // → "A: shared!"
```

## Duplicate Registration Detection

When the same handler reference is registered twice for the same event type, the second registration is ignored with a warning:

```ts
const handler = (user: string) => {}
bus.on('login', handler)
bus.on('login', handler) // ⚠ console.warn → not added again
```
