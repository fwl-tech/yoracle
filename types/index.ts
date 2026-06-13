export type UserRole =
  | 'ceo' | 'cro' | 'cmo' | 'coo' | 'cfo' | 'cco'
  | 'vp_sales' | 'vp_marketing' | 'vp_operations' | 'vp_finance' | 'vp_customer_success'
  | 'admin'

export type InsightStatus   = 'new' | 'reviewed' | 'actioned'
export type InsightSeverity = 'info' | 'warning' | 'critical'
export type InsightCategory = 'revenue' | 'customer' | 'profitability' | 'operations' | 'general'
export type ConnectorType   = 'salesforce' | 'hubspot' | 'netsuite' | 'sap' | 'zendesk'
export type ConnectorStatus = 'active' | 'error' | 'syncing' | 'disconnected'
export type DigestChannel   = 'email' | 'slack' | 'web'
export type WorkflowStatus  = 'pending' | 'success' | 'failed'
export type KpiFormat       = 'currency' | 'percentage' | 'number' | 'duration'

export interface Organisation {
  id: string
  name: string
  industry: string | null
  size: string | null
  ontology_version: number
  created_at: string
}

export interface Ontology {
  id: string
  org_id: string
  version: number
  customer_definition: Record<string, unknown>
  revenue_model: Record<string, unknown>
  cost_structure: Record<string, unknown>
  departments: string[]
  saas_connections: string[]
  created_at: string
}

export interface User {
  id: string
  clerk_user_id: string
  org_id: string
  email: string
  name: string | null
  role: UserRole
  department: string | null
  rbac_permissions: Record<string, boolean>
  timezone: string
  notification_prefs: {
    email: boolean
    slack: boolean
    digest_time: string
  }
  created_at: string
}

export interface UserContext {
  id: string
  user_id: string
  conversation_history: ChatMessage[]
  preference_signals: Record<string, unknown>
  last_active: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: string[]
}

export interface Connector {
  id: string
  org_id: string
  system_type: ConnectorType
  last_synced: string | null
  status: ConnectorStatus
  created_at: string
}

export interface SuggestedAction {
  id: string
  label: string
  description: string
  target_system: ConnectorType
  action_type: string
  payload: Record<string, unknown>
}

export interface MetricRef {
  name: string
  value: number | string
  delta: number | null
  unit: string
  source: ConnectorType
}

export interface Insight {
  id: string
  org_id: string
  user_id: string
  generated_at: string
  title: string
  body: string
  category: InsightCategory
  severity: InsightSeverity
  metric_refs: MetricRef[]
  suggested_actions: SuggestedAction[]
  status: InsightStatus
}

export interface KpiDefinition {
  id: string
  label: string
  description: string
  category: InsightCategory
  roles: UserRole[]
  unit: string
  format: KpiFormat
}

export interface KpiData {
  definition: KpiDefinition
  current: number
  previous: number
  delta: number
  delta_pct: number
  sparkline: number[]
  source: ConnectorType | null
  updated_at: string
}

export interface Dashboard {
  id: string
  label: string
  description: string
  roles: UserRole[]
  kpi_ids: string[]
}

export interface WorkflowTrigger {
  id: string
  user_id: string
  insight_id: string | null
  action_type: string
  target_system: ConnectorType
  payload: Record<string, unknown>
  triggered_at: string
  status: WorkflowStatus
}

export interface DigestDelivery {
  id: string
  user_id: string
  date: string
  channel: DigestChannel
  insight_ids: string[]
  delivered_at: string
}

export interface OnboardingQuestion {
  id: string
  field: keyof Ontology
  question: string
  hint: string
  required_for_kpis: string[]
}

export interface OntologyCompleteness {
  complete: boolean
  missing_fields: string[]
  unlocked_kpis: string[]
  locked_kpis: string[]
  completion_pct: number
}
