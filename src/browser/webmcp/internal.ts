import type { ToolError, WebMCPModelContext } from './types'

export function getModelContext(): WebMCPModelContext | null {
  if (typeof document !== 'undefined' && 'modelContext' in document) {
    return (document as unknown as Record<string, unknown>).modelContext as WebMCPModelContext
  }
  if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
    return (navigator as unknown as Record<string, unknown>).modelContext as WebMCPModelContext
  }
  return null
}

export function isWebMCPSupported(): boolean {
  return getModelContext() !== null
}

export function warnNotAvailable(): void {
  console.warn(
    '[webmcp] WebMCP is not available. '
    + 'Requires Chrome 149+ with chrome://flags/#webmcp and chrome://flags/#devtools-webmcp-support enabled.',
  )
}

export function warnRegistrationFailed(name: string, reason?: string): void {
  console.warn(
    `[webmcp] Failed to register tool "${name}". `
    + `${reason ?? 'It may already be registered or the browser does not support WebMCP.'}`,
  )
}

export function jsonResult(data: unknown): { content: [{ type: 'text', text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

export function errorResult(msg: string): { content: [{ type: 'text', text: string }] } {
  return jsonResult({ error: msg } satisfies ToolError)
}
