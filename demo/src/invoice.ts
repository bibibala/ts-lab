export interface Invoice {
  id: string
  customer: string
  amount: number
  taxRate: number
  note: string
  status: string
  [key: string]: unknown
}

export const INVOICE_FIELDS = {
  id: { type: 'string' as const, description: 'Invoice ID, e.g. INV-001' },
  customer: { type: 'string' as const, description: 'Customer name' },
  amount: { type: 'number' as const, description: 'Invoice amount (pre-tax)' },
  taxRate: { type: 'number' as const, description: 'Tax rate, e.g. 0.06 or 0.13' },
  note: { type: 'string' as const, description: 'Optional note' },
  status: { type: 'string' as const, description: 'Invoice status' },
}

export const FORM_FIELDS = {
  customer: { type: 'string' as const, description: 'Customer name' },
  amount: { type: 'number' as const, description: 'Invoice amount (pre-tax)' },
  taxRate: { type: 'number' as const, description: 'Tax rate, e.g. 0.06 (6%) or 0.13 (13%)' },
  note: { type: 'string' as const, description: 'Optional note' },
}

export function taxAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}
