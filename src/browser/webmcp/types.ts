/**
 * Describes a single field for generating inputSchema.
 */
export interface FieldSchema {
  type: 'string' | 'number' | 'boolean'
  description: string
}

/**
 * WebMCP tool input schema — describes the parameters a tool expects.
 */
export interface WebMCPInputSchema {
  type: 'object'
  properties: Record<string, { type: string, description: string }>
  required?: string[]
}

/**
 * A single content block in the tool response.
 */
export interface WebMCPContentBlock {
  type: 'text'
  text: string
}

/**
 * Return value of a WebMCP tool's execute handler.
 */
export interface WebMCPExecuteResult {
  content: WebMCPContentBlock[]
}

/**
 * Raw tool definition matching Chrome's document.modelContext.registerTool shape.
 */
export interface WebMCPToolDefinition<T = Record<string, unknown>> {
  name: string
  description: string
  inputSchema: WebMCPInputSchema
  execute: (params: T) => Promise<WebMCPExecuteResult>
}

/**
 * Minimal modelContext interface we rely on.
 *
 * `registerTool` accepts an optional AbortSignal — aborting the signal
 * unregisters the tool (the modern replacement for the deprecated `unregisterTool`).
 */
export interface WebMCPModelContext {
  registerTool: (definition: WebMCPToolDefinition, opts?: { signal?: AbortSignal }) => void
}

/**
 * Which CRUD tools to auto-generate for `exposeData`.
 *
 * @default ['search', 'add', 'delete', 'stats']
 */
export type DataTool = 'search' | 'get' | 'add' | 'delete' | 'stats'

/**
 * Options for {@link exposeData}.
 */
export interface ExposeDataOptions<T extends Record<string, unknown>> {
  /** Primary key field name. */
  idField: keyof T
  /** Fields used for text search. */
  searchFields: (keyof T)[]
  /** Optional field metadata — used to generate richer inputSchema descriptions. */
  fields?: Record<string, FieldSchema>
  /** Which tools to generate (default: all except `'get'`). */
  tools?: DataTool[]
  /** Emitted tool names use this prefix instead of the data name. */
  prefix?: string
  /**
   * Optional AbortSignal. When the signal is aborted, all registered tools
   * are automatically unregistered. Use with `AbortController` in Vue/React:
   *
   * ```ts
   * const controller = new AbortController()
   * exposeData('orders', ORDERS, { idField: 'id', searchFields: ['id'], signal: controller.signal })
   * // later: controller.abort() → all tools unregistered
   * ```
   */
  signal?: AbortSignal
}

/**
 * Serialisable error shape returned by tools on failure.
 */
export interface ToolError {
  error: string
}

/**
 * Options for {@link exposeForm}.
 */
export interface ExposeFormOptions {
  /** Tool description shown to the AI agent. */
  description: string
  /** Per-field metadata for generating inputSchema. */
  fields: Record<string, FieldSchema>
  /** Which fields are mandatory when filling the form. */
  required?: string[]
  /**
   * Whether the AI agent is allowed to submit the form directly.
   * Defaults to `false` — the human must click the submit button.
   * Set to `true` for low-risk operations where auto-submit is acceptable.
   */
  allowSubmit?: boolean
  /** Called when the AI agent (or exposeForm) triggers a submit. */
  onSubmit?: () => Promise<void> | void
}
