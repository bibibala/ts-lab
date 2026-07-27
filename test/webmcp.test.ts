import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The module caches getModelContext() checks at the top level,
// so we must set up the mock before importing.
let mockCtx: {
  registerTool: ReturnType<typeof vi.fn>
} | null

beforeEach(() => {
  mockCtx = { registerTool: vi.fn() }
  vi.stubGlobal('document', { modelContext: mockCtx })
  vi.stubGlobal('navigator', {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ==================== lazy import to allow beforeEach stub ====================

async function importWebmcp() {
  return await import('../src/browser/webmcp')
}

// ==================== isWebMCPSupported ====================

describe('isWebMCPSupported', () => {
  it('returns true when document.modelContext is present', async () => {
    const { isWebMCPSupported } = await importWebmcp()
    expect(isWebMCPSupported()).toBe(true)
  })

  it('returns false when modelContext is absent', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {})
    const { isWebMCPSupported } = await importWebmcp()
    expect(isWebMCPSupported()).toBe(false)
  })

  it('falls back to navigator.modelContext', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', { modelContext: mockCtx })
    const { isWebMCPSupported } = await importWebmcp()
    expect(isWebMCPSupported()).toBe(true)
  })
})

// ==================== registerTool ====================

describe('registerTool', () => {
  it('registers a tool and returns true', async () => {
    const { registerTool } = await importWebmcp()
    const result = registerTool({
      name: 'test',
      description: 'desc',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
    })
    expect(result).toBe(true)
    expect(mockCtx!.registerTool).toHaveBeenCalledTimes(1)
    expect(mockCtx!.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'test', description: 'desc' }),
      undefined,
    )
  })

  it('returns false when modelContext is missing', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {})
    const { registerTool } = await importWebmcp()
    const result = registerTool({
      name: 'test',
      description: 'desc',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ content: [{ type: 'text', text: '' }] }),
    })
    expect(result).toBe(false)
  })

  it('warns when modelContext is missing', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {})
    const { registerTool } = await importWebmcp()
    registerTool({
      name: 'test',
      description: 'desc',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ content: [{ type: 'text', text: '' }] }),
    })
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WebMCP is not available'),
    )
  })

  it('returns false when ctx.registerTool throws', async () => {
    mockCtx!.registerTool.mockImplementation(() => {
      throw new Error('Tool already registered')
    })
    const { registerTool } = await importWebmcp()
    const result = registerTool({
      name: 'dup',
      description: 'desc',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ content: [{ type: 'text', text: '' }] }),
    })
    expect(result).toBe(false)
  })

  it('warns when ctx.registerTool throws', async () => {
    mockCtx!.registerTool.mockImplementation(() => {
      throw new Error('Tool already registered')
    })
    const { registerTool } = await importWebmcp()
    registerTool({
      name: 'dup',
      description: 'desc',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ content: [{ type: 'text', text: '' }] }),
    })
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to register tool "dup"'),
    )
  })

  it('passes signal to ctx.registerTool', async () => {
    const { registerTool } = await importWebmcp()
    const ctrl = new AbortController()
    registerTool(
      {
        name: 'sig',
        description: 'desc',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => ({ content: [{ type: 'text', text: '' }] }),
      },
      { signal: ctrl.signal },
    )
    expect(mockCtx!.registerTool).toHaveBeenCalledWith(
      expect.any(Object),
      { signal: ctrl.signal },
    )
  })
})

// ==================== exposeFunction ====================

describe('exposeFunction', () => {
  it('registers a tool from a function', async () => {
    const { exposeFunction } = await importWebmcp()
    const fn = vi.fn().mockResolvedValue({ result: 42 })
    const result = exposeFunction('myFn', fn, {
      description: 'Test function',
      params: { x: { type: 'number', description: 'A number' } },
      required: ['x'],
    })
    expect(result).toBe(true)
    expect(mockCtx!.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'myFn',
        description: 'Test function',
        inputSchema: expect.objectContaining({
          properties: { x: { type: 'number', description: 'A number' } },
          required: ['x'],
        }),
      }),
      undefined,
    )
  })

  it('returns false when ctx is null', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {})
    const { exposeFunction } = await importWebmcp()
    const r = exposeFunction('f', async () => ({}), { description: 'd' })
    expect(r).toBe(false)
  })

  it('handles errors thrown inside the function gracefully', async () => {
    const { exposeFunction } = await importWebmcp()
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    exposeFunction('errFn', fn, { description: 'will throw' })

    // Grab the execute function that was passed to registerTool
    const call = mockCtx!.registerTool.mock.calls[0]![0]
    const result = await call.execute({})
    expect(result.content[0].text).toContain('boom')
  })

  it('passes signal through', async () => {
    const { exposeFunction } = await importWebmcp()
    const ctrl = new AbortController()
    exposeFunction('sigFn', async () => ({}), {
      description: 'd',
      signal: ctrl.signal,
    })
    expect(mockCtx!.registerTool).toHaveBeenCalledWith(
      expect.any(Object),
      { signal: ctrl.signal },
    )
  })
})

// ==================== exposeData ====================

interface Order {
  id: string
  customer: string
  amount: number
  status: string
  [key: string]: unknown
}

const ORDERS: Order[] = [
  { id: 'SO-1001', customer: 'Alice', amount: 1280, status: 'shipped' },
  { id: 'SO-1002', customer: 'Bob', amount: 560.5, status: 'pending' },
]

const OPTS = {
  idField: 'id' as const,
  searchFields: ['id', 'customer'],
  fields: {
    id: { type: 'string' as const, description: 'Order ID' },
    customer: { type: 'string' as const, description: 'Customer name' },
    amount: { type: 'number' as const, description: 'Order amount' },
    status: { type: 'string' as const, description: 'Order status' },
  },
}

function registeredNames(): string[] {
  return mockCtx!.registerTool.mock.calls.map((c: any) => c[0].name)
}

function findTool(name: string): any {
  return mockCtx!.registerTool.mock.calls.find((c: any) => c[0].name === name)?.[0]
}

describe('exposeData', () => {
  it('returns false when ctx is null', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {})
    const { exposeData } = await importWebmcp()
    const r = exposeData('orders', ORDERS, OPTS)
    expect(r).toBe(false)
  })

  it('warns when ctx is null', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {})
    const { exposeData } = await importWebmcp()
    exposeData('orders', ORDERS, OPTS)
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WebMCP is not available'),
    )
  })

  it('registers default tools (search, add, delete, stats)', async () => {
    const { exposeData } = await importWebmcp()
    exposeData('orders', ORDERS, OPTS)
    expect(registeredNames()).toEqual([
      'orders_search',
      'orders_add',
      'orders_delete',
      'orders_stats',
    ])
  })

  it('uses prefix when provided', async () => {
    const { exposeData } = await importWebmcp()
    exposeData('orders', ORDERS, { ...OPTS, prefix: 'ord' })
    expect(registeredNames()[0]).toBe('ord_search')
  })

  it('uses custom tools whitelist', async () => {
    const { exposeData } = await importWebmcp()
    exposeData('orders', ORDERS, { ...OPTS, tools: ['search', 'stats'] })
    expect(registeredNames()).toEqual(['orders_search', 'orders_stats'])
  })

  it('includes get tool when requested', async () => {
    const { exposeData } = await importWebmcp()
    exposeData('orders', ORDERS, { ...OPTS, tools: ['get'] })
    expect(registeredNames()).toEqual(['orders_get'])
  })

  it('supports getter data source', async () => {
    const { exposeData } = await importWebmcp()
    const snapshot = [...ORDERS]
    exposeData('orders', () => snapshot, OPTS)

    const searchTool = findTool('orders_search')
    snapshot.push({ id: 'SO-1003', customer: 'Carol', amount: 99, status: 'pending' })

    const result = await searchTool.execute({ keyword: '' })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.total).toBe(3)
  })

  // --- search tool ---

  describe('search tool', () => {
    it('returns all data when keyword is empty', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('orders', ORDERS, OPTS)
      const tool = findTool('orders_search')
      const result = await tool.execute({ keyword: '' })
      const { total, data } = JSON.parse(result.content[0].text)
      expect(total).toBe(2)
      expect(data).toHaveLength(2)
    })

    it('filters by keyword across searchFields', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('orders', ORDERS, OPTS)
      const tool = findTool('orders_search')
      const r1 = await tool.execute({ keyword: 'Alice' })
      expect(JSON.parse(r1.content[0].text).total).toBe(1)

      const r2 = await tool.execute({ keyword: 'SO-1001' })
      expect(JSON.parse(r2.content[0].text).total).toBe(1)

      const r3 = await tool.execute({ keyword: 'nonexistent' })
      expect(JSON.parse(r3.content[0].text).total).toBe(0)
    })

    it('supports pagination', async () => {
      const { exposeData } = await importWebmcp()
      const manyOrders: Order[] = Array.from({ length: 25 }, (_, i) => ({
        id: `SO-${1000 + i}`,
        customer: `User${i}`,
        amount: 10 + i,
        status: 'pending',
      }))
      exposeData('orders', manyOrders, OPTS)
      const tool = findTool('orders_search')
      const r = await tool.execute({ keyword: '', page: 2, pageSize: 10 })
      const { total, page, data } = JSON.parse(r.content[0].text)
      expect(total).toBe(25)
      expect(page).toBe(2)
      expect(data).toHaveLength(10)
      expect(data[0].id).toBe('SO-1010')
    })
  })

  // --- add tool ---

  describe('add tool', () => {
    it('appends a new record and returns it', async () => {
      const { exposeData } = await importWebmcp()
      const source: Order[] = [...ORDERS]
      exposeData('orders', source, OPTS)
      const tool = findTool('orders_add')
      const r = await tool.execute({ customer: 'Carol', amount: 999, status: 'pending' })
      const added = JSON.parse(r.content[0].text)
      expect(added.customer).toBe('Carol')
      expect(added.amount).toBe(999)
      expect(added.id).toBe('ORDERS-1003')
      expect(source).toHaveLength(3)
    })

    it('auto-infers numeric id from existing data', async () => {
      const { exposeData } = await importWebmcp()
      const source: Order[] = [{ id: 'X-42', customer: 'A', amount: 1, status: 'ok' }]
      exposeData('orders', source, OPTS)
      const tool = findTool('orders_add')
      const r = await tool.execute({ customer: 'B' })
      const added = JSON.parse(r.content[0].text)
      expect(added.id).toBe('ORDERS-43')
    })

    it('auto-casts string to number for numeric fields', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('orders', [...ORDERS], OPTS)
      const tool = findTool('orders_add')
      const r = await tool.execute({ customer: 'D', amount: '777' })
      const added = JSON.parse(r.content[0].text)
      expect(added.amount).toBe(777)
      expect(typeof added.amount).toBe('number')
    })
  })

  // --- delete tool ---

  describe('delete tool', () => {
    it('removes by id', async () => {
      const { exposeData } = await importWebmcp()
      const source = [...ORDERS]
      exposeData('orders', source, OPTS)
      const tool = findTool('orders_delete')
      const r = await tool.execute({ id: 'SO-1001' })
      const { deleted } = JSON.parse(r.content[0].text)
      expect(deleted.id).toBe('SO-1001')
      expect(source).toHaveLength(1)
    })

    it('returns error when id not found', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('orders', [...ORDERS], OPTS)
      const tool = findTool('orders_delete')
      const r = await tool.execute({ id: 'NOPE' })
      expect(r.content[0].text).toContain('not found')
    })
  })

  // --- stats tool ---

  describe('stats tool', () => {
    it('returns total count and numeric field totals', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('orders', ORDERS, OPTS)
      const tool = findTool('orders_stats')
      const r = await tool.execute({})
      const { total, totals, distributions } = JSON.parse(r.content[0].text)
      expect(total).toBe(2)
      expect(totals.amount).toBe(1280 + 560.5)
      // amount is numeric → not in distributions
      expect(distributions.amount).toBeUndefined()
      expect(distributions.status).toEqual({ shipped: 1, pending: 1 })
    })
  })

  // --- get tool ---

  describe('get tool', () => {
    it('returns a single item by id', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('orders', ORDERS, { ...OPTS, tools: ['get'] })
      const tool = findTool('orders_get')
      const r = await tool.execute({ id: 'SO-1002' })
      const item = JSON.parse(r.content[0].text)
      expect(item.customer).toBe('Bob')
    })

    it('returns error when not found', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('orders', ORDERS, { ...OPTS, tools: ['get'] })
      const tool = findTool('orders_get')
      const r = await tool.execute({ id: 'NOPE' })
      expect(r.content[0].text).toContain('not found')
    })
  })

  // --- fields type inference (bug #1 regression) ---

  describe('type inference', () => {
    it('respects explicit field type from fields meta (#1)', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('x', [{ id: '1', flag: true }], {
        idField: 'id',
        searchFields: ['id'],
        fields: { flag: { type: 'boolean', description: 'A flag' } },
      })
      const tool = findTool('x_add')
      expect(tool.inputSchema.properties.flag.type).toBe('boolean')
    })

    it('infers string type for string fields without meta', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('x', [{ id: '1', name: 'hello' }], {
        idField: 'id',
        searchFields: ['id'],
      })
      const tool = findTool('x_add')
      expect(tool.inputSchema.properties.name.type).toBe('string')
    })

    it('infers number type for numeric fields without meta', async () => {
      const { exposeData } = await importWebmcp()
      exposeData('x', [{ id: '1', price: 99.9 }], {
        idField: 'id',
        searchFields: ['id'],
      })
      const tool = findTool('x_add')
      expect(tool.inputSchema.properties.price.type).toBe('number')
    })
  })

  // --- signal forwarding ---

  it('passes signal to all registered tools', async () => {
    const { exposeData } = await importWebmcp()
    const ctrl = new AbortController()
    exposeData('orders', ORDERS, { ...OPTS, signal: ctrl.signal, tools: ['search'] })
    expect(mockCtx!.registerTool).toHaveBeenCalledWith(
      expect.any(Object),
      { signal: ctrl.signal },
    )
  })
})

// ==================== exposeAction ====================

describe('exposeAction', () => {
  it('registers a tool from an async void function', async () => {
    const { exposeAction } = await importWebmcp()
    let called = false
    const r = exposeAction('toggle', async () => {
      called = true
    }, {
      description: 'Toggle something',
    })
    expect(r).toBe(true)
    expect(mockCtx!.registerTool).toHaveBeenCalledTimes(1)

    const def = mockCtx!.registerTool.mock.calls[0]![0]
    const result = await def.execute({})
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.done).toBe(true)
    expect(called).toBe(true)
  })

  it('passes params through to the function', async () => {
    const { exposeAction } = await importWebmcp()
    const fn = vi.fn()
    exposeAction('nav', fn, {
      description: 'Navigate',
      params: { tab: { type: 'string', description: 'Tab name' } },
      required: ['tab'],
    })
    const def = mockCtx!.registerTool.mock.calls[0]![0]
    await def.execute({ tab: 'settings' })
    expect(fn).toHaveBeenCalledWith({ tab: 'settings' })
  })

  it('returns false when ctx is null', async () => {
    vi.stubGlobal('document', {})
    vi.stubGlobal('navigator', {})
    const { exposeAction } = await importWebmcp()
    const r = exposeAction('x', async () => {}, { description: 'd' })
    expect(r).toBe(false)
  })

  it('passes signal through', async () => {
    const { exposeAction } = await importWebmcp()
    const ctrl = new AbortController()
    exposeAction('sig', async () => {}, {
      description: 'd',
      signal: ctrl.signal,
    })
    expect(mockCtx!.registerTool).toHaveBeenCalledWith(
      expect.any(Object),
      { signal: ctrl.signal },
    )
  })
})

// ==================== exposeForm ====================

interface InvoiceForm {
  customer: string
  amount: number
  taxRate: number
  [key: string]: unknown
}

describe('exposeForm', () => {
  it('registers a _fill tool only when allowSubmit is false', async () => {
    const { exposeForm } = await importWebmcp()
    const form: InvoiceForm = { customer: '', amount: 0, taxRate: 0 }
    exposeForm('invoiceForm', form, {
      description: 'Fill invoice',
      fields: {
        customer: { type: 'string', description: 'Customer' },
        amount: { type: 'number', description: 'Amount' },
        taxRate: { type: 'number', description: 'Tax rate' },
      },
    })
    expect(registeredNames()).toEqual(['invoiceForm_fill'])
  })

  it('registers both _fill and _submit when allowSubmit is true', async () => {
    const { exposeForm } = await importWebmcp()
    const form: InvoiceForm = { customer: '', amount: 0, taxRate: 0 }
    exposeForm('invoiceForm', form, {
      description: 'Fill invoice',
      fields: {
        customer: { type: 'string', description: 'Customer' },
        amount: { type: 'number', description: 'Amount' },
        taxRate: { type: 'number', description: 'Tax rate' },
      },
      allowSubmit: true,
    })
    expect(registeredNames()).toEqual(['invoiceForm_fill', 'invoiceForm_submit'])
  })

  it('fill tool mutates the reactive form object', async () => {
    const { exposeForm } = await importWebmcp()
    const form: InvoiceForm = { customer: '', amount: 0, taxRate: 0 }
    exposeForm('invoiceForm', form, {
      description: 'Fill invoice',
      fields: {
        customer: { type: 'string', description: 'Customer' },
        amount: { type: 'number', description: 'Amount' },
        taxRate: { type: 'number', description: 'Tax rate' },
      },
    })
    const fillTool = findTool('invoiceForm_fill')
    const r = await fillTool.execute({ customer: 'Acme', amount: 5000 })
    const parsed = JSON.parse(r.content[0].text)
    expect(parsed.filled).toBe(true)
    expect(parsed.current.customer).toBe('Acme')
    expect(parsed.current.amount).toBe(5000)
    expect(form.customer).toBe('Acme')
    expect(form.amount).toBe(5000)
  })

  it('fill tool preserves fields not passed', async () => {
    const { exposeForm } = await importWebmcp()
    const form: InvoiceForm = { customer: 'Pre', amount: 10, taxRate: 0.06 }
    exposeForm('invoiceForm', form, {
      description: 'Fill invoice',
      fields: {
        customer: { type: 'string', description: 'Customer' },
        amount: { type: 'number', description: 'Amount' },
        taxRate: { type: 'number', description: 'Tax rate' },
      },
    })
    const fillTool = findTool('invoiceForm_fill')
    await fillTool.execute({ customer: 'Post' })
    expect(form.customer).toBe('Post')
    expect(form.amount).toBe(10)
    expect(form.taxRate).toBe(0.06)
  })

  it('submit tool calls onSubmit callback', async () => {
    const { exposeForm } = await importWebmcp()
    const form: InvoiceForm = { customer: '', amount: 0, taxRate: 0 }
    const onSubmit = vi.fn()
    exposeForm('invoiceForm', form, {
      description: 'Fill invoice',
      fields: { customer: { type: 'string', description: 'C' } },
      allowSubmit: true,
      onSubmit,
    })
    const submitTool = findTool('invoiceForm_submit')
    const r = await submitTool.execute({})
    const parsed = JSON.parse(r.content[0].text)
    expect(parsed.submitted).toBe(true)
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('respects required fields in inputSchema', async () => {
    const { exposeForm } = await importWebmcp()
    const form: InvoiceForm = { customer: '', amount: 0, taxRate: 0 }
    exposeForm('invoiceForm', form, {
      description: 'Fill invoice',
      fields: {
        customer: { type: 'string', description: 'Customer' },
        amount: { type: 'number', description: 'Amount' },
      },
      required: ['customer'],
    })
    const fillTool = findTool('invoiceForm_fill')
    expect(fillTool.inputSchema.required).toEqual(['customer'])
  })
})
