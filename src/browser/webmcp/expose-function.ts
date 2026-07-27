import type { FieldSchema, WebMCPInputSchema } from './types'
import { errorResult, jsonResult } from './internal'
import { registerTool } from './register'

/**
 * Expose a single async function as a WebMCP tool with minimal boilerplate.
 *
 * @example
 * ```ts
 * exposeFunction('greet', async ({ name }: { name: string }) => {
 *   return { greeting: `Hello, ${name}!` }
 * }, {
 *   description: 'Say hello',
 *   params: { name: { type: 'string', description: 'Your name' } },
 *   required: ['name'],
 * })
 * ```
 */
export function exposeFunction<T extends Record<string, unknown>>(
  name: string,
  fn: (params: T) => Promise<unknown>,
  opts: {
    description: string
    params?: Record<string, FieldSchema>
    required?: string[]
    signal?: AbortSignal
  },
): boolean {
  const schema: WebMCPInputSchema = {
    type: 'object',
    properties: opts.params ?? {},
    ...(opts.required?.length ? { required: opts.required } : {}),
  }

  return registerTool(
    {
      name,
      description: opts.description,
      inputSchema: schema,
      execute: async (params: T) => {
        try {
          const data = await fn(params)
          return jsonResult(data)
        }
        catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e))
        }
      },
    },
    opts.signal != null ? { signal: opts.signal } : undefined,
  )
}
