# ts-lab

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

A collection of utility functions for everyday TypeScript development.

## Install

```bash
pnpm add @bilibaba/ts-lab
```

## Modules

### Recursion

Tree traversal utilities.

```ts
import { getObjById, getParentNodes, getPathById, getTopLevelNode } from '@bilibaba/ts-lab'

const tree = [
  { id: 1, children: [{ id: 11, children: [{ id: 111 }] }] },
  { id: 2, children: [{ id: 21 }] },
]

getObjById(tree, 111) // { id: 111 }
getParentNodes(tree, [111, 21]) // [parent of 111, parent of 21]
getPathById(tree, 111) // [{ id: 1 }, { id: 11 }, { id: 111 }]
getTopLevelNode(tree, 111) // { id: 1 }
```

### Bus

Lightweight event bus.

```ts
import { createBus } from '@bilibaba/ts-lab'

interface Events { login: string, logout: void }

const bus = createBus<Events>()

bus.on('login', user => console.log(user))
bus.on('*', (type, event) => console.log(type, event))

bus.emit('login', 'bibibala')
// → "bibibala"
// → "login" "bibibala"

bus.off('login', handler)
```

### Clipboard

Write a base64-encoded image to the clipboard. Falls back to downloading the image if the Clipboard API is unavailable.

```ts
import { writeImgToClipboard } from '@bilibaba/ts-lab'

await writeImgToClipboard('data:image/png;base64,iVBOR...')
```

### Network

Get current network environment info based on the browser's Network Information API. Prints a warning and returns defaults in non-browser environments.

```ts
import { getNetworkInfo } from '@bilibaba/ts-lab'

const info = getNetworkInfo()
console.log(info.online) // true
console.log(info.effectiveType) // '4g'
```

### WebMCP

Expose page data as WebMCP tools so AI agents (via `chrome-devtools-mcp`) can discover and call them.
Requires **Chrome 149+** with `chrome://flags/#webmcp` and `chrome://flags/#devtools-webmcp-support` enabled.

#### Quick start — `exposeData`

Given an array, auto-generate search, add, delete, and stats tools:

```ts
import { exposeData } from '@bilibaba/ts-lab'

const ORDERS = [
  { id: 'SO-1001', customer: 'Alice', amount: 1280, status: 'shipped' },
  { id: 'SO-1002', customer: 'Bob', amount: 560, status: 'pending' },
]

exposeData('orders', ORDERS, {
  idField: 'id',
  searchFields: ['id', 'customer'],
  fields: {
    id: { type: 'string', description: 'Order ID' },
    customer: { type: 'string', description: 'Customer name' },
    amount: { type: 'number', description: 'Order amount' },
    status: { type: 'string', description: 'Order status' },
  },
})
// → registers: orders_search, orders_add, orders_delete, orders_stats
```

#### `exposeFunction` — expose a single function

```ts
import { exposeFunction } from '@bilibaba/ts-lab'

exposeFunction('greet', async ({ name }: { name: string }) => {
  return { greeting: `Hello, ${name}!` }
}, {
  description: 'Say hello',
  params: { name: { type: 'string', description: 'Your name' } },
  required: ['name'],
})
```

#### `exposeAction` — UI actions (open dialog, switch tab, etc.)

```ts
import { exposeAction } from '@bilibaba/ts-lab'
import { ref } from 'vue'

const dialogOpen = ref(false)

exposeAction('openInvoiceDialog', async () => {
  dialogOpen.value = true
}, { description: 'Open the create-invoice dialog' })

exposeAction('closeInvoiceDialog', async () => {
  dialogOpen.value = false
}, { description: 'Close the create-invoice dialog' })
```

#### `exposeForm` — fill a form (with optional auto-submit)

```ts
import { exposeForm } from '@bilibaba/ts-lab'
import { reactive } from 'vue'

const form = reactive({ customer: '', amount: 0, taxRate: 0 })

exposeForm('invoiceForm', form, {
  description: 'Fill the invoice form fields',
  fields: {
    customer: { type: 'string', description: 'Customer name' },
    amount: { type: 'number', description: 'Invoice amount' },
    taxRate: { type: 'number', description: 'Tax rate, e.g. 0.06' },
  },
  required: ['customer', 'amount'],
  allowSubmit: true, // default false — only let AI submit low-risk forms
  onSubmit: () => submitInvoice(form),
})
// → registers invoiceForm_fill, invoiceForm_submit
```

#### `registerTool` — full control

```ts
import { registerTool } from '@bilibaba/ts-lab'

registerTool({
  name: 'customAction',
  description: 'Do something custom',
  inputSchema: {
    type: 'object',
    properties: { x: { type: 'number', description: 'A number' } },
    required: ['x'],
  },
  async execute({ x }) {
    return { content: [{ type: 'text', text: `Result: ${x * 2}` }] }
  },
})
```

#### Cleanup with `AbortSignal` (Vue / React)

```ts
const controller = new AbortController()

onMounted(() => {
  exposeData('orders', ORDERS, {
    idField: 'id',
    searchFields: ['id'],
    signal: controller.signal,
  })
})

onUnmounted(() => controller.abort()) // → all tools unregistered
```

## API

### `recursion`

| Function | Description |
|---|---|
| `getObjById(list, id, idKey?, childrenKey?)` | Find a node by id in a tree |
| `getParentNodes(list, childIds, idKey?, childrenKey?)` | Find direct parents of given child ids |
| `getPathById(list, id, idKey?, childrenKey?)` | Get the full path from root to target node |
| `getTopLevelNode(list, targetId, idKey?, childrenKey?)` | Find the root ancestor of a node |
| `TreeNode` | Generic tree node interface |

### `bus`

| Function | Description |
|---|---|
| `createBus(events?)` | Create a new event bus instance |
| `bus.on(type, handler)` | Register an event handler |
| `bus.off(type, handler)` | Remove an event handler |
| `bus.emit(type, event?)` | Emit an event |
| `bus.all` | Internal `Map` of all handlers (shareable across instances) |

### `clipboard`

| Function | Description |
|---|---|
| `writeImgToClipboard(src)` | Write a base64-encoded image to the clipboard, supports png/jpeg/jpg/gif |

### `network`

| Export | Description |
|---|---|
| `getNetworkInfo()` | Get current network info (online status, connection type, speed estimates) |
| `NetworkInfo` | Interface describing the network state shape |

### `webmcp`

| Export | Description |
|---|---|
| `exposeData(name, data, options)` | Expose an array as CRUD tools (search / add / delete / stats) |
| `exposeFunction(name, fn, opts)` | Expose a single async function as a WebMCP tool |
| `exposeAction(name, fn, opts)` | Expose a UI action (dialog, tab, toggle) — returns `{ done: true }` |
| `exposeForm(name, state, opts)` | Expose a form as fill + optional submit tools |
| `registerTool(definition, opts?)` | Register a fully custom WebMCP tool |
| `isWebMCPSupported()` | Check whether the current browser supports WebMCP |
| `FieldSchema` | Per-field metadata type (`string` \| `number` \| `boolean`) |
| `ExposeDataOptions<T>` | Options type for `exposeData` |
| `DataTool` | Generated tool union type (`'search'` \| `'get'` \| `'add'` \| `'delete'` \| `'stats'`) |

## License

[MIT](./LICENSE) License © [bibibala](https://github.com/bibibala)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@bilibaba/ts-lab?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://www.npmjs.com/package/@bilibaba/ts-lab
[npm-downloads-src]: https://img.shields.io/npm/dm/@bilibaba/ts-lab?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://www.npmjs.com/package/@bilibaba/ts-lab
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@bilibaba/ts-lab?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@bilibaba/ts-lab
[license-src]: https://img.shields.io/github/license/bibibala/ts-lab.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/bibibala/ts-lab/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/@bilibaba/ts-lab
