import { describe, it, expect } from 'vitest'
import { evaluateCompleteness, getNextOnboardingQuestion, ONBOARDING_QUESTIONS } from '@/lib/ontology'
import type { Ontology } from '@/types'

const emptyOntology: Partial<Ontology> = {
  customer_definition: {},
  revenue_model: {},
  cost_structure: {},
  departments: [],
  saas_connections: [],
}

const partialOntology: Partial<Ontology> = {
  customer_definition: { type: 'B2B', segments: ['enterprise'] },
  revenue_model: { type: 'SaaS', primary_metric: 'ARR' },
  cost_structure: {},
  departments: [],
  saas_connections: [],
}

const fullOntology: Partial<Ontology> = {
  customer_definition: { type: 'B2B', segments: ['enterprise', 'mid-market'], churn_definition: 'no renewal in 90 days' },
  revenue_model: { type: 'SaaS', primary_metric: 'ARR', billing_cadence: 'annual' },
  cost_structure: { cogs_pct: 0.2, main_costs: ['headcount', 'cloud', 'marketing'] },
  departments: ['sales', 'marketing', 'engineering', 'customer_success', 'finance'],
  saas_connections: ['salesforce', 'hubspot', 'netsuite'],
}

describe('evaluateCompleteness', () => {
  it('returns 0% for empty ontology', () => {
    const result = evaluateCompleteness(emptyOntology)
    expect(result.completion_pct).toBe(0)
    expect(result.complete).toBe(false)
  })

  it('returns partial completion for partial ontology', () => {
    const result = evaluateCompleteness(partialOntology)
    expect(result.completion_pct).toBeGreaterThan(0)
    expect(result.completion_pct).toBeLessThan(100)
  })

  it('returns 100% and unlocks KPIs for full ontology', () => {
    const result = evaluateCompleteness(fullOntology)
    expect(result.completion_pct).toBeGreaterThanOrEqual(80)
    expect(result.unlocked_kpis.length).toBeGreaterThan(0)
  })

  it('identifies missing fields correctly', () => {
    const result = evaluateCompleteness(emptyOntology)
    expect(result.missing_fields).toContain('customer_definition')
    expect(result.missing_fields).toContain('revenue_model')
  })
})

describe('getNextOnboardingQuestion', () => {
  it('returns first question for empty ontology', () => {
    const q = getNextOnboardingQuestion(emptyOntology, 'ceo')
    expect(q).toBeDefined()
    expect(q!.question).toBeTruthy()
  })

  it('returns null when ontology is complete', () => {
    const q = getNextOnboardingQuestion(fullOntology, 'ceo')
    expect(q).toBeNull()
  })
})

describe('ONBOARDING_QUESTIONS', () => {
  it('has questions for all required ontology fields', () => {
    const fields = ONBOARDING_QUESTIONS.map(q => q.field)
    expect(fields).toContain('customer_definition')
    expect(fields).toContain('revenue_model')
    expect(fields).toContain('cost_structure')
  })
})
