import type { Ontology, OntologyCompleteness, OnboardingQuestion, UserRole } from '@/types'

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q-customer-type',
    field: 'customer_definition',
    question: 'How would you describe your customers — are they businesses (B2B), consumers (B2C), or both?',
    hint: 'e.g. Mid-market SaaS companies with 50-500 employees',
    required_for_kpis: ['customer-count', 'churn-rate', 'nrr'],
  },
  {
    id: 'q-customer-segments',
    field: 'customer_definition',
    question: 'What are your main customer segments?',
    hint: 'e.g. Enterprise, Mid-market, SMB — or by industry vertical',
    required_for_kpis: ['customer-count', 'churn-rate'],
  },
  {
    id: 'q-revenue-model',
    field: 'revenue_model',
    question: 'How does the business make money — subscription, usage-based, one-time sales, or a mix?',
    hint: 'e.g. Annual SaaS subscriptions with usage-based add-ons',
    required_for_kpis: ['arr', 'mrr', 'arpu'],
  },
  {
    id: 'q-primary-metric',
    field: 'revenue_model',
    question: 'What is your north-star revenue metric?',
    hint: 'e.g. ARR, GMV, Revenue, Bookings',
    required_for_kpis: ['arr', 'mrr'],
  },
  {
    id: 'q-cost-structure',
    field: 'cost_structure',
    question: 'What are your biggest cost buckets?',
    hint: 'e.g. Headcount (60%), Cloud infrastructure (15%), Marketing (10%)',
    required_for_kpis: ['gross-margin', 'cac', 'ebitda'],
  },
  {
    id: 'q-departments',
    field: 'departments',
    question: 'Which departments make up the business?',
    hint: 'e.g. Sales, Marketing, Engineering, Customer Success, Finance, Operations',
    required_for_kpis: [],
  },
  {
    id: 'q-saas-tools',
    field: 'saas_connections',
    question: 'Which SaaS tools does your business use for CRM, ERP, support, or finance?',
    hint: 'e.g. Salesforce, HubSpot, NetSuite, SAP, Zendesk — list all that apply',
    required_for_kpis: ['arr', 'customer-count', 'ticket-volume'],
  },
]

const FIELD_WEIGHTS: Record<string, number> = {
  customer_definition: 30,
  revenue_model: 30,
  cost_structure: 20,
  departments: 10,
  saas_connections: 10,
}

function isFieldComplete(ontology: Partial<Ontology>, field: string): boolean {
  const val = (ontology as Record<string, unknown>)[field]
  if (!val) return false
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'object') return Object.keys(val as object).length > 0
  return false
}

function isQuestionAnswered(ontology: Partial<Ontology>, question: OnboardingQuestion): boolean {
  if (question.field === 'departments') return (ontology.departments?.length ?? 0) > 0
  if (question.field === 'saas_connections') return (ontology.saas_connections?.length ?? 0) > 0
  const val = ontology[question.field] as Record<string, unknown> | undefined
  return !!(val && question.id in val)
}

export function evaluateCompleteness(ontology: Partial<Ontology>): OntologyCompleteness {
  const missing_fields: string[] = []
  let score = 0

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    if (isFieldComplete(ontology, field)) {
      score += weight
    } else {
      missing_fields.push(field)
    }
  }

  const unlocked_kpis = ONBOARDING_QUESTIONS
    .filter(q => isFieldComplete(ontology, q.field))
    .flatMap(q => q.required_for_kpis)
    .filter((v, i, a) => a.indexOf(v) === i)

  const all_kpis = ONBOARDING_QUESTIONS.flatMap(q => q.required_for_kpis).filter((v, i, a) => a.indexOf(v) === i)
  const locked_kpis = all_kpis.filter(k => !unlocked_kpis.includes(k))

  return {
    complete: missing_fields.length === 0,
    missing_fields,
    unlocked_kpis,
    locked_kpis,
    completion_pct: score,
  }
}

export function getNextOnboardingQuestion(
  ontology: Partial<Ontology>,
  _role: UserRole,
): OnboardingQuestion | null {
  for (const q of ONBOARDING_QUESTIONS) {
    if (!isQuestionAnswered(ontology, q)) return q
  }
  return null
}

export function applyOnboardingAnswer(
  ontology: Partial<Ontology>,
  questionId: string,
  answer: string,
): Partial<Ontology> {
  const question = ONBOARDING_QUESTIONS.find(q => q.id === questionId)
  if (!question) return ontology

  const updated = { ...ontology }
  const field = question.field as keyof Ontology

  if (field === 'departments') {
    updated.departments = answer.split(',').map(s => s.trim()).filter(Boolean)
  } else if (field === 'saas_connections') {
    updated.saas_connections = answer.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  } else if (field === 'customer_definition' || field === 'revenue_model' || field === 'cost_structure') {
    updated[field] = {
      ...(updated[field] as Record<string, unknown> ?? {}),
      [questionId]: answer,
    } as Record<string, unknown>
  }

  return updated
}
