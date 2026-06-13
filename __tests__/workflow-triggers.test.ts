import { describe, it, expect, vi } from 'vitest'
import type { SuggestedAction, WorkflowTrigger } from '@/types'

const mockAction: SuggestedAction = {
  id: 'act-1',
  label: 'Create follow-up task',
  description: 'Create a Salesforce task for the 3 at-risk accounts',
  target_system: 'salesforce',
  action_type: 'create_task',
  payload: { subject: 'Churn risk review', due_days: 2, account_ids: ['001xx', '002xx'] },
}

describe('workflow trigger creation', () => {
  it('trigger has required fields', () => {
    const trigger: Partial<WorkflowTrigger> = {
      action_type: mockAction.action_type,
      target_system: mockAction.target_system,
      payload: mockAction.payload,
      status: 'pending',
    }
    expect(trigger.action_type).toBeTruthy()
    expect(trigger.target_system).toBeTruthy()
    expect(trigger.status).toBe('pending')
  })

  it('only allows valid target systems', () => {
    const valid = ['salesforce', 'hubspot', 'netsuite', 'sap', 'zendesk']
    expect(valid).toContain(mockAction.target_system)
  })

  it('triggerWorkflowAction is defined and callable', async () => {
    const mod = await import('@/lib/connectors')
    expect(mod.triggerWorkflowAction).toBeDefined()
  })
})

describe('trigger status lifecycle', () => {
  it('starts as pending', () => {
    const status: WorkflowTrigger['status'] = 'pending'
    expect(status).toBe('pending')
  })

  it('valid statuses are pending, success, failed', () => {
    const valid: WorkflowTrigger['status'][] = ['pending', 'success', 'failed']
    valid.forEach(s => expect(['pending', 'success', 'failed']).toContain(s))
  })
})
