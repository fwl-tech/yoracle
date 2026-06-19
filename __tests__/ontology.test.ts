import { describe, it, expect } from 'vitest'
import {
  applyOnboardingAnswer,
  evaluateCompleteness,
  getNextOnboardingQuestion,
  ONBOARDING_QUESTIONS,
} from '@/lib/ontology'
import type { Ontology } from '@/types'

// ─── ONBOARDING_QUESTIONS integrity ────────────────────────────────────────

describe('ONBOARDING_QUESTIONS', () => {
  it('has 7 questions', () => {
    expect(ONBOARDING_QUESTIONS).toHaveLength(7)
  })

  it('all question ids are unique', () => {
    const ids = ONBOARDING_QUESTIONS.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all fields are valid Ontology fields', () => {
    const validFields = ['customer_definition', 'revenue_model', 'cost_structure', 'departments', 'saas_connections']
    for (const q of ONBOARDING_QUESTIONS) {
      expect(validFields).toContain(q.field)
    }
  })

  it('all questions have hint and required_for_kpis', () => {
    for (const q of ONBOARDING_QUESTIONS) {
      expect(q.hint).toBeTruthy()
      expect(Array.isArray(q.required_for_kpis)).toBe(true)
    }
  })
})

// ─── applyOnboardingAnswer ──────────────────────────────────────────────────

describe('applyOnboardingAnswer', () => {
  it('returns the same reference for an unknown question id', () => {
    const ontology: Partial<Ontology> = {}
    const result = applyOnboardingAnswer(ontology, 'non-existent-id', 'answer')
    expect(result).toBe(ontology)
  })

  it('returns the same reference for __init__ (not a real question)', () => {
    const ontology: Partial<Ontology> = {}
    const result = applyOnboardingAnswer(ontology, '__init__', 'answer')
    expect(result).toBe(ontology)
  })

  it('does not mutate the original ontology object', () => {
    const ontology: Partial<Ontology> = {}
    const frozen = Object.freeze({ ...ontology })
    // applying a real question should return a NEW object
    const result = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    expect(result).not.toBe(frozen)
  })

  it('q-departments: splits by comma, trims, and filters empty strings', () => {
    const result = applyOnboardingAnswer({}, 'q-departments', 'Sales, Marketing, , Engineering')
    expect(result.departments).toEqual(['Sales', 'Marketing', 'Engineering'])
  })

  it('q-departments: handles single item with no commas', () => {
    const result = applyOnboardingAnswer({}, 'q-departments', 'Engineering')
    expect(result.departments).toEqual(['Engineering'])
  })

  it('q-customer-type: merges into customer_definition under question key', () => {
    const result = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    expect(result.customer_definition).toEqual({ 'q-customer-type': 'B2B' })
  })

  it('q-customer-segments: merges with existing customer_definition keys', () => {
    const base = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    const result = applyOnboardingAnswer(base, 'q-customer-segments', 'Enterprise, SMB')
    expect(result.customer_definition).toEqual({
      'q-customer-type': 'B2B',
      'q-customer-segments': 'Enterprise, SMB',
    })
  })

  it('q-revenue-model: merges into revenue_model under question key', () => {
    const result = applyOnboardingAnswer({}, 'q-revenue-model', 'Subscription')
    expect(result.revenue_model).toEqual({ 'q-revenue-model': 'Subscription' })
  })

  it('q-primary-metric: merges into revenue_model preserving existing keys', () => {
    const base = applyOnboardingAnswer({}, 'q-revenue-model', 'Subscription')
    const result = applyOnboardingAnswer(base, 'q-primary-metric', 'ARR')
    expect(result.revenue_model).toEqual({
      'q-revenue-model': 'Subscription',
      'q-primary-metric': 'ARR',
    })
  })

  it('q-cost-structure: merges into cost_structure under question key', () => {
    const result = applyOnboardingAnswer({}, 'q-cost-structure', 'Headcount 60%, Cloud 20%')
    expect(result.cost_structure).toEqual({ 'q-cost-structure': 'Headcount 60%, Cloud 20%' })
  })

  it('q-saas-tools: splits into saas_connections array', () => {
    const result = applyOnboardingAnswer({}, 'q-saas-tools', 'Salesforce, HubSpot, Zendesk')
    expect(result.saas_connections).toEqual(['salesforce', 'hubspot', 'zendesk'])
  })
})

// ─── evaluateCompleteness ───────────────────────────────────────────────────

describe('evaluateCompleteness', () => {
  it('empty ontology: completion_pct=0, complete=false, all 5 fields missing', () => {
    const result = evaluateCompleteness({})
    expect(result.completion_pct).toBe(0)
    expect(result.complete).toBe(false)
    expect(result.missing_fields).toContain('customer_definition')
    expect(result.missing_fields).toContain('revenue_model')
    expect(result.missing_fields).toContain('cost_structure')
    expect(result.missing_fields).toContain('departments')
    expect(result.missing_fields).toContain('saas_connections')
    expect(result.missing_fields).toHaveLength(5)
  })

  it('only customer_definition filled: completion_pct=30', () => {
    const ontology = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    const result = evaluateCompleteness(ontology)
    expect(result.completion_pct).toBe(30)
    expect(result.missing_fields).not.toContain('customer_definition')
  })

  it('only revenue_model filled: completion_pct=30', () => {
    const ontology = applyOnboardingAnswer({}, 'q-revenue-model', 'Subscription')
    const result = evaluateCompleteness(ontology)
    expect(result.completion_pct).toBe(30)
  })

  it('only cost_structure filled: completion_pct=20', () => {
    const ontology = applyOnboardingAnswer({}, 'q-cost-structure', 'Headcount 60%')
    const result = evaluateCompleteness(ontology)
    expect(result.completion_pct).toBe(20)
  })

  it('only departments filled: completion_pct=10', () => {
    const ontology = applyOnboardingAnswer({}, 'q-departments', 'Sales, Engineering')
    const result = evaluateCompleteness(ontology)
    expect(result.completion_pct).toBe(10)
  })

  it('only saas_connections filled: completion_pct=10', () => {
    const ontology: Partial<Ontology> = { saas_connections: ['salesforce'] as unknown as Ontology['saas_connections'] }
    const result = evaluateCompleteness(ontology)
    expect(result.completion_pct).toBe(10)
  })

  it('customer_definition + revenue_model: completion_pct=60', () => {
    let o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    o = applyOnboardingAnswer(o, 'q-revenue-model', 'Subscription')
    const result = evaluateCompleteness(o)
    expect(result.completion_pct).toBe(60)
  })

  it('all 4 onboarding fields filled (no saas_connections): completion_pct=90', () => {
    let o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    o = applyOnboardingAnswer(o, 'q-revenue-model', 'Subscription')
    o = applyOnboardingAnswer(o, 'q-cost-structure', 'Headcount 60%')
    o = applyOnboardingAnswer(o, 'q-departments', 'Sales, Engineering')
    const result = evaluateCompleteness(o)
    expect(result.completion_pct).toBe(90)
    expect(result.complete).toBe(false)
  })

  it('all fields complete: completion_pct=100, complete=true, missing_fields=[]', () => {
    let o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    o = applyOnboardingAnswer(o, 'q-revenue-model', 'Subscription')
    o = applyOnboardingAnswer(o, 'q-cost-structure', 'Headcount 60%')
    o = applyOnboardingAnswer(o, 'q-departments', 'Sales, Engineering')
    o = { ...o, saas_connections: ['salesforce'] as unknown as Ontology['saas_connections'] }
    const result = evaluateCompleteness(o)
    expect(result.completion_pct).toBe(100)
    expect(result.complete).toBe(true)
    expect(result.missing_fields).toHaveLength(0)
  })

  it('unlocked_kpis contains KPIs from filled fields only', () => {
    const o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    const result = evaluateCompleteness(o)
    expect(result.unlocked_kpis).toContain('customer-count')
    expect(result.unlocked_kpis).toContain('churn-rate')
    expect(result.unlocked_kpis).toContain('nrr')
  })

  it('locked_kpis and unlocked_kpis have no overlap', () => {
    const o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    const result = evaluateCompleteness(o)
    const overlap = result.unlocked_kpis.filter(k => result.locked_kpis.includes(k))
    expect(overlap).toHaveLength(0)
  })

  it('fully complete ontology: locked_kpis is empty', () => {
    let o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    o = applyOnboardingAnswer(o, 'q-customer-segments', 'Enterprise')
    o = applyOnboardingAnswer(o, 'q-revenue-model', 'Subscription')
    o = applyOnboardingAnswer(o, 'q-primary-metric', 'ARR')
    o = applyOnboardingAnswer(o, 'q-cost-structure', 'Headcount 60%')
    o = applyOnboardingAnswer(o, 'q-departments', 'Sales')
    o = { ...o, saas_connections: ['salesforce'] as unknown as Ontology['saas_connections'] }
    const result = evaluateCompleteness(o)
    expect(result.locked_kpis).toHaveLength(0)
  })
})

// ─── getNextOnboardingQuestion ──────────────────────────────────────────────

describe('getNextOnboardingQuestion', () => {
  it('returns first question when ontology is empty', () => {
    const q = getNextOnboardingQuestion({}, 'ceo')
    expect(q).not.toBeNull()
    expect(q!.id).toBe('q-customer-type')
  })

  it('skips already-answered questions', () => {
    const o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    const q = getNextOnboardingQuestion(o, 'ceo')
    expect(q).not.toBeNull()
    expect(q!.id).toBe('q-customer-segments')
  })

  it('returns null when all fields are complete', () => {
    let o = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
    o = applyOnboardingAnswer(o, 'q-customer-segments', 'Enterprise')
    o = applyOnboardingAnswer(o, 'q-revenue-model', 'Subscription')
    o = applyOnboardingAnswer(o, 'q-primary-metric', 'ARR')
    o = applyOnboardingAnswer(o, 'q-cost-structure', 'Headcount 60%')
    o = applyOnboardingAnswer(o, 'q-departments', 'Sales')
    o = applyOnboardingAnswer(o, 'q-saas-tools', 'Salesforce')
    const q = getNextOnboardingQuestion(o, 'ceo')
    expect(q).toBeNull()
  })

  it('ignores the role parameter (returns same question for any role)', () => {
    const q1 = getNextOnboardingQuestion({}, 'ceo')
    const q2 = getNextOnboardingQuestion({}, 'cfo')
    const q3 = getNextOnboardingQuestion({}, 'vp_operations')
    expect(q1!.id).toBe(q2!.id)
    expect(q2!.id).toBe(q3!.id)
  })
})
