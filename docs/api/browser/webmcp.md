<script setup>
import { onMounted, ref } from 'vue'
import { isWebMCPSupported } from '@bilibaba/ts-lab'

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
      <span v-if="supported" style="color:#22c55e">✓ WebMCP 已支持</span>
      <span v-else style="color:#ef4444">✗ WebMCP 不可用</span>
    </div>
    <div class="wm-hint">
      需要 Chrome 149+ 并开启 chrome://flags/#webmcp 和 chrome://flags/#devtools-webmcp-support
    </div>
  </div>
</ClientOnly>

---

# WebMCP · AI 工具注册

基于 [document.modelContext](https://developer.mozilla.org/en-US/docs/Web/API/Document/modelContext)（Chrome 149+）

将页面数据暴露为 WebMCP 工具，使 AI Agent（通过 `chrome-devtools-mcp`）能够发现并调用。

## 类型导出

```ts
export type {
  DataTool,              // 'search' | 'get' | 'add' | 'delete' | 'stats'
  ExposeDataOptions,     // exposeData 的配置项
  ExposeFormOptions,     // exposeForm 的配置项
  FieldSchema,           // 字段元数据 { type, description }
  ToolError,             // 工具错误返回 { error: string }
  WebMCPContentBlock,    // { type: 'text', text: string }
  WebMCPExecuteResult,   // { content: WebMCPContentBlock[] }
  WebMCPInputSchema,     // { type: 'object', properties, required? }
  WebMCPModelContext,    // document.modelContext 的类型定义
  WebMCPToolDefinition,  // 完整工具定义 { name, description, inputSchema, execute }
} from '@bilibaba/ts-lab'
```

::: warning 前置条件
需要 **Chrome 149+** 并开启：
- [chrome://flags/#webmcp](chrome://flags/#webmcp)
- [chrome://flags/#devtools-webmcp-support](chrome://flags/#devtools-webmcp-support)
:::

## isWebMCPSupported

检查当前浏览器是否支持 WebMCP。

```ts
import { isWebMCPSupported } from '@bilibaba/ts-lab'

if (isWebMCPSupported()) {
  // 可以注册工具
}
```

所有注册函数在 WebMCP 不可用时都会打印警告并返回 `false`，因此在生产代码中可以安全调用而无需预先检查。

---

## exposeData

将数组数据暴露为 CRUD 工具，支持动态数据源。

```ts
function exposeData<T extends Record<string, unknown>>(
  name: string,
  data: T[] | (() => T[]),
  options: ExposeDataOptions<T>,
): boolean
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 逻辑名称，如 `'orders'` → 工具名为 `orders_search` |
| `data` | `T[] \| (() => T[])` | 源数组，或返回最新数组的 getter 函数 |
| `options` | `ExposeDataOptions<T>` | 配置项 |

**返回值：** `boolean` — 注册成功返回 `true`，WebMCP 不可用或注册失败返回 `false`。

### ExposeDataOptions

```ts
interface ExposeDataOptions<T> {
  /** 主键字段名（必填） */
  idField: keyof T
  /** 全文搜索匹配的字段（必填） */
  searchFields: (keyof T)[]
  /** 字段元数据（可选），用于生成更丰富的 inputSchema */
  fields?: Record<string, FieldSchema>
  /** 要生成哪些工具，默认 ['search', 'add', 'delete', 'stats'] */
  tools?: DataTool[]
  /** 工具名前缀，默认使用 name 参数 */
  prefix?: string
  /** AbortSignal，abort 时自动注销所有工具 */
  signal?: AbortSignal
}
```

### 自动生成的工具

| 工具 | 默认启用 | 说明 |
|------|:------:|------|
| `{name}_search` | ✅ | 模糊搜索 + 分页，空关键词返回全部 |
| `{name}_get` | ❌ | 按 id 查找单条记录 |
| `{name}_add` | ✅ | 新增记录（不提供 id 时自动生成） |
| `{name}_delete` | ✅ | 按 id 删除 |
| `{name}_stats` | ✅ | 汇总统计（总数、数值字段求和、字符串字段分布） |

### 基本示例

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
// → 注册：orders_search, orders_add, orders_delete, orders_stats
```

### 动态数据源（getter）

当数据由外部状态管理（如 Vue ref / React state）驱动时，传入 getter 函数确保 AI 始终操作最新数据：

```ts
const orders = ref([...])

exposeData('orders', () => orders.value, {
  idField: 'id',
  searchFields: ['id', 'customer'],
})
```

### 自定义工具集

```ts
// 只暴露查询类工具，禁止增删
exposeData('orders', ORDERS, {
  idField: 'id',
  searchFields: ['id'],
  tools: ['search', 'get', 'stats'],
})
```

### 自定义前缀

```ts
exposeData('orders', ORDERS, {
  idField: 'id',
  searchFields: ['id'],
  prefix: 'sales',
})
// → 工具名：sales_search, sales_add, ...
```

---

## exposeFunction

将单个异步函数暴露为 WebMCP 工具。自动处理异常并返回 `{ error }` 格式。

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

**返回值：** `boolean`。

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

异常会被自动捕获并以 `{ error: '...' }` 返回，不会中断 Agent 调用链。

---

## exposeAction

暴露 UI 操作（弹窗、Tab 切换、面板展开等）。内部调用 `exposeFunction`，返回值固定为 `{ done: true }`。

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

**返回值：** `boolean`。

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

---

## exposeForm

将响应式表单暴露为 `fill` + 可选 `submit` 工具。

```ts
function exposeForm<T extends Record<string, unknown>>(
  name: string,
  formState: T,
  options: ExposeFormOptions,
): boolean
```

**返回值：** `boolean`。

### ExposeFormOptions

```ts
interface ExposeFormOptions {
  /** 工具描述（展示给 AI Agent） */
  description: string
  /** 字段元数据 */
  fields: Record<string, FieldSchema>
  /** 必填字段 */
  required?: string[]
  /** 是否允许 AI 直接提交，默认 false */
  allowSubmit?: boolean
  /** 提交时回调 */
  onSubmit?: () => Promise<void> | void
}
```

### 示例

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
  allowSubmit: true,
  onSubmit: () => submitInvoice(form),
})
// → 注册：invoiceForm_fill, invoiceForm_submit
```

::: danger 安全提示
`allowSubmit` 默认为 `false`。仅在低风险表单（无资金变动、数据不可逆删除）时才开启。AI Agent 可跳过客户端校验直接提交。
:::

---

## registerTool

完全自定义注册，适用于上面高层 API 无法覆盖的场景。

```ts
function registerTool<T = Record<string, unknown>>(
  definition: WebMCPToolDefinition<T>,
  opts?: { signal?: AbortSignal },
): boolean
```

**返回值：** `boolean`。

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

## 生命周期管理

通过 `AbortSignal` 在组件卸载时自动清理所有注册的工具：

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
