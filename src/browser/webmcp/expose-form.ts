import type { ExposeFormOptions } from './types'
import { exposeFunction } from './expose-function'

/**
 * Expose a "fill a form" tool bound to a reactive object (e.g. a Vue
 * `reactive()`). By default the AI can only fill fields — actually
 * submitting still requires a human click, unless `allowSubmit: true`.
 *
 * Registers one or two tools:
 * - `{name}_fill`   — fill form fields (always)
 * - `{name}_submit` — submit the form (only when `allowSubmit: true`)
 *
 * @example
 * ```ts
 * const form = reactive({ customer: '', amount: 0, taxRate: 0 })
 *
 * exposeForm('invoiceForm', form, {
 *   description: 'Fill the invoice form fields',
 *   fields: {
 *     customer: { type: 'string', description: 'Customer name' },
 *     amount:   { type: 'number', description: 'Invoice amount' },
 *     taxRate:  { type: 'number', description: 'Tax rate, e.g. 0.06' },
 *   },
 *   required: ['customer', 'amount'],
 *   allowSubmit: true,
 *   onSubmit: () => submitInvoice(form),
 * })
 * ```
 */
export function exposeForm<T extends Record<string, unknown>>(
  name: string,
  formState: T,
  options: ExposeFormOptions,
): boolean {
  const filled = exposeFunction(
    `${name}_fill`,
    async (params: Partial<T>) => {
      Object.assign(formState, params)
      return { filled: true, current: { ...formState } }
    },
    {
      description: `Fill the ${name} form fields. ${options.description}`,
      params: options.fields,
      required: options.required,
    },
  )

  if (options.allowSubmit) {
    exposeFunction(
      `${name}_submit`,
      async () => {
        await options.onSubmit?.()
        return { submitted: true }
      },
      { description: `Submit the ${name} form (save/send current field values).` },
    )
  }

  return filled
}
