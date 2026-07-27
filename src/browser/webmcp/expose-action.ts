import type { FieldSchema } from './types'
import { exposeFunction } from './expose-function'

/**
 * Expose a UI action (open a dialog, toggle a panel, switch a tab, etc.)
 * as a WebMCP tool. Unlike {@link exposeFunction}, this does not return
 * business data — the result is a simple `{ done: true }` confirmation
 * that the UI state has changed.
 *
 * @example
 * ```ts
 * const dialogOpen = ref(false)
 *
 * exposeAction('openInvoiceDialog', async () => {
 *   dialogOpen.value = true
 * }, { description: 'Open the create-invoice dialog' })
 * ```
 */
export function exposeAction<T extends Record<string, unknown> = Record<string, never>>(
  name: string,
  fn: (params: T) => Promise<void>,
  opts: {
    description: string
    params?: Record<string, FieldSchema>
    required?: string[]
    signal?: AbortSignal
  },
): boolean {
  return exposeFunction(name, async (params: T) => {
    await fn(params)
    return { done: true }
  }, opts)
}
