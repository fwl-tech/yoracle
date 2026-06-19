import type { UserRole } from '@/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  ceo: 'CEO',
  cro: 'CRO',
  cmo: 'CMO',
  coo: 'COO',
  cfo: 'CFO',
  cco: 'CCO',
  vp_sales: 'VP Sales',
  vp_marketing: 'VP Marketing',
  vp_operations: 'VP Operations',
  vp_finance: 'VP Finance',
  vp_customer_success: 'VP Customer Success',
  admin: 'Admin',
}

export const ASSIGNABLE_ROLES: UserRole[] = [
  'ceo', 'cro', 'cmo', 'coo', 'cfo', 'cco',
  'vp_sales', 'vp_marketing', 'vp_operations', 'vp_finance', 'vp_customer_success',
]

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}
