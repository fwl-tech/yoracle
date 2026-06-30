import { describe, it, expect } from 'vitest'
import { SUPPORTED_CONNECTORS } from '@/lib/connectors/specs'
import type { ConnectorType } from '@/types'

const VALID_CONNECTOR_IDS: ConnectorType[] = ['salesforce', 'hubspot', 'netsuite', 'sap', 'zendesk']

describe('ConnectorType values', () => {
  it('SUPPORTED_CONNECTORS covers all expected connector types', () => {
    const ids = SUPPORTED_CONNECTORS.map(c => c.id)
    for (const id of VALID_CONNECTOR_IDS) {
      expect(ids).toContain(id)
    }
  })

  it('each connector spec has a label and logo', () => {
    for (const c of SUPPORTED_CONNECTORS) {
      expect(typeof c.label).toBe('string')
      expect(c.label.length).toBeGreaterThan(0)
      expect(typeof c.logo).toBe('string')
      expect(c.logo).toContain('/apps/yoracle/')
    }
  })

  it('salesforce requires instance_url, client_id, client_secret', () => {
    const sf = SUPPORTED_CONNECTORS.find(c => c.id === 'salesforce')!
    const keys = sf.required_fields.map(f => f.key)
    expect(keys).toContain('instance_url')
    expect(keys).toContain('client_id')
    expect(keys).toContain('client_secret')
  })

  it('hubspot requires access_token only', () => {
    const hs = SUPPORTED_CONNECTORS.find(c => c.id === 'hubspot')!
    expect(hs.required_fields).toHaveLength(1)
    expect(hs.required_fields[0].key).toBe('access_token')
  })

  it('netsuite requires 5 fields including account_id and token_secret', () => {
    const ns = SUPPORTED_CONNECTORS.find(c => c.id === 'netsuite')!
    expect(ns.required_fields).toHaveLength(5)
    const keys = ns.required_fields.map(f => f.key)
    expect(keys).toContain('account_id')
    expect(keys).toContain('token_secret')
  })

  it('zendesk requires subdomain, email, api_token', () => {
    const zd = SUPPORTED_CONNECTORS.find(c => c.id === 'zendesk')!
    const keys = zd.required_fields.map(f => f.key)
    expect(keys).toContain('subdomain')
    expect(keys).toContain('email')
    expect(keys).toContain('api_token')
  })

  it('instance_url field in salesforce is type url', () => {
    const sf = SUPPORTED_CONNECTORS.find(c => c.id === 'salesforce')!
    const field = sf.required_fields.find(f => f.key === 'instance_url')!
    expect(field.type).toBe('url')
  })

  it('all password and secret fields are marked as type password', () => {
    for (const c of SUPPORTED_CONNECTORS) {
      for (const f of c.required_fields) {
        if (f.key.includes('_secret') || f.key.includes('api_token') || f.key === 'password') {
          expect(f.type).toBe('password')
        }
      }
    }
  })
})
