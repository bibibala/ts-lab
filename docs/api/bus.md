<script setup>
import { ref } from 'vue'
import { createBus } from '@bilibaba/ts-lab'

const bus = createBus()
const logs = ref([])
const count = ref(0)

bus.on('ping', (msg) => {
  count.value++
  logs.value.push(`[ping] ${msg}`)
})
bus.on('clear', () => { logs.value = []; count.value = 0 })

function send() { bus.emit('ping', `消息 #${count.value + 1}`) }
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
      <button class="bus-btn" @click="send">触发 ping 事件</button>
      <button class="bus-btn" @click="clearLogs">清空</button>
      <span class="bus-count">收到 {{ count }} 条消息</span>
    </div>
    <div v-if="logs.length" class="bus-log">
      <div v-for="(l, i) in logs" :key="i">{{ l }}</div>
    </div>
  </div>
</ClientOnly>

---

# Bus · 事件总线

类型安全的轻量级事件总线，支持通配符监听、重复注册检测、跨实例共享。

## 类型导出

```ts
export type EventType = string | symbol
export type Handler<T = unknown> = (event: T) => void
export type WildcardHandler<Events> = (
  type: keyof Events,
  event: Events[keyof Events],
) => void
```

## createBus

创建一个新的事件总线实例。可传入已有的 `Map` 实现多个 Bus 实例共享同一组处理器。

```ts
function createBus<Events>(all?: Map<EventType, Handler[]>): Bus<Events>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `all` | `Map<EventType, Handler[]>` | 可选，共享的处理器 Map，不传则新建 |

## Bus 接口

```ts
interface Bus<Events> {
  /** 所有事件类型到处理器的映射（可被其他实例共享） */
  all: Map<EventType, Handler[]>

  /** 触发事件（支持 void 事件不传 payload） */
  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void
  emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void

  /** 注册事件处理器（'*' 为通配符） */
  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void
  on(type: '*', handler: WildcardHandler<Events>): void

  /** 移除事件处理器 */
  off<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void
  off(type: '*', handler: WildcardHandler<Events>): void
}
```

## 基本用法

```ts
import { createBus } from '@bilibaba/ts-lab'

interface Events {
  login: string
  logout: void
}

const bus = createBus<Events>()

const handler = (user: string) => console.log(user)
bus.on('login', handler)
bus.emit('login', 'bibibala') // → "bibibala"

// void 事件无需传 payload
bus.emit('logout')

bus.off('login', handler)
```

## 通配符监听 `'*'`

```ts
bus.on('*', (type, event) => {
  console.log(type, event)
})

bus.emit('login', 'bibibala')
// → "login" "bibibala"
```

通配符处理器会收到**所有**事件的回调，第一个参数是事件类型，第二个是事件数据。

## 共享处理器 Map

多个 Bus 实例可以共享同一个 `all` Map，实现跨实例通信：

```ts
const busA = createBus<Events>()
const busB = createBus<Events>()

// 让 busB 共享 busA 的处理器
busB.all = busA.all

busA.on('login', user => console.log('A:', user))
busB.emit('login', 'shared!') // → "A: shared!"
```

也可以通过 `createBus` 的构造参数直接传入：

```ts
const sharedMap = new Map()
const busA = createBus<Events>(sharedMap)
const busB = createBus<Events>(sharedMap)
```

## 重复注册检测

同一个事件类型重复注册相同的 handler 引用时，第二次注册会被忽略并打印警告：

```ts
const handler = (user: string) => {}
bus.on('login', handler)
bus.on('login', handler) // ⚠ console.warn → 不会重复添加
```
