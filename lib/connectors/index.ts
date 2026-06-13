import { encryptAuthConfig, decryptAuthConfig } from '@/lib/encrypt'
import type { ConnectorType } from '@/types'

export { encryptAuthConfig, decryptAuthConfig }

export interface ConnectorSpec {
  id: ConnectorType
  label: string
  logo: string
  required_fields: { key: string; label: string; type: 'text' | 'password' | 'url' }[]
}

export const SUPPORTED_CONNECTORS: ConnectorSpec[] = [
  {
    id: 'salesforce',
    label: 'Salesforce',
    logo: '/apps/yoracle/logos/salesforce.svg',
    required_fields: [
      { key: 'instance_url', label: 'Instance URL', type: 'url' },
      { key: 'client_id',    label: 'Connected App Client ID', type: 'text' },
      { key: 'client_secret', label: 'Connected App Client Secret', type: 'password' },
    ],
  },
  {
    id: 'hubspot',
    label: 'HubSpot',
    logo: '/apps/yoracle/logos/hubspot.svg',
    required_fields: [
      { key: 'access_token', label: 'Private App Access Token', type: 'password' },
    ],
  },
  {
    id: 'netsuite',
    label: 'NetSuite',
    logo: '/apps/yoracle/logos/netsuite.svg',
    required_fields: [
      { key: 'account_id',      label: 'Account ID', type: 'text' },
      { key: 'consumer_key',    label: 'Consumer Key', type: 'text' },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password' },
      { key: 'token_id',        label: 'Token ID', type: 'text' },
      { key: 'token_secret',    label: 'Token Secret', type: 'password' },
    ],
  },
  {
    id: 'sap',
    label: 'SAP',
    logo: '/apps/yoracle/logos/sap.svg',
    required_fields: [
      { key: 'base_url',  label: 'OData Service Base URL', type: 'url' },
      { key: 'username',  label: 'Username', type: 'text' },
      { key: 'password',  label: 'Password', type: 'password' },
    ],
  },
  {
    id: 'zendesk',
    label: 'Zendesk',
    logo: '/apps/yoracle/logos/zendesk.svg',
    required_fields: [
      { key: 'subdomain',  label: 'Subdomain', type: 'text' },
      { key: 'email',      label: 'Agent Email', type: 'text' },
      { key: 'api_token',  label: 'API Token', type: 'password' },
    ],
  },
]

export async function triggerWorkflowAction(
  targetSystem: ConnectorType,
  actionType: string,
  payload: Record<string, unknown>,
  authConfigEncrypted: string,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const secret = process.env.CONNECTOR_ENCRYPTION_KEY!
  const auth = decryptAuthConfig(authConfigEncrypted, secret)

  try {
    switch (targetSystem) {
      case 'salesforce': return await triggerSalesforce(actionType, payload, auth)
      case 'hubspot':    return await triggerHubspot(actionType, payload, auth)
      case 'zendesk':    return await triggerZendesk(actionType, payload, auth)
      default: return { success: false, error: `Write-back not yet supported for ${targetSystem}` }
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

async function triggerSalesforce(
  actionType: string,
  payload: Record<string, unknown>,
  auth: Record<string, unknown>,
): Promise<{ success: boolean; result?: unknown }> {
  const baseUrl = `${auth.instance_url}/services/data/v59.0`
  const tokenRes = await fetch(`${auth.instance_url}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: auth.client_id as string,
      client_secret: auth.client_secret as string,
    }),
  })
  const { access_token } = await tokenRes.json()
  const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }

  if (actionType === 'create_task') {
    const r = await fetch(`${baseUrl}/sobjects/Task`, { method: 'POST', headers, body: JSON.stringify(payload) })
    return { success: r.ok, result: await r.json() }
  }
  return { success: false, error: `Unknown Salesforce action: ${actionType}` }
}

async function triggerHubspot(
  actionType: string,
  payload: Record<string, unknown>,
  auth: Record<string, unknown>,
): Promise<{ success: boolean; result?: unknown }> {
  const headers = { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' }
  if (actionType === 'create_task') {
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/tasks', { method: 'POST', headers, body: JSON.stringify({ properties: payload }) })
    return { success: r.ok, result: await r.json() }
  }
  return { success: false, error: `Unknown HubSpot action: ${actionType}` }
}

async function triggerZendesk(
  actionType: string,
  payload: Record<string, unknown>,
  auth: Record<string, unknown>,
): Promise<{ success: boolean; result?: unknown }> {
  const base = `https://${auth.subdomain}.zendesk.com/api/v2`
  const creds = Buffer.from(`${auth.email}/token:${auth.api_token}`).toString('base64')
  const headers = { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' }
  if (actionType === 'create_ticket') {
    const r = await fetch(`${base}/tickets`, { method: 'POST', headers, body: JSON.stringify({ ticket: payload }) })
    return { success: r.ok, result: await r.json() }
  }
  return { success: false, error: `Unknown Zendesk action: ${actionType}` }
}
