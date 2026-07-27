import type { WebMCPToolDefinition } from './types'
import { getModelContext, warnNotAvailable, warnRegistrationFailed } from './internal'

/**
 * Register a single WebMCP tool. Returns `true` on success, `false` if WebMCP is
 * unavailable or registration fails (e.g. duplicate tool name).
 *
 * Prints a console warning when registration fails so the developer knows
 * to enable the required Chrome flags.
 *
 * Pass `signal` to auto-unregister — useful in Vue/React components:
 *
 * ```ts
 * const controller = new AbortController()
 * registerTool({ name: 'myTool', ... }, { signal: controller.signal })
 * // onUnmounted / useEffect cleanup: controller.abort()
 * ```
 */
export function registerTool<T = Record<string, unknown>>(
  definition: WebMCPToolDefinition<T>,
  opts?: { signal?: AbortSignal },
): boolean {
  const ctx = getModelContext()
  if (!ctx) {
    warnNotAvailable()
    return false
  }
  try {
    ctx.registerTool(definition as WebMCPToolDefinition, opts)
    return true
  }
  catch (e) {
    warnRegistrationFailed(definition.name, e instanceof Error ? e.message : undefined)
    return false
  }
}
