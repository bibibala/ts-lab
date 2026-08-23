<script setup>
import { onMounted, ref } from 'vue'
import { isWebMCPSupported } from '@bilibaba/ts-lab/browser'

const supported = ref(null)

onMounted(() => { supported.value = isWebMCPSupported() })
</script>

<style>
.wm-demo {
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  padding: 16px 20px; margin: 16px 0 24px; background: var(--vp-c-bg-soft);
}
.wm-status { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.wm-hint { font-size: 12px; color: var(--vp-c-text-3); margin-top: 8px; }
</style>

<ClientOnly>
  <div class="wm-demo">
    <div v-if="supported !== null" class="wm-status">
      <span v-if="supported" style="color:#22c55e">✓ WebMCP is supported</span>
      <span v-else style="color:#ef4444">✗ WebMCP is not available</span>
    </div>
    <div class="wm-hint">
      Requires Chrome 149+ with chrome://flags/#webmcp and chrome://flags/#devtools-webmcp-support enabled
    </div>
  </div>
</ClientOnly>

---

# WebMCP · AI Tool Registration

Based on [document.modelContext](https://developer.mozilla.org/en-US/docs/Web/API/Document/modelContext) (Chrome 149+)

Expose page data as WebMCP tools so AI Agents (via `chrome-devtools-mcp`) can discover and invoke them.

## Type Exports

```ts
export type {
  DataTool,              // 'search' | 'get' | 'add' | 'delete' | 'stats'
  ExposeDataOptions,     // Options for exposeData
  ExposeFormOptions,     // Options for exposeForm
  FieldSchema,           // Field metadata { type, description }
  ToolError,             // Error return { error: string }
  WebMCPContentBlock,    // { type: 'text', text: string }
  WebMCPExecuteResult,   // { content: WebMCPContentBlock[] }
  WebMCPInputSchema,     // { type: 'object', properties, required? }
  WebMCPModelContext,    // Type definition for document.modelContext
  WebMCPToolDefinition,  // Full tool definition { name, description, inputSchema, execute }
} from '@bilibaba/ts-lab/browser'
```

::: warning Prerequisites
Requires **Chrome 149+** with the following flags enabled:
- [chrome://flags/#webmcp](chrome://flags/#webmcp)
- [chrome://flags/#devtools-webmcp-support](chrome://flags/#devtools-webmcp-support)
:::

## isWebMCPSupported

Check if the current browser supports WebMCP.

```ts
import { isWebMCPSupported } from '@bilibaba/ts-lab/browser'

if (isWebMCPSupported()) {
  // Can register tools
}
```

All registration functions print a warning and return `false` when WebMCP is unavailable, so you can safely call them in production code without pre-checking.

---

## exposeData

Expose array data as CRUD tools with support for dynamic data sources.

```ts
function exposeData<T extends Record<string, unknown>>(
  name: string,
  data: T[] | (() => T[]),
  options: ExposeDataOptions<T>,
): boolean
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Logical name, e.g. `'orders'` → tool names become `orders_search` |
| `data` | `T[] \| (() => T[])` | Source array, or a getter function returning the latest array |
| `options` | `ExposeDataOptions<T>` | Configuration options |

**Return value:** `boolean` — `true` on success, `false` if WebMCP is unavailable or registration failed.

### ExposeDataOptions

```ts
interface ExposeDataOptions<T> {
  /** Primary key field name (required) */
  idField: keyof T
  /** Fields for full-text search matching (required) */
  searchFields: (keyof T)[]
  /** Field metadata (optional), generates richer inputSchema */
  fields?: Record<string, FieldSchema>
  /** Which tools to generate, defaults to ['search', 'add', 'delete', 'stats'] */
  tools?: DataTool[]
  /** Tool name prefix, defaults to the name parameter */
  prefix?: string
  /** AbortSignal; abort automatically unregisters all tools */
  signal?: AbortSignal
}
```

### Auto-Generated Tools

| Tool | Default | Description |
|------|:-------:|-------------|
| `{name}_search` | ✅ | Fuzzy search + pagination; empty keyword returns all |
| `{name}_get` | ❌ | Find a single record by id |
| `{name}_add` | ✅ | Add record (auto-generates id if not provided) |
| `{name}_delete` | ✅ | Delete by id |
| `{name}_stats` | ✅ | Aggregate stats (total count, numeric field sums, string field distributions) |

### Basic Example

```ts
import { exposeData } from '@bilibaba/ts-lab/browser'

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
// → Registers: orders_search, orders_add, orders_delete, orders_stats
```

### Dynamic Data Source (getter)

When data is driven by external state management (e.g. Vue ref / React state), pass a getter function to ensure the AI always operates on the latest data:

```ts
const orders = ref([...])

exposeData('orders', () => orders.value, {
  idField: 'id',
  searchFields: ['id', 'customer'],
})
```

### Custom Tool Set

```ts
// Only expose query tools, disable add/delete
exposeData('orders', ORDERS, {
  idField: 'id',
  searchFields: ['id'],
  tools: ['search', 'get', 'stats'],
})
```

### Custom Prefix

```ts
exposeData('orders', ORDERS, {
  idField: 'id',
  searchFields: ['id'],
  prefix: 'sales',
})
// → Tool names: sales_search, sales_add, ...
```

---

## exposeFunction

Expose a single async function as a WebMCP tool. Automatically handles exceptions and returns `{ error }` format.

```ts
function exposeFunction<T extends Record<string, unknown>>(
  name: string,
  fn: (params: T) => Promise<unknown>,
  opts: {
    description: string
    params?: Record<string, FieldSchema>
    required?: string[]
    signal?: AbortSignal
  },
): boolean
```

**Return value:** `boolean`.

```ts
import { exposeFunction } from '@bilibaba/ts-lab/browser'

exposeFunction('greet', async ({ name }: { name: string }) => {
  return { greeting: `Hello, ${name}!` }
}, {
  description: 'Say hello',
  params: { name: { type: 'string', description: 'Your name' } },
  required: ['name'],
})
```

Exceptions are automatically caught and returned as `{ error: '...' }`, without interrupting the Agent call chain.

---

## exposeAction

Expose UI actions (modal dialogs, tab switches, panel toggles, etc.). Internally calls `exposeFunction`, with the return value fixed to `{ done: true }`.

```ts
function exposeAction<T extends Record<string, unknown> = Record<string, never>>(
  name: string,
  fn: (params: T) => Promise<void>,
  opts: {
    description: string
    params?: Record<string, FieldSchema>
    required?: string[]
    signal?: AbortSignal
  },
): boolean
```

**Return value:** `boolean`.

```ts
import { exposeAction } from '@bilibaba/ts-lab/browser'
import { ref } from 'vue'

const dialogOpen = ref(false)

exposeAction('openInvoiceDialog', async () => {
  dialogOpen.value = true
}, { description: 'Open the create-invoice dialog' })

exposeAction('closeInvoiceDialog', async () => {
  dialogOpen.value = false
}, { description: 'Close the create-invoice dialog' })
```

---

## exposeForm

Expose a reactive form as `fill` + optional `submit` tools.

```ts
function exposeForm<T extends Record<string, unknown>>(
  name: string,
  formState: T,
  options: ExposeFormOptions,
): boolean
```

**Return value:** `boolean`.

### ExposeFormOptions

```ts
interface ExposeFormOptions {
  /** Tool description (shown to AI Agent) */
  description: string
  /** Field metadata */
  fields: Record<string, FieldSchema>
  /** Required fields */
  required?: string[]
  /** Whether to allow AI to submit directly, defaults to false */
  allowSubmit?: boolean
  /** Callback on submit */
  onSubmit?: () => Promise<void> | void
}
```

### Example

```ts
import { exposeForm } from '@bilibaba/ts-lab/browser'
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
  allowSubmit: true,
  onSubmit: () => submitInvoice(form),
})
// → Registers: invoiceForm_fill, invoiceForm_submit
```

::: danger Security Note
`allowSubmit` defaults to `false`. Only enable it for low-risk forms (no financial transactions, no irreversible data deletion). AI Agents can bypass client-side validation and submit directly.
:::

---

## registerTool

Fully custom registration, for scenarios not covered by the higher-level APIs above.

```ts
function registerTool<T = Record<string, unknown>>(
  definition: WebMCPToolDefinition<T>,
  opts?: { signal?: AbortSignal },
): boolean
```

**Return value:** `boolean`.

```ts
import { registerTool } from '@bilibaba/ts-lab/browser'

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

## Lifecycle Management

Use `AbortSignal` to automatically clean up all registered tools when a component unmounts:

```ts
// Vue 3
const controller = new AbortController()
onMounted(() => {
  exposeData('orders', ORDERS, {
    idField: 'id',
    searchFields: ['id', 'customer'],
    signal: controller.signal,
  })
})
onUnmounted(() => controller.abort())

// React
useEffect(() => {
  const ctrl = new AbortController()
  exposeData('orders', ORDERS, {
    idField: 'id',
    searchFields: ['id', 'customer'],
    signal: ctrl.signal,
  })
  return () => ctrl.abort()
}, [])
```
