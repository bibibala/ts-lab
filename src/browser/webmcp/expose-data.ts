import type { DataTool, ExposeDataOptions, FieldSchema, WebMCPToolDefinition } from './types'
import { errorResult, getModelContext, jsonResult, warnNotAvailable, warnRegistrationFailed } from './internal'

function resolveData<T>(data: T[] | (() => T[])): T[] {
  return typeof data === 'function' ? data() : data
}

const DEFAULT_TOOLS: DataTool[] = ['search', 'add', 'delete', 'stats']

function idSchema(idField: string): Record<string, { type: string, description: string }> {
  return { [idField]: { type: 'string', description: `Value of the ${idField} field` } }
}

/**
 * Expose an array as a set of WebMCP CRUD tools.
 *
 * Auto-generates the following tools (customisable via `options.tools`):
 *
 * | Tool              | Description                              |
 * |-------------------|------------------------------------------|
 * | `{name}_search`   | Fuzzy search + pagination                |
 * | `{name}_get`      | Lookup a single item by id (off by default) |
 * | `{name}_add`      | Append a new record                      |
 * | `{name}_delete`   | Delete by id                             |
 * | `{name}_stats`    | Summary statistics                       |
 *
 * @param name     Logical name, e.g. `'orders'` → tools named `orders_search` etc.
 * @param data     The source array, or a getter that always returns the latest data.
 * @param options  `idField`, `searchFields`, optional `fields` metadata, tool whitelist, `prefix`, `signal`.
 * @returns        `true` if WebMCP is available and tools were registered.
 *
 * @example
 * ```ts
 * exposeData('orders', ORDERS, {
 *   idField: 'id',
 *   searchFields: ['id', 'customer'],
 *   fields: {
 *     id:       { type: 'string', description: 'Order ID' },
 *     customer: { type: 'string', description: 'Customer name' },
 *     amount:   { type: 'number', description: 'Order amount' },
 *     status:   { type: 'string', description: 'Order status' },
 *   },
 * })
 * // → registers orders_search, orders_add, orders_delete, orders_stats
 * ```
 */
export function exposeData<T extends Record<string, unknown>>(
  name: string,
  data: T[] | (() => T[]),
  options: ExposeDataOptions<T>,
): boolean {
  const ctx = getModelContext()
  if (!ctx) {
    warnNotAvailable()
    return false
  }

  const { idField, searchFields, fields, prefix, signal } = options
  const tools = options.tools ?? DEFAULT_TOOLS
  const ns = prefix ?? name
  const id = String(idField)
  const fieldsMeta = fields ?? ({} as Record<string, FieldSchema>)
  const regOpts = signal != null ? { signal } : undefined

  const reg = (def: WebMCPToolDefinition): boolean => {
    try {
      ctx.registerTool(def, regOpts)
      return true
    }
    catch (e) {
      warnRegistrationFailed(def.name, e instanceof Error ? e.message : undefined)
      return false
    }
  }

  // --- search ---
  if (tools.includes('search')) {
    const sfStr = searchFields.map(String).join(', ')
    reg({
      name: `${ns}_search`,
      description: `Search ${name} by ${sfStr} (fuzzy match). Pass empty keyword to list all.`,
      inputSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: `Search keyword, matched against ${sfStr}` },
          page: { type: 'number', description: 'Page number, starting from 1 (default 1)' },
          pageSize: { type: 'number', description: 'Items per page (default 50)' },
        },
        required: ['keyword'],
      },
      execute: async (params) => {
        const { keyword = '', page = 1, pageSize = 50 } = params as Record<string, unknown>
        const kw = String(keyword)
        const list = resolveData(data)
        const filtered = kw
          ? list.filter(item =>
              searchFields.some(f => String(item[f] ?? '').includes(kw)),
            )
          : list
        const p = Math.max(1, Number(page))
        const ps = Math.max(1, Number(pageSize))
        const start = (p - 1) * ps
        return jsonResult({
          total: filtered.length,
          page: p,
          pageSize: ps,
          data: filtered.slice(start, start + ps),
        })
      },
    })
  }

  // --- get ---
  if (tools.includes('get')) {
    reg({
      name: `${ns}_get`,
      description: `Get a single ${name} by ${id}.`,
      inputSchema: { type: 'object', properties: idSchema(id), required: [id] },
      execute: async (params) => {
        const val = (params as Record<string, unknown>)[id]
        const item = resolveData(data).find(o => String(o[idField]) === String(val))
        return item ? jsonResult(item) : errorResult(`${name} ${val} not found`)
      },
    })
  }

  // --- add ---
  if (tools.includes('add')) {
    const props: Record<string, { type: string, description: string }> = {}
    const sample = resolveData(data)[0]
    if (sample) {
      for (const k of Object.keys(sample)) {
        if (k === id)
          continue
        const meta = fieldsMeta[k]
        props[k] = {
          type: meta?.type ?? (typeof sample[k] === 'number' ? 'number' : 'string'),
          description: meta?.description ?? k,
        }
      }
    }

    reg({
      name: `${ns}_add`,
      description: `Add a new ${name} record.`,
      inputSchema: { type: 'object', properties: props },
      execute: async (params) => {
        const record = params as Record<string, unknown>
        const source = resolveData(data) as Record<string, unknown>[]
        if (!(id in record) || record[id] == null || record[id] === '') {
          const maxId = source.reduce((max, o) => {
            const v = String(o[id] ?? '')
            const num = Number.parseInt(v.replace(/\D/g, ''), 10)
            return Number.isNaN(num) ? max : Math.max(max, num)
          }, 0)
          record[id] = `${ns.toUpperCase()}-${maxId + 1}`
        }
        for (const [k, v] of Object.entries(record)) {
          const meta = fieldsMeta[k]
          if (meta?.type === 'number' && typeof v === 'string') {
            record[k] = Number(v)
          }
        }
        source.push(record as T)
        return jsonResult(record)
      },
    })
  }

  // --- delete ---
  if (tools.includes('delete')) {
    reg({
      name: `${ns}_delete`,
      description: `Delete a ${name} by ${id}.`,
      inputSchema: { type: 'object', properties: idSchema(id), required: [id] },
      execute: async (params) => {
        const val = String((params as Record<string, unknown>)[id])
        const source = resolveData(data)
        const idx = source.findIndex(o => String(o[idField]) === val)
        if (idx === -1)
          return errorResult(`${name} ${val} not found`)
        const [removed] = source.splice(idx, 1)
        return jsonResult({ deleted: removed })
      },
    })
  }

  // --- stats ---
  if (tools.includes('stats')) {
    reg({
      name: `${ns}_stats`,
      description: `Get summary statistics for ${name} (total count, sum of numeric fields, distribution of string fields).`,
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        const list = resolveData(data)
        const totals: Record<string, number> = {}
        const distributions: Record<string, Record<string, number>> = {}

        for (const item of list) {
          for (const [k, v] of Object.entries(item)) {
            const meta = fieldsMeta[k]
            if (meta?.type === 'number' && typeof v === 'number') {
              totals[k] = (totals[k] ?? 0) + v
              continue
            }
            if (typeof v === 'string') {
              const dist = (distributions[k] ??= {})
              dist[v] = (dist[v] ?? 0) + 1
            }
          }
        }

        return jsonResult({ total: list.length, totals, distributions })
      },
    })
  }

  return true
}
