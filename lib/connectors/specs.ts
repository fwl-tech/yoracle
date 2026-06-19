import type { ConnectorType } from '@/types'

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
      { key: 'client_id', label: 'Connected App Client ID', type: 'text' },
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
      { key: 'account_id', label: 'Account ID', type: 'text' },
      { key: 'consumer_key', label: 'Consumer Key', type: 'text' },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password' },
      { key: 'token_id', label: 'Token ID', type: 'password' },
      { key: 'token_secret', label: 'Token Secret', type: 'password' },
    ],
  },
  {
    id: 'sap',
    label: 'SAP',
    logo: '/apps/yoracle/logos/sap.svg',
    required_fields: [
      { key: 'base_url', label: 'OData Service Base URL', type: 'url' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  {
    id: 'zendesk',
    label: 'Zendesk',
    logo: '/apps/yoracle/logos/zendesk.svg',
    required_fields: [
      { key: 'subdomain', label: 'Subdomain', type: 'text' },
      { key: 'email', label: 'Agent Email', type: 'text' },
      { key: 'api_token', label: 'API Token', type: 'password' },
    ],
  },
]
